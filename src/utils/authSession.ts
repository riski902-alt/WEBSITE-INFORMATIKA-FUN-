import { signOut } from 'firebase/auth';
import { UserRole, UserSession } from '../types/learning';
import { firebaseAuth } from './firebaseClient';

function apakahHanyaAngka(teks: string | null | undefined): boolean {
  if (!teks) return false;
  return /^\d+$/.test(teks.toString().trim());
}

function sanitasiTokenIdentitas(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Membentuk UID deterministik dan unik untuk setiap akun siswa maupun guru.
 * Tidak pernah bergantung pada nama siswa semata sehingga dua siswa bernama sama
 * tetap memiliki ruang data terisolasi secara ketat berdasarkan NISN / kredensial akun.
 */
export function buildCanonicalUid(params: {
  role: UserRole;
  nisn?: string | null;
  email?: string | null;
  authUid?: string | null;
  siswaDocId?: string | null;
}): string {
  if (params.role === 'guru') {
    const cleanEmail = sanitasiTokenIdentitas(params.email || '');
    if (cleanEmail) {
      return `uid_guru_${cleanEmail}`;
    }
    const cleanAuthUid = String(params.authUid || '')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    if (cleanAuthUid) {
      return `uid_guru_${cleanAuthUid}`;
    }
    return 'uid_guru_aktif';
  }

  const cleanNisn = sanitasiTokenIdentitas(params.nisn || '');
  if (cleanNisn) {
    return `uid_siswa_${cleanNisn}`;
  }

  const cleanDocId = String(params.siswaDocId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  if (cleanDocId) {
    return `uid_siswa_${cleanDocId}`;
  }

  return '';
}

export function scanBrowserSession(): UserSession | null {
  // Bersihkan sesi contoh lama jika masih tersimpan dari versi sebelumnya
  if (
    localStorage.getItem('infoFun_Nama') === 'Siswa Informatika' &&
    localStorage.getItem('infoFun_NISN') === '0081234567'
  ) {
    localStorage.removeItem('infoFun_Nama');
    localStorage.removeItem('infoFun_NISN');
    localStorage.removeItem('infoFun_Role');
    localStorage.removeItem('infoFun_UID');
    localStorage.removeItem('infoFun_SiswaDocId');
    localStorage.removeItem('currentUserId');
  }

  // 1. Cek parameter URL terlebih dahulu (untuk integrasi portal antarlaman)
  const urlParams = new URLSearchParams(window.location.search);
  const paramNama = urlParams.get('nama');
  const paramNisn = urlParams.get('nisn');
  const paramEmail = urlParams.get('email');
  const paramRole = urlParams.get('role');
  const paramUid = urlParams.get('uid');

  const hasExplicitUrlLogin = Boolean(
    (paramNama && paramNisn) || (paramRole === 'guru' && (paramEmail || paramNama))
  );

  // Cek apakah portal eksternal baru saja menulis userRole + userNISN/userName
  const hasPortalDirectLogin = Boolean(
    localStorage.getItem('userRole') &&
      (localStorage.getItem('userNISN') || localStorage.getItem('userName'))
  );

  // Hormati status logout eksplisit agar sesi pengguna sebelumnya tidak pernah bangkit kembali
  if (
    localStorage.getItem('infoFun_LoggedOut') === 'true' &&
    !hasExplicitUrlLogin &&
    !hasPortalDirectLogin
  ) {
    return null;
  }

  const data: {
    uid: string | null;
    siswaDocId: string | null;
    nama: string | null;
    nisn: string | null;
    email: string | null;
    role: UserRole | null;
  } = {
    uid: null,
    siswaDocId: null,
    nama: null,
    nisn: null,
    email: null,
    role: null,
  };

  if (paramUid) data.uid = decodeURIComponent(paramUid).trim();
  if (paramNama) data.nama = decodeURIComponent(paramNama).trim();
  if (paramNisn) data.nisn = paramNisn.trim();
  if (paramEmail) data.email = paramEmail.trim();
  if (paramRole) {
    const r = paramRole.trim().toLowerCase();
    if (r === 'guru' || r === 'siswa') {
      data.role = r;
    }
  }

  // 2. Cek kunci login standar dari halaman Login Firebase & infoFun_*
  const savedUid =
    sessionStorage.getItem('infoFun_UID') ||
    localStorage.getItem('infoFun_UID');
  const savedDocId =
    sessionStorage.getItem('infoFun_SiswaDocId') ||
    localStorage.getItem('infoFun_SiswaDocId');
  const savedRole =
    sessionStorage.getItem('userRole') ||
    localStorage.getItem('userRole') ||
    sessionStorage.getItem('infoFun_Role') ||
    localStorage.getItem('infoFun_Role');
  const savedName =
    sessionStorage.getItem('userName') ||
    localStorage.getItem('userName') ||
    sessionStorage.getItem('infoFun_Nama') ||
    localStorage.getItem('infoFun_Nama');
  const savedNisn =
    sessionStorage.getItem('userNISN') ||
    localStorage.getItem('userNISN') ||
    sessionStorage.getItem('infoFun_NISN') ||
    localStorage.getItem('infoFun_NISN');
  const savedEmail =
    sessionStorage.getItem('infoFun_Email') ||
    localStorage.getItem('infoFun_Email');

  if (!data.uid && savedUid) data.uid = savedUid.trim();
  if (!data.siswaDocId && savedDocId) data.siswaDocId = savedDocId.trim();
  if (!data.role && (savedRole === 'guru' || savedRole === 'siswa')) {
    data.role = savedRole;
  }
  if (savedName) {
    if (savedName.includes('@') && !data.email) {
      data.email = savedName.trim();
    } else if (!data.nama) {
      data.nama = savedName.trim();
    }
  }
  if (!data.nisn && savedNisn) data.nisn = savedNisn.trim();
  if (!data.email && savedEmail) data.email = savedEmail.trim();

  // 3. Pemindai storage kompatibilitas portal (WAJIB mengabaikan seluruh cache jawaban infoFun_*)
  function pindaiStoragePortal(storage: Storage) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (
        !key ||
        key.startsWith('firebase:') ||
        key.startsWith('infoFun_') ||
        key.startsWith('progresBelajar_') ||
        key === 'currentUserId'
      ) {
        continue;
      }
      const val = storage.getItem(key);
      if (!val || val === 'undefined' || val === 'null') continue;

      const valBersih = val.trim();

      if (valBersih.startsWith('{') && valBersih.endsWith('}')) {
        try {
          const obj = JSON.parse(valBersih) as Record<string, unknown>;
          // Abaikan objek yang jelas merupakan rekaman jawaban/kuis
          if ('jawaban' in obj || 'submitted' in obj || 'pgAnswers' in obj) {
            continue;
          }
          if (!data.nama && (obj.nama || obj.namaLengkap)) {
            data.nama = String(obj.nama || obj.namaLengkap).trim();
          }
          if (!data.nisn && obj.nisn) {
            data.nisn = String(obj.nisn).trim();
          }
          if (!data.email && obj.email) {
            data.email = String(obj.email).trim();
          }
          if (!data.role && (obj.role || obj.type)) {
            const parsedRole = String(obj.role || obj.type)
              .toLowerCase()
              .trim();
            if (parsedRole === 'guru' || parsedRole === 'siswa') {
              data.role = parsedRole;
            }
          }
        } catch {
          // Abaikan jika bukan JSON valid
        }
      } else {
        const keyLower = key.toLowerCase();
        if (
          !data.email &&
          (keyLower.includes('email') || valBersih.includes('@'))
        ) {
          data.email = valBersih;
        } else if (
          !data.nisn &&
          (keyLower.includes('nisn') ||
            (apakahHanyaAngka(valBersih) && valBersih.length >= 5))
        ) {
          data.nisn = valBersih;
        } else if (
          !data.nama &&
          (keyLower.includes('nama') || keyLower.includes('username')) &&
          valBersih.length > 2 &&
          !apakahHanyaAngka(valBersih) &&
          !valBersih.includes('@') &&
          valBersih.toLowerCase() !== 'guru' &&
          valBersih.toLowerCase() !== 'siswa'
        ) {
          data.nama = valBersih;
        }

        if (
          valBersih.toLowerCase() === 'guru' ||
          valBersih.toLowerCase() === 'siswa'
        ) {
          data.role = valBersih.toLowerCase() as UserRole;
        }
      }
    }
  }

  if (!data.nisn && !data.email) {
    pindaiStoragePortal(sessionStorage);
    pindaiStoragePortal(localStorage);
  }

  const isValidSiswa = Boolean(data.nama && data.nisn);
  const isValidGuru = Boolean(data.role === 'guru' && (data.email || data.nama));

  if (!isValidSiswa && !isValidGuru) {
    return null;
  }

  const resolvedRole: UserRole =
    data.role === 'guru' || (data.email && !data.nisn) ? 'guru' : 'siswa';

  const canonicalUid = buildCanonicalUid({
    role: resolvedRole,
    nisn: data.nisn,
    email: data.email || (resolvedRole === 'guru' ? data.nama : ''),
    authUid: firebaseAuth.currentUser?.uid || data.uid,
    siswaDocId: data.siswaDocId,
  });

  if (!canonicalUid) {
    return null;
  }

  const session: UserSession = {
    uid: canonicalUid,
    nama:
      data.nama ||
      (resolvedRole === 'guru'
        ? data.email || 'Riski Amalia, S.Pd'
        : 'Pelajar'),
    nisn: resolvedRole === 'siswa' ? data.nisn || '' : '',
    email: data.email || '',
    role: resolvedRole,
    ...(data.siswaDocId ? { siswaDocId: data.siswaDocId } : {}),
  };

  persistSession(session);
  return session;
}

