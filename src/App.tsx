import React, { useEffect, useMemo, useState } from 'react';
import {
  ATPCatalog,
  MENU_ORDER,
  MateriCatalog,
  MenuId,
  StudentProgress,
  UserSession,
} from './types/learning';
import {
  clearUserSession,
  getUserStorageIdentifier,
  loadInitialSession,
  persistSession,
} from './utils/authSession';
import {
  completeMenuStage,
  createDefaultProgress,
  loadMeetingProgress,
  saveMeetingProgress,
} from './utils/firebaseSync';
import { parseATPSections } from './utils/normalizeAssessment';
import { LoginView } from './components/LoginView';
import { TopBar } from './components/TopBar';
import { LearningHeader } from './components/LearningHeader';
import { ATPView } from './components/ATPView';
import { StageActivityView } from './components/StageActivityView';
import { BacaMateriView } from './components/BacaMateriView';

export const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(() =>
    loadInitialSession()
  );

  const [materiCatalog, setMateriCatalog] = useState<MateriCatalog | null>(null);
  const [atpCatalog, setAtpCatalog] = useState<ATPCatalog>({});
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [meetingId, setMeetingId] = useState<string>('');
  const [activeMenu, setActiveMenu] = useState<MenuId>('atp');
  const [viewMode, setViewMode] = useState<'dashboard' | 'baca'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'baca' ? 'baca' : 'dashboard';
  });

  const [progress, setProgress] = useState<StudentProgress>(() =>
    createDefaultProgress()
  );
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  // Muat file JSON katalog materi dan ATP
  useEffect(() => {
    let cancelled = false;

    async function fetchAllData() {
      try {
        const baseUrl = import.meta.env.BASE_URL;
        const [materiRes, atpRes] = await Promise.all([
          fetch(`${baseUrl}materi.json`),
          fetch(`${baseUrl}atp.json`),
        ]);

        if (!materiRes.ok) {
          throw new Error(`Gagal memuat materi.json (Status ${materiRes.status})`);
        }

        const materiJson = (await materiRes.json()) as MateriCatalog;
        const atpJson = atpRes.ok ? ((await atpRes.json()) as ATPCatalog) : {};

        if (cancelled) return;

        setMateriCatalog(materiJson);
        setAtpCatalog(atpJson);

        const params = new URLSearchParams(window.location.search);
        const requestedId = params.get('id');
        const requestedMenu = params.get('menu') as MenuId | null;
        const firstId = Object.keys(materiJson)[0] || '';
        const validMeetingId =
          requestedId && materiJson[requestedId] ? requestedId : firstId;

        setMeetingId(validMeetingId);

        if (requestedMenu && MENU_ORDER.includes(requestedMenu)) {
          setActiveMenu(requestedMenu);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadingError(
            err instanceof Error
              ? err.message
              : 'Terjadi kesalahan saat memuat data materi.'
          );
        }
      }
    }

    fetchAllData();
    return () => {
      cancelled = true;
    };
  }, []);

  const userKey = useMemo(
    () => (session ? getUserStorageIdentifier(session) : 'guest'),
    [session]
  );

  // Sinkronkan progres siswa setiap kali meetingId atau userKey berubah
  useEffect(() => {
    if (!meetingId) return;
    const loaded = loadMeetingProgress(userKey, meetingId);
    setProgress(loaded);
    setLockedNotice(null);

    // Sinkronkan parameter ?id= di URL tanpa reload halaman
    const url = new URL(window.location.href);
    url.searchParams.set('id', meetingId);
    window.history.replaceState({}, '', url.toString());
  }, [userKey, meetingId]);

  const currentMateri = useMemo(() => {
    if (!materiCatalog || !meetingId) return null;
    return materiCatalog[meetingId] || null;
  }, [materiCatalog, meetingId]);

  const currentATPSections = useMemo(() => {
    if (!meetingId) {
      return {
        elemen: [],
        capaianPembelajaran: '',
        tujuanPembelajaran: '',
        topik: '',
      };
    }
    const rawHtml =
      atpCatalog[meetingId]?.konten || currentMateri?.konten?.atp || '';
    return parseATPSections(rawHtml);
  }, [atpCatalog, currentMateri, meetingId]);

  const handleLogin = (newSession: UserSession) => {
    persistSession(newSession);
    setSession(newSession);
  };

  const handleLogout = () => {
    clearUserSession();
    setSession(null);
  };

  const handleSelectMenu = (menuId: MenuId) => {
    setLockedNotice(null);
    setActiveMenu(menuId);
  };

  const handleCompleteStage = (completedMenuId: MenuId) => {
    const { updated, nextMenuId } = completeMenuStage(
      progress,
      completedMenuId
    );
    setProgress(updated);
    saveMeetingProgress(userKey, meetingId, updated);
    setLockedNotice(null);

    if (nextMenuId) {
      setActiveMenu(nextMenuId);
    }
  };

  if (!session) {
    return <LoginView onLogin={handleLogin} />;
  }

  if (loadingError) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar session={session} onLogout={handleLogout} />
        <div className="p-8 max-w-xl mx-auto mt-10 bg-[#1E3A5F] border-2 border-[#E57373] rounded-2xl text-center">
          <h2 className="text-xl font-bold text-[#E57373] mb-2">
            Gagal Memuat Materi
          </h2>
          <p className="text-sm text-white/90">{loadingError}</p>
        </div>
      </div>
    );
  }

  if (!materiCatalog || !currentMateri) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar session={session} onLogout={handleLogout} />
        <div className="p-10 text-center text-white font-[var(--font-nav)]">
          Memuat data ruang belajar INFORMATIKA FUN!...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-14 flex flex-col">
      <TopBar session={session} onLogout={handleLogout} />

      {viewMode === 'baca' ? (
        <BacaMateriView
          materi={currentMateri}
          atpSections={currentATPSections}
          progress={progress}
          userRole={session.role}
          onOpenStageInDashboard={(targetMenu) => {
            setActiveMenu(targetMenu);
            setViewMode('dashboard');
          }}
          onBackToDashboard={() => setViewMode('dashboard')}
        />
      ) : (
        <>
          <LearningHeader
            materi={currentMateri}
            progress={progress}
            activeMenu={activeMenu}
            userRole={session.role}
            lockedNotice={lockedNotice}
            onSelectMenu={handleSelectMenu}
          />

          <main id="dynamic-content-area" className="px-[5%] pt-4 pb-8">
            {activeMenu === 'atp' ? (
              <ATPView
                judulPertemuan={currentMateri.judul_pertemuan}
                sections={currentATPSections}
                isCompleted={progress.atp === 'completed'}
                onCompleteAndContinue={() => handleCompleteStage('atp')}
              />
            ) : (
              <StageActivityView menuId={activeMenu} />
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
