import { getBytes, ref, uploadString } from 'firebase/storage';
import { MENU_ORDER, MenuId, StudentProgress } from '../types/learning';
import { firebaseStorage } from './firebaseClient';

/**
 * Daftar slot data non-database Firebase (TIDAK menggunakan Cloud Firestore
 * dan TIDAK menggunakan Firebase Realtime Database).
 * Disimpan secara terstruktur per UID siswa + kelas + pertemuan + menu menggunakan:
 * 1) localStorage mirror (akses sinkron instan di peramban),
 * 2) IndexedDB (penyimpanan terstruktur persisten berkapasitas besar di peramban),
 * 3) Firebase Cloud Storage object blob (`student_workspace_sync/{uid}/{kelas}/{meetingId}.json`)
 *    dengan sinkronisasi berbasis perubahan (delta hash) & resolusi konflik timestamp terbaru.
 */
export type NonDbMenuSlot =
  | 'progress'
  | 'asesmen-awal'
  | 'pertanyaan-esensial'
  | 'eksplorasi-konsep'
  | 'for-learning'
  | 'as-learning';

export interface NonDbSlotEnvelope<T = unknown> {
  uid: string;
  kelas: string;
  meetingId: string;
  menu: NonDbMenuSlot;
  data: T;
  updatedAtMs: number;
  updatedAtIso: string;
  hash: string;
}

interface CloudMeetingObject {
  version: 1;
  uid: string;
  kelas: string;
  meetingId: string;
  updatedAtMs: number;
  slots: Partial<Record<NonDbMenuSlot, NonDbSlotEnvelope<unknown>>>;
}

const IDB_NAME = 'informatika_fun_workspace_v1';
const IDB_STORE = 'student_records';
const IDB_VERSION = 1;
const CLOUD_SYNC_PREFIX = 'student_workspace_sync';

let idbPromise: Promise<IDBDatabase | null> | null = null;
let isInternalMirrorWrite = false;
let localMirrorHookInstalled = false;

const slotListeners = new Map<
  string,
  Set<(envelope: NonDbSlotEnvelope<unknown> | null) => void>
>();
const meetingUpdateListeners = new Set<
  (info: { uid: string; meetingId: string; slot: NonDbMenuSlot }) => void
>();
const lastUploadedMeetingHash = new Map<string, string>();
const uploadTimers = new Map<string, number>();

const broadcastChannel: BroadcastChannel | null =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('infofun_workspace_sync_v1')
    : null;

export function normalizeCanonicalMeetingId(rawId: string): string {
  if (!rawId) return '';
  const lower = String(rawId).trim().toLowerCase();
  if (lower.startsWith('kelas9-sem2-bab1-')) {
    return lower.replace('kelas9-sem2-bab1-', 'kelas9-sem2-bab3-');
  }
  return lower;
}

export function extractKelasCode(meetingId: string): string {
  const canonical = normalizeCanonicalMeetingId(meetingId);
  const match = canonical.match(/^(kelas[789])/i);
  return match ? match[1].toLowerCase() : 'umum';
}

function sanitizeSegment(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 96);
}