export function persistSession(session: UserSession): void {
  const uid =
    session.uid ||
    buildCanonicalUid({
      role: session.role,
      nisn: session.nisn,
      email: session.email,
      siswaDocId: session.siswaDocId,
    });

  localStorage.setItem('infoFun_LoggedOut', 'false');
  localStorage.setItem('infoFun_UID', uid);
  localStorage.setItem('userRole', session.role);

  if (session.siswaDocId) {
    localStorage.setItem('infoFun_SiswaDocId', session.siswaDocId);
  } else {
    localStorage.removeItem('infoFun_SiswaDocId');
  }

  if (session.role === 'siswa') {
    localStorage.setItem('userName', session.nama);
    localStorage.setItem('userNISN', session.nisn);
  } else {
    localStorage.setItem('userName', session.email || session.nama);
    localStorage.removeItem('userNISN');
  }

  if (session.nama) localStorage.setItem('infoFun_Nama', session.nama);
  if (session.email) localStorage.setItem('infoFun_Email', session.email);
  else localStorage.removeItem('infoFun_Email');
  if (session.nisn) localStorage.setItem('infoFun_NISN', session.nisn);
  else localStorage.removeItem('infoFun_NISN');
  localStorage.setItem('infoFun_Role', session.role);
  localStorage.setItem('currentUserId', uid);
}

