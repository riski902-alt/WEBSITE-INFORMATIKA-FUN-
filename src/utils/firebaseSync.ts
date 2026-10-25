import { MENU_ORDER, MenuId, StudentProgress } from '../types/learning';

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

export function loadMeetingProgress(
  userIdentifier: string,
  meetingId: string
): StudentProgress {
  const storageKey = `infoFun_Progres_${userIdentifier}_${meetingId}`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Partial<StudentProgress>;
      const base = createDefaultProgress();
      MENU_ORDER.forEach((id) => {
        if (
          parsed[id] === 'locked' ||
          parsed[id] === 'available' ||
          parsed[id] === 'completed'
        ) {
          base[id] = parsed[id]!;
        }
      });
      return base;
    } catch {
      return createDefaultProgress();
    }
  }
  return createDefaultProgress();
}

export function saveMeetingProgress(
  userIdentifier: string,
  meetingId: string,
  progress: StudentProgress
): void {
  const storageKey = `infoFun_Progres_${userIdentifier}_${meetingId}`;
  localStorage.setItem(storageKey, JSON.stringify(progress));

  // Simpan juga daftar menu selesai seperti di index.html (progresBelajar_*)
  const completedList = MENU_ORDER.filter((id) => progress[id] === 'completed');
  const legacyKey = `progresBelajar_${userIdentifier}_${meetingId}`;
  localStorage.setItem(legacyKey, JSON.stringify(completedList));

  // Sinkronisasi opsional ke Firebase Realtime Database jika URL dikonfigurasi
  const dbUrl = (import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined)?.trim();
  if (dbUrl && dbUrl.startsWith('https://') && !dbUrl.includes('PROJECT_ID')) {
    const cleanBase = dbUrl.replace(/\/+$/, '');
    const payload: Record<string, boolean> = {};
    completedList.forEach((menuId) => {
      payload[`btn-${menuId}`] = true;
    });
    fetch(
      `${cleanBase}/users/${encodeURIComponent(userIdentifier)}/progres_${encodeURIComponent(meetingId)}.json`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    ).catch(() => {
      // Tetap aman menggunakan localStorage jika jaringan offline
    });
  }
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

  return { updated, nextMenuId };
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
