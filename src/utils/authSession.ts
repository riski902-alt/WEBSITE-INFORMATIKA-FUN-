import { UserRole, UserSession } from '../types/learning';

function apakahHanyaAngka(teks: string | null | undefined): boolean {
  if (!teks) return false;
  return /^\d+$/.test(teks.toString().trim());
}

export function scanBrowserSession(): UserSession | null {
  const data: {
    nama: string | null;
    nisn: string | null;
    email: string | null;
    role: UserRole | null;
  } = {
    nama: null,
    nisn: null,
    email: null,
    role: null,
  };

  // 1. Cek parameter URL terlebih dahulu (sesuai cek-login.js)
  const urlParams = new URLSearchParams(window.location.search);
  const paramNama = urlParams.get('nama');
  const paramNisn = urlParams.get('nisn');
  const paramEmail = urlParams.get('email');
  const paramRole = urlParams.get('role');

  if (paramNama) data.nama = decodeURIComponent(paramNama).trim();
  if (paramNisn) data.nisn = paramNisn.trim();
  if (paramEmail) data.email = paramEmail.trim();
  if (paramRole) {
    const r = paramRole.trim().toLowerCase();
    if (r === 'guru' || r === 'siswa') {
      data.role = r;
    }
  }

  // 2. Cek kunci eksplisit infoFun_* terlebih dahulu
  const explicitNama = sessionStorage.getItem('infoFun_Nama') || localStorage.getItem('infoFun_Nama');
  const explicitNisn = sessionStorage.getItem('infoFun_NISN') || localStorage.getItem('infoFun_NISN');
  const explicitEmail = sessionStorage.getItem('infoFun_Email') || localStorage.getItem('infoFun_Email');
  const explicitRole = sessionStorage.getItem('infoFun_Role') || localStorage.getItem('infoFun_Role');

  if (!data.nama && explicitNama) data.nama = explicitNama.trim();
  if (!data.nisn && explicitNisn) data.nisn = explicitNisn.trim();
  if (!data.email && explicitEmail) data.email = explicitEmail.trim();
  if (!data.role && (explicitRole === 'guru' || explicitRole === 'siswa')) {
    data.role = explicitRole;
  }

  // 3. Mesin Pemindai Storage universal dari cek-login.js
  function pindaiStorage(storage: Storage) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key || key.startsWith('infoFun_Progres_') || key.startsWith('progresBelajar_') || key.startsWith('infoFun_Catatan_')) {
        continue;
      }
      const val = storage.getItem(key);
      if (!val || val === 'undefined' || val === 'null') continue;

      const valBersih = val.trim();

      if (valBersih.startsWith('{') && valBersih.endsWith('}')) {
        try {
          const obj = JSON.parse(valBersih) as Record<string, unknown>;
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
            const parsedRole = String(obj.role || obj.type).toLowerCase().trim();
            if (parsedRole === 'guru' || parsedRole === 'siswa') {
              data.role = parsedRole;
            }
          }
        } catch {
          // Abaikan jika bukan JSON valid
        }
      } else {
        const keyLower = key.toLowerCase();
        if (!data.email && (keyLower.includes('email') || valBersih.includes('@'))) {
          data.email = valBersih;
        } else if (!data.nisn && (keyLower.includes('nisn') || (apakahHanyaAngka(valBersih) && valBersih.length >= 5))) {
          data.nisn = valBersih;
        } else if (
          !data.nama &&
          (keyLower.includes('nama') || keyLower.includes('user')) &&
          valBersih.length > 3 &&
          !apakahHanyaAngka(valBersih) &&
          !valBersih.includes('@') &&
          valBersih.toLowerCase() !== 'guru' &&
          valBersih.toLowerCase() !== 'siswa'
        ) {
          data.nama = valBersih;
        }

        if (valBersih.toLowerCase() === 'guru' || valBersih.toLowerCase() === 'siswa') {
          data.role = valBersih.toLowerCase() as UserRole;
        }
      }
    }
  }

  pindaiStorage(sessionStorage);
  pindaiStorage(localStorage);

  const isValidSiswa = Boolean(data.nama || data.nisn);
  const isValidGuru = Boolean(data.email || data.role === 'guru');

  if (!isValidSiswa && !isValidGuru) {
    return null;
  }

  const resolvedRole: UserRole =
    data.role === 'guru' || (data.email && !data.nisn) ? 'guru' : 'siswa';

  const session: UserSession = {
    nama:
      data.nama ||
      (resolvedRole === 'guru' ? 'Riski Amalia, S.Pd' : 'Pelajar'),
    nisn: data.nisn || '',
    email: data.email || '',
    role: resolvedRole,
  };

  persistSession(session);
  return session;
}

export function persistSession(session: UserSession): void {
  localStorage.setItem('infoFun_LoggedOut', 'false');
  if (session.nama) localStorage.setItem('infoFun_Nama', session.nama);
  if (session.email) localStorage.setItem('infoFun_Email', session.email);
  else localStorage.removeItem('infoFun_Email');
  if (session.nisn) localStorage.setItem('infoFun_NISN', session.nisn);
  else localStorage.removeItem('infoFun_NISN');
  localStorage.setItem('infoFun_Role', session.role);
  localStorage.setItem(
    'currentUserId',
    session.nisn || session.email.replace(/[^a-zA-Z0-9]/g, '_') || 'siswa_01'
  );
}

export function clearUserSession(): void {
  localStorage.removeItem('infoFun_Nama');
  localStorage.removeItem('infoFun_Email');
  localStorage.removeItem('infoFun_NISN');
  localStorage.removeItem('infoFun_Role');
  localStorage.removeItem('currentUserId');
  sessionStorage.clear();
  localStorage.setItem('infoFun_LoggedOut', 'true');
}

export function loadInitialSession(): UserSession | null {
  const scanned = scanBrowserSession();
  if (scanned) return scanned;

  // Jika pengguna secara eksplisit menekan tombol Keluar, tampilkan halaman Login
  if (localStorage.getItem('infoFun_LoggedOut') === 'true') {
    return null;
  }

  // Sesi awal default agar dashboard materi langsung siap digunakan saat pertama kali dibuka
  const defaultSession: UserSession = {
    nama: 'Siswa Informatika',
    nisn: '0081234567',
    email: '',
    role: 'siswa',
  };
  persistSession(defaultSession);
  return defaultSession;
}

export function getDisplayUserName(session: UserSession): string {
  if (session.role === 'guru' || (session.email && !session.nisn)) {
    return session.nama || 'Riski Amalia, S.Pd';
  }
  return session.nama || 'Pelajar';
}

export function getUserStorageIdentifier(session: UserSession): string {
  if (session.role === 'guru') {
    return session.email ? session.email.replace(/[^a-zA-Z0-9]/g, '_') : 'guru';
  }
  return session.nisn || session.nama.replace(/\s+/g, '_').toLowerCase() || 'guest';
}