export function clearUserSession(): void {
  signOut(firebaseAuth).catch(() => {
    // Abaikan jika sesi auth sudah berakhir
  });

  const sessionKeysToRemove = [
    'userRole',
    'userName',
    'userNISN',
    'infoFun_UID',
    'infoFun_SiswaDocId',
    'infoFun_Nama',
    'infoFun_Email',
    'infoFun_NISN',
    'infoFun_Role',
    'currentUserId',
  ];
  sessionKeysToRemove.forEach((k) => localStorage.removeItem(k));
  sessionStorage.clear();
  localStorage.setItem('infoFun_LoggedOut', 'true');

  // Bersihkan parameter login dari URL bila ada agar reload setelah logout tetap bersih
  try {
    const url = new URL(window.location.href);
    ['nama', 'nisn', 'email', 'role', 'uid'].forEach((param) =>
      url.searchParams.delete(param)
    );
    window.history.replaceState({}, '', url.toString());
  } catch {
    // Abaikan bila URL tidak dapat dimodifikasi
  }
}

export function loadInitialSession(): UserSession | null {
  return scanBrowserSession();
}

export function getDisplayUserName(session: UserSession): string {
  if (session.role === 'guru') {
    return session.nama || session.email || 'Guru Informatika';
  }
  return session.nama || 'Siswa';
}

/**
 * Mengembalikan UID unik siswa/guru untuk penguncian penyimpanan jawaban & progres.
 * Tidak pernah menggunakan nama siswa semata.
 */
export function getUserStorageIdentifier(session: UserSession): string {
  if (session.uid && session.uid.trim()) {
    return session.uid.trim();
  }
  const computed = buildCanonicalUid({
    role: session.role,
    nisn: session.nisn,
    email: session.email,
    siswaDocId: session.siswaDocId,
  });
  return computed || 'guest';
}