function computeDeterministicHash(value: unknown): string {
  const json = JSON.stringify(value) || '';
  let h = 2166136261;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${(h >>> 0).toString(16)}_${json.length}`;
}

function buildCompositeSlotKey(
  uid: string,
  meetingId: string,
  slot: NonDbMenuSlot
): string {
  const canonical = normalizeCanonicalMeetingId(meetingId);
  const kelas = extractKelasCode(canonical);
  return `${sanitizeSegment(uid)}__${kelas}__${sanitizeSegment(canonical)}__${slot}`;
}

function buildEnvelopeLocalStorageKey(
  uid: string,
  meetingId: string,
  slot: NonDbMenuSlot
): string {
  return `infoFun_WS_${buildCompositeSlotKey(uid, meetingId, slot)}`;
}

/**
 * Mengembalikan kunci localStorage tampilan antarmuka untuk tiap menu agar
 * komponen Asesmen Awal, Pertanyaan Esensial, Eksplorasi Konsep, For Learning,
 * dan As Learning membaca data terbaru secara sinkron dan mulus.
 */
function getDirectUiMirrorKey(
  uid: string,
  canonicalMeetingId: string,
  slot: NonDbMenuSlot
): string {
  switch (slot) {
    case 'progress':
      return `infoFun_Progres_${uid}_${canonicalMeetingId}`;
    case 'asesmen-awal':
      return `infoFun_Asesmen_${uid}_${canonicalMeetingId}`;
    case 'pertanyaan-esensial':
      return `infoFun_PertanyaanEsensial_${uid}_${canonicalMeetingId}`;
    case 'eksplorasi-konsep':
      return `infoFun_Eksplorasi_${uid}_${canonicalMeetingId}`;
    case 'for-learning':
      return `infoFun_ForLearning_${uid}_${canonicalMeetingId}`;
    case 'as-learning':
      return `infoFun_ASL_${uid}_${canonicalMeetingId}`;
  }
}

function openWorkspaceIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (idbPromise) return idbPromise;

  idbPromise = new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return idbPromise;
}

async function idbPutEnvelope(
  compositeKey: string,
  envelope: NonDbSlotEnvelope<unknown>
): Promise<void> {
  const db = await openWorkspaceIndexedDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put({ id: compositeKey, envelope });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbGetEnvelope<T = unknown>(
  compositeKey: string
): Promise<NonDbSlotEnvelope<T> | null> {
  const db = await openWorkspaceIndexedDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(compositeKey);
      req.onsuccess = () => {
        const rec = req.result as { id: string; envelope?: NonDbSlotEnvelope<T> } | undefined;
        resolve(rec?.envelope || null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function readLocalEnvelope<T = unknown>(
  uid: string,
  meetingId: string,
  slot: NonDbMenuSlot
): NonDbSlotEnvelope<T> | null {
  const canonical = normalizeCanonicalMeetingId(meetingId);
  if (!uid || uid === 'guest' || !canonical) return null;

  const envKey = buildEnvelopeLocalStorageKey(uid, canonical, slot);
  try {
    const rawEnv = localStorage.getItem(envKey);
    if (rawEnv) {
      const parsed = JSON.parse(rawEnv) as NonDbSlotEnvelope<T>;
      if (parsed && parsed.uid === uid && typeof parsed.updatedAtMs === 'number') {
        return parsed;
      }
    }
  } catch {
    // Abaikan bila gagal parse
  }

  // Fallback migrasi dari cermin UI langsung bila sudah pernah diisi pada sesi ini
  const mirrorKey = getDirectUiMirrorKey(uid, canonical, slot);
  try {
    const rawMirror = localStorage.getItem(mirrorKey);
    if (rawMirror) {
      const data = JSON.parse(rawMirror) as T;
      const inferredIso =
        data && typeof data === 'object'
          ? String(
              (data as Record<string, unknown>).savedAtIso ||
                (data as Record<string, unknown>).savedAt ||
                (data as Record<string, unknown>).updatedAt ||
                ''
            )
          : '';
      const parsedMs = inferredIso ? Date.parse(inferredIso) : NaN;
      const updatedAtMs = Number.isFinite(parsedMs) ? parsedMs : 1;
      return {
        uid,
        kelas: extractKelasCode(canonical),
        meetingId: canonical,
        menu: slot,
        data,
        updatedAtMs,
        updatedAtIso: inferredIso || new Date(updatedAtMs).toISOString(),
        hash: computeDeterministicHash(data),
      };
    }
  } catch {
    // Abaikan
  }

  return null;
}

function writeLocalMirrorAndEnvelope<T = unknown>(
  envelope: NonDbSlotEnvelope<T>
): void {
  const canonical = normalizeCanonicalMeetingId(envelope.meetingId);
  const envKey = buildEnvelopeLocalStorageKey(
    envelope.uid,
    canonical,
    envelope.menu
  );
  const mirrorKey = getDirectUiMirrorKey(envelope.uid, canonical, envelope.menu);

  isInternalMirrorWrite = true;
  try {
    localStorage.setItem(envKey, JSON.stringify(envelope));
    localStorage.setItem(mirrorKey, JSON.stringify(envelope.data));

    if (envelope.menu === 'progress') {
      const prog = envelope.data as StudentProgress;
      const completedList = MENU_ORDER.filter((id) => prog[id] === 'completed');
      localStorage.setItem(
        `progresBelajar_${envelope.uid}_${canonical}`,
        JSON.stringify(completedList)
      );
    }
  } catch {
    // Abaikan bila kuota penyimpanan peramban penuh
  } finally {
    isInternalMirrorWrite = false;
  }
}

function notifySlotSubscribers(envelope: NonDbSlotEnvelope<unknown>): void {
  const compositeKey = buildCompositeSlotKey(
    envelope.uid,
    envelope.meetingId,
    envelope.menu
  );
  const subs = slotListeners.get(compositeKey);
  if (subs) {
    subs.forEach((cb) => {
      try {
        cb(envelope);
      } catch {
        // Abaikan error callback
      }
    });
  }
  meetingUpdateListeners.forEach((cb) => {
    try {
      cb({
        uid: envelope.uid,
        meetingId: envelope.meetingId,
        slot: envelope.menu,
      });
    } catch {
      // Abaikan
    }
  });
}

function buildCloudStoragePath(uid: string, canonicalMeetingId: string): string {
  const kelas = extractKelasCode(canonicalMeetingId);
  return `${CLOUD_SYNC_PREFIX}/${sanitizeSegment(uid)}/${kelas}/${sanitizeSegment(
    canonicalMeetingId
  )}.json`;
}

async function pullCloudMeetingObject(
  uid: string,
  canonicalMeetingId: string
): Promise<CloudMeetingObject | null> {
  if (!uid || uid === 'guest' || !canonicalMeetingId) return null;
  try {
    const objectRef = ref(
      firebaseStorage,
      buildCloudStoragePath(uid, canonicalMeetingId)
    );
    const bytes = await getBytes(objectRef, 512 * 1024);
    const text = new TextDecoder('utf-8').decode(bytes);
    const parsed = JSON.parse(text) as CloudMeetingObject;
    if (!parsed || parsed.uid !== uid || typeof parsed.slots !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    // Objek belum ada di Cloud Storage atau jaringan luring — aman diabaikan
    return null;
  }
}

function scheduleDeltaCloudUpload(uid: string, canonicalMeetingId: string): void {
  if (!uid || uid === 'guest' || !canonicalMeetingId) return;
  const timerKey = `${uid}__${canonicalMeetingId}`;
  const existing = uploadTimers.get(timerKey);
  if (existing !== undefined) {
    window.clearTimeout(existing);
  }

  const timerId = window.setTimeout(async () => {
    uploadTimers.delete(timerKey);
    try {
      const allSlots: NonDbMenuSlot[] = [
        'progress',
        'asesmen-awal',
        'pertanyaan-esensial',
        'eksplorasi-konsep',
        'for-learning',
        'as-learning',
      ];

      const localSlots: Partial<Record<NonDbMenuSlot, NonDbSlotEnvelope<unknown>>> =
        {};
      let maxUpdatedAtMs = 0;

      for (const slot of allSlots) {
        const compositeKey = buildCompositeSlotKey(uid, canonicalMeetingId, slot);
        const idbEnv = await idbGetEnvelope(compositeKey);
        const locEnv = readLocalEnvelope(uid, canonicalMeetingId, slot);
        const chosen =
          idbEnv && (!locEnv || idbEnv.updatedAtMs >= locEnv.updatedAtMs)
            ? idbEnv
            : locEnv;
        if (chosen) {
          localSlots[slot] = chosen;
          if (chosen.updatedAtMs > maxUpdatedAtMs) {
            maxUpdatedAtMs = chosen.updatedAtMs;
          }
        }
      }

      if (Object.keys(localSlots).length === 0) return;

      // Gabungkan dengan objek remote bila ada agar data lebih baru dari perangkat lain tidak tertimpa
      const remoteObj = await pullCloudMeetingObject(uid, canonicalMeetingId);
      const mergedSlots: Partial<Record<NonDbMenuSlot, NonDbSlotEnvelope<unknown>>> =
        { ...(remoteObj?.slots || {}) };

      for (const slot of allSlots) {
        const loc = localSlots[slot];
        const rem = mergedSlots[slot];
        if (loc && (!rem || loc.updatedAtMs >= rem.updatedAtMs)) {
          mergedSlots[slot] = loc;
        } else if (rem && (!loc || rem.updatedAtMs > loc.updatedAtMs)) {
          // Tarik balik slot remote yang lebih baru ke lokal
          writeLocalMirrorAndEnvelope(rem);
          await idbPutEnvelope(
            buildCompositeSlotKey(uid, canonicalMeetingId, slot),
            rem
          );
          notifySlotSubscribers(rem);
        }
        const winner = mergedSlots[slot];
        if (winner && winner.updatedAtMs > maxUpdatedAtMs) {
          maxUpdatedAtMs = winner.updatedAtMs;
        }
      }

      const payload: CloudMeetingObject = {
        version: 1,
        uid,
        kelas: extractKelasCode(canonicalMeetingId),
        meetingId: canonicalMeetingId,
        updatedAtMs: maxUpdatedAtMs || Date.now(),
        slots: mergedSlots,
      };

      const payloadHash = computeDeterministicHash(payload.slots);
      if (lastUploadedMeetingHash.get(timerKey) === payloadHash) {
        // Delta check: tidak ada perubahan data dibanding sinkronisasi terakhir
        return;
      }

      const objectRef = ref(
        firebaseStorage,
        buildCloudStoragePath(uid, canonicalMeetingId)
      );
      await uploadString(objectRef, JSON.stringify(payload), 'raw', {
        contentType: 'application/json',
        customMetadata: {
          uid,
          kelas: payload.kelas,
          meetingId: canonicalMeetingId,
          updatedAtMs: String(payload.updatedAtMs),
        },
      });
      lastUploadedMeetingHash.set(timerKey, payloadHash);
    } catch {
      // Tetap aman di IndexedDB & localStorage apabila jaringan luring atau aturan bucket terbatas
    }
  }, 450);

  uploadTimers.set(timerKey, timerId);
}

/**
 * Menyimpan rekaman jawaban/progres untuk menu non-database Firebase secara terikat pada
 * UID siswa + kelas + pertemuan + menu dengan deteksi perubahan (delta) dan timestamp terbaru.
 */
export async function saveNonDbMenuRecord<T = unknown>(params: {
  uid: string;
  meetingId: string;
  menu: NonDbMenuSlot;
  data: T;
  updatedAtIso?: string;
}): Promise<NonDbSlotEnvelope<T>> {
  const canonical = normalizeCanonicalMeetingId(params.meetingId);
  const kelas = extractKelasCode(canonical);
  const nowMs = Date.now();
  const parsedCustomMs = params.updatedAtIso
    ? Date.parse(params.updatedAtIso)
    : NaN;
  const updatedAtMs = Number.isFinite(parsedCustomMs) ? parsedCustomMs : nowMs;
  const updatedAtIso =
    params.updatedAtIso || new Date(updatedAtMs).toISOString();
  const newHash = computeDeterministicHash(params.data);

  const existing = readLocalEnvelope<T>(params.uid, canonical, params.menu);
  if (existing && existing.hash === newHash && existing.updatedAtMs >= updatedAtMs) {
    return existing;
  }

  const envelope: NonDbSlotEnvelope<T> = {
    uid: params.uid,
    kelas,
    meetingId: canonical,
    menu: params.menu,
    data: params.data,
    updatedAtMs: existing
      ? Math.max(updatedAtMs, existing.updatedAtMs + 1)
      : updatedAtMs,
    updatedAtIso,
    hash: newHash,
  };

  if (!params.uid || params.uid === 'guest' || !canonical) {
    return envelope;
  }

  writeLocalMirrorAndEnvelope(envelope);
  const compositeKey = buildCompositeSlotKey(params.uid, canonical, params.menu);
  await idbPutEnvelope(compositeKey, envelope);

  notifySlotSubscribers(envelope);
  try {
    broadcastChannel?.postMessage({ type: 'SLOT_UPDATED', envelope });
  } catch {
    // Abaikan
  }

  scheduleDeltaCloudUpload(params.uid, canonical);
  return envelope;
}

/**
 * Berlangganan rekaman jawaban untuk menu non-database Firebase (`for-learning`, `as-learning`, dll.)
 * dengan pemulihan berlapis: localStorage -> IndexedDB -> Cloud Storage object sync.
 * Menjamin resolusi konflik sehingga data paling baru berdasarkan `updatedAtMs` selalu menang.
 */
export function subscribeNonDbMenuRecord<T = unknown>(
  uid: string,
  meetingId: string,
  menu: NonDbMenuSlot,
  onData: (envelope: NonDbSlotEnvelope<T> | null) => void
): () => void {
  installWorkspaceLocalMirrorHook();

  const canonical = normalizeCanonicalMeetingId(meetingId);
  if (!uid || uid === 'guest' || !canonical) {
    onData(null);
    return () => {};
  }

  const compositeKey = buildCompositeSlotKey(uid, canonical, menu);
  let cancelled = false;
  let latestMsSeen = 0;

  const emitIfNewer = (env: NonDbSlotEnvelope<T> | null) => {
    if (cancelled) return;
    if (!env) {
      if (latestMsSeen === 0) onData(null);
      return;
    }
    if (env.uid !== uid || env.meetingId !== canonical) return;
    if (env.updatedAtMs >= latestMsSeen) {
      latestMsSeen = env.updatedAtMs;
      onData(env);
    }
  };

  // 1. Baca instan dari localStorage mirror
  const initialLocal = readLocalEnvelope<T>(uid, canonical, menu);
  if (initialLocal) {
    emitIfNewer(initialLocal);
  }

  // 2. Pulihkan dari IndexedDB lalu sinkronkan dari Cloud Storage lintas perangkat
  (async () => {
    const idbEnv = await idbGetEnvelope<T>(compositeKey);
    if (cancelled) return;
    if (idbEnv && (!initialLocal || idbEnv.updatedAtMs > initialLocal.updatedAtMs)) {
      writeLocalMirrorAndEnvelope(idbEnv);
      emitIfNewer(idbEnv);
    } else if (!initialLocal && !idbEnv) {
      // Tunggu hasil Cloud Storage sebelum menyatakan kosong
    }

    await hydrateMeetingWorkspace(uid, canonical);
    if (cancelled) return;
    const afterHydrate =
      (await idbGetEnvelope<T>(compositeKey)) ||
      readLocalEnvelope<T>(uid, canonical, menu);
    emitIfNewer(afterHydrate);
  })();

  if (!slotListeners.has(compositeKey)) {
    slotListeners.set(compositeKey, new Set());
  }
  const typedListener = (env: NonDbSlotEnvelope<unknown> | null) => {
    emitIfNewer(env as NonDbSlotEnvelope<T> | null);
  };
  slotListeners.get(compositeKey)!.add(typedListener);

  return () => {
    cancelled = true;
    slotListeners.get(compositeKey)?.delete(typedListener);
  };
}

/**
 * Memulihkan seluruh slot non-database Firebase pada pertemuan aktif dari IndexedDB
 * dan Cloud Storage lintas perangkat dengan resolusi konflik berbasis timestamp (`updatedAtMs`).
 */
export async function hydrateMeetingWorkspace(
  uid: string,
  meetingId: string
): Promise<boolean> {
  installWorkspaceLocalMirrorHook();

  const canonical = normalizeCanonicalMeetingId(meetingId);
  if (!uid || uid === 'guest' || !canonical) return false;

  const allSlots: NonDbMenuSlot[] = [
    'progress',
    'asesmen-awal',
    'pertanyaan-esensial',
    'eksplorasi-konsep',
    'for-learning',
    'as-learning',
  ];

  let anyChanged = false;

  // Langkah 1: Pastikan IndexedDB yang lebih baru disalin ke localStorage mirror
  for (const slot of allSlots) {
    const compositeKey = buildCompositeSlotKey(uid, canonical, slot);
    const idbEnv = await idbGetEnvelope(compositeKey);
    const locEnv = readLocalEnvelope(uid, canonical, slot);

    if (idbEnv && (!locEnv || idbEnv.updatedAtMs > locEnv.updatedAtMs)) {
      writeLocalMirrorAndEnvelope(idbEnv);
      notifySlotSubscribers(idbEnv);
      anyChanged = true;
    } else if (locEnv && (!idbEnv || locEnv.updatedAtMs > idbEnv.updatedAtMs)) {
      await idbPutEnvelope(compositeKey, locEnv);
    }
  }

  // Langkah 2: Tarik objek sinkronisasi lintas perangkat dari Cloud Storage
  const remoteObj = await pullCloudMeetingObject(uid, canonical);
  if (remoteObj && remoteObj.slots) {
    const remoteHash = computeDeterministicHash(remoteObj.slots);
    lastUploadedMeetingHash.set(`${uid}__${canonical}`, remoteHash);

    let localHasNewerThanRemote = false;

    for (const slot of allSlots) {
      const remEnv = remoteObj.slots[slot];
      const compositeKey = buildCompositeSlotKey(uid, canonical, slot);
      const currEnv =
        (await idbGetEnvelope(compositeKey)) ||
        readLocalEnvelope(uid, canonical, slot);

      if (remEnv && remEnv.uid === uid) {
        if (!currEnv || remEnv.updatedAtMs > currEnv.updatedAtMs) {
          writeLocalMirrorAndEnvelope(remEnv);
          await idbPutEnvelope(compositeKey, remEnv);
          notifySlotSubscribers(remEnv);
          anyChanged = true;
        } else if (currEnv.updatedAtMs > remEnv.updatedAtMs) {
          localHasNewerThanRemote = true;
        }
      } else if (currEnv) {
        localHasNewerThanRemote = true;
      }
    }

    if (localHasNewerThanRemote) {
      scheduleDeltaCloudUpload(uid, canonical);
    }
  } else {
    // Jika belum ada di Cloud Storage tetapi ada data lokal, unggah delta awal
    const hasAnyLocal = allSlots.some((s) =>
      Boolean(readLocalEnvelope(uid, canonical, s))
    );
    if (hasAnyLocal) {
      scheduleDeltaCloudUpload(uid, canonical);
    }
  }

  return anyChanged;
}

export function subscribeWorkspaceUpdates(
  listener: (info: {
    uid: string;
    meetingId: string;
    slot: NonDbMenuSlot;
  }) => void
): () => void {
  installWorkspaceLocalMirrorHook();
  meetingUpdateListeners.add(listener);
  return () => {
    meetingUpdateListeners.delete(listener);
  };
}

/**
 * Memasang pengait otomatis pada penyimpanan lokal peramban untuk menangkap perubahan
 * jawaban pada menu Asesmen Awal, Pertanyaan Esensial, dan Eksplorasi Konsep secara
 * langsung tanpa mengubah struktur antarmuka komponen, lalu menyinkronkannya ke
 * IndexedDB dan Cloud Storage per UID siswa.
 */
export function installWorkspaceLocalMirrorHook(): void {
  if (localMirrorHookInstalled || typeof window === 'undefined') return;
  localMirrorHookInstalled = true;

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function patchedSetItem(
    this: Storage,
    key: string,
    value: string
  ) {
    originalSetItem.call(this, key, value);

    if (this !== window.localStorage || isInternalMirrorWrite) return;

    const prefixes: Array<{ prefix: string; slot: NonDbMenuSlot }> = [
      { prefix: 'infoFun_Asesmen_', slot: 'asesmen-awal' },
      { prefix: 'infoFun_PertanyaanEsensial_', slot: 'pertanyaan-esensial' },
      { prefix: 'infoFun_Eksplorasi_', slot: 'eksplorasi-konsep' },
    ];

    const matched = prefixes.find((p) => key.startsWith(p.prefix));
    if (!matched) return;

    const rest = key.slice(matched.prefix.length);
    // Pisahkan UID dan meetingId berdasarkan penanda `_kelas`
    const kelasIdx = rest.toLowerCase().lastIndexOf('_kelas');
    if (kelasIdx <= 0) return;

    const uid = rest.slice(0, kelasIdx);
    const rawMeetingId = rest.slice(kelasIdx + 1);
    if (!uid || uid === 'guest' || !rawMeetingId) return;

    try {
      const parsedData = JSON.parse(value);
      void saveNonDbMenuRecord({
        uid,
        meetingId: rawMeetingId,
        menu: matched.slot,
        data: parsedData,
      });
    } catch {
      // Abaikan bila bukan JSON
    }
  };

  if (broadcastChannel) {
    broadcastChannel.onmessage = (ev) => {
      const msg = ev.data as {
        type?: string;
        envelope?: NonDbSlotEnvelope<unknown>;
      };
      if (msg?.type === 'SLOT_UPDATED' && msg.envelope) {
        const env = msg.envelope;
        const curr = readLocalEnvelope(env.uid, env.meetingId, env.menu);
        if (!curr || env.updatedAtMs > curr.updatedAtMs) {
          writeLocalMirrorAndEnvelope(env);
          notifySlotSubscribers(env);
        }
      }
    };
  }

  window.addEventListener('storage', (ev) => {
    if (!ev.key || !ev.newValue || !ev.key.startsWith('infoFun_WS_')) return;
    try {
      const env = JSON.parse(ev.newValue) as NonDbSlotEnvelope<unknown>;
      if (env && env.uid && env.meetingId && env.menu) {
        writeLocalMirrorAndEnvelope(env);
        notifySlotSubscribers(env);
      }
    } catch {
      // Abaikan
    }
  });
}

export function createDefaultProgress(): StudentProgress {
  return {
    atp: 'available',
    'asesmen-awal': 'locked',
    'pertanyaan-esensial': 'locked',
    'eksplorasi-konsep': 'locked',
    'for-learning': 'locked',
    'penerapan-konsep': 'locked',
    'as-learning': 'locked',
  };
}

export function isMenuLocked(
  progress: StudentProgress,
  menuId: MenuId
): boolean {
  const idx = MENU_ORDER.indexOf(menuId);
  if (idx <= 0) return false;
  const prevMenuId = MENU_ORDER[idx - 1];
  return progress[prevMenuId] !== 'completed';
}

function normalizeSequentialProgress(raw: StudentProgress): StudentProgress {
  const normalized: StudentProgress = { ...raw };
  if (normalized.atp === 'locked') {
    normalized.atp = 'available';
  }
  for (let i = 1; i < MENU_ORDER.length; i++) {
    const prevId = MENU_ORDER[i - 1];
    const currId = MENU_ORDER[i];
    if (normalized[prevId] !== 'completed') {
      normalized[currId] = 'locked';
    } else if (normalized[currId] === 'locked') {
      normalized[currId] = 'available';
    }
  }
  return normalized;
}

export function loadMeetingProgress(
  userIdentifier: string,
  meetingId: string
): StudentProgress {
  installWorkspaceLocalMirrorHook();

  const canonical = normalizeCanonicalMeetingId(meetingId);
  if (!userIdentifier || userIdentifier === 'guest' || !canonical) {
    return createDefaultProgress();
  }

  const env = readLocalEnvelope<Partial<StudentProgress>>(
    userIdentifier,
    canonical,
    'progress'
  );
  const rawSource =
    env?.data ||
    (() => {
      const storageKey = `infoFun_Progres_${userIdentifier}_${canonical}`;
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      try {
        return JSON.parse(saved) as Partial<StudentProgress>;
      } catch {
        return null;
      }
    })();

  if (rawSource) {
    const base = createDefaultProgress();
    MENU_ORDER.forEach((id) => {
      if (
        rawSource[id] === 'locked' ||
        rawSource[id] === 'available' ||
        rawSource[id] === 'completed'
      ) {
        base[id] = rawSource[id]!;
      }
    });
    return normalizeSequentialProgress(base);
  }

  return createDefaultProgress();
}

export function saveMeetingProgress(
  userIdentifier: string,
  meetingId: string,
  progress: StudentProgress
): void {
  installWorkspaceLocalMirrorHook();

  const canonical = normalizeCanonicalMeetingId(meetingId);
  if (!userIdentifier || userIdentifier === 'guest' || !canonical) return;

  const normalized = normalizeSequentialProgress(progress);
  void saveNonDbMenuRecord({
    uid: userIdentifier,
    meetingId: canonical,
    menu: 'progress',
    data: normalized,
  });
}

export function completeMenuStage(
  current: StudentProgress,
  menuId: MenuId
): { updated: StudentProgress; nextMenuId: MenuId | null } {
  const updated: StudentProgress = {
    ...current,
    [menuId]: 'completed',
  };

  const idx = MENU_ORDER.indexOf(menuId);
  let nextMenuId: MenuId | null = null;

  if (idx >= 0 && idx < MENU_ORDER.length - 1) {
    nextMenuId = MENU_ORDER[idx + 1];
    if (updated[nextMenuId] === 'locked') {
      updated[nextMenuId] = 'available';
    }
  }

  return { updated: normalizeSequentialProgress(updated), nextMenuId };
}

export function countCompletedMenus(progress: StudentProgress): {
  completedCount: number;
  totalMenus: number;
  percentage: number;
} {
  const totalMenus = MENU_ORDER.length;
  const completedCount = MENU_ORDER.filter(
    (id) => progress[id] === 'completed'
  ).length;
  const percentage = Math.min(
    100,
    Math.round((completedCount / totalMenus) * 100)
  );
  return { completedCount, totalMenus, percentage };
}
