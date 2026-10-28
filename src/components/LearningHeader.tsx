import React from 'react';
import {
  ListChecks,
  ClipboardText,
  Lightbulb,
  MonitorPlay,
  Target,
  Laptop,
  Brain,
  LockKey,
  CheckCircle,
  CaretRight,
  WarningCircle,
} from '@phosphor-icons/react';
import {
  MENU_DEFINITIONS,
  MateriItem,
  MenuId,
  StudentProgress,
} from '../types/learning';
import { countCompletedMenus, isMenuLocked } from '../utils/firebaseSync';

interface LearningHeaderProps {
  materi: MateriItem;
  progress: StudentProgress;
  activeMenu: MenuId;
  lockedNotice: string | null;
  onSelectMenu: (menuId: MenuId) => void;
}

const PROGRESS_WIDTH_CLASSES: Record<number, string> = {
  0: 'w-0',
  1: 'w-1/7',
  2: 'w-2/7',
  3: 'w-3/7',
  4: 'w-4/7',
  5: 'w-5/7',
  6: 'w-6/7',
  7: 'w-full',
};

function renderMenuIcon(menuId: MenuId) {
  const iconProps = { size: 28, weight: 'regular' as const };
  switch (menuId) {
    case 'atp':
      return <ListChecks {...iconProps} />;
    case 'asesmen-awal':
      return <ClipboardText {...iconProps} />;
    case 'pertanyaan-esensial':
      return <Lightbulb {...iconProps} />;
    case 'eksplorasi-konsep':
      return <MonitorPlay {...iconProps} />;
    case 'for-learning':
      return <Target {...iconProps} />;
    case 'penerapan-konsep':
      return <Laptop {...iconProps} />;
    case 'as-learning':
      return <Brain {...iconProps} />;
  }
}

export const LearningHeader: React.FC<LearningHeaderProps> = ({
  materi,
  progress,
  activeMenu,
  lockedNotice,
  onSelectMenu,
}) => {
  const { completedCount, totalMenus, percentage } = countCompletedMenus(progress);
  const progressWidthClass = PROGRESS_WIDTH_CLASSES[completedCount] || 'w-0';

  return (
    <section className="pt-[26px] pb-[10px] px-[5%] flex flex-col gap-[15px]">
      <div className="bg-[#1E3A5F] border-2 border-[#88D4AB] rounded-2xl py-4 px-5 shadow-lg">
        {/* Baris Judul Bab & Badge JP */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1
            id="judul-bab"
            className="font-[var(--font-title)] text-[1.45rem] sm:text-[1.8rem] font-bold leading-tight flex-1 min-w-[220px]"
          >
            {materi.judul_bab}
          </h1>
          <div className="inline-flex items-center gap-1.5 border border-white px-4 py-1.5 rounded-[20px] text-[0.82rem] font-bold font-[var(--font-nav)] shrink-0">
            JP: 120 MENIT
          </div>
        </div>

        {/* Informasi Pertemuan */}
        <div className="mt-3 pt-3 border-t border-dashed border-white/20 flex flex-wrap items-center gap-2.5 mb-3.5">
          <span
            id="pertemuan-info"
            className="inline-block bg-[#D8BD7B] text-[#1E3A5F] px-3 py-1 rounded-md text-[0.85rem] font-bold font-[var(--font-nav)]"
          >
            {materi.judul_pertemuan}
          </span>
        </div>

        {/* Bagian Progres Pembelajaran */}
        <div className="mb-1">
          <h4 className="font-[var(--font-title)] text-xs tracking-wider text-[#D8BD7B] font-bold mb-0.5">
            PROGRES PEMBELAJARAN
          </h4>
          <p
            id="progress-text"
            className="font-[var(--font-nav)] font-bold text-[0.88rem] mb-1.5"
          >
            {completedCount} dari {totalMenus} menu selesai ({percentage}%)
          </p>
          <div className="w-full h-2.5 bg-[#2a4b75] rounded-full overflow-hidden">
            <div
              id="progress-fill"
              className={`h-full bg-[#88D4AB] rounded-full transition-all duration-500 ease-out ${progressWidthClass}`}
            />
          </div>
        </div>

        {/* Notifikasi jika pengguna mengeklik menu yang masih terkunci */}
        {lockedNotice && (
          <div className="mt-3 flex items-center gap-2 bg-[#E57373]/20 border border-[#E57373] text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-[var(--font-nav)]">
            <WarningCircle size={18} weight="fill" className="text-[#E57373] shrink-0" />
            <span>{lockedNotice}</span>
          </div>
        )}

        {/* Navigasi 7 Tombol Menu Pembelajaran */}
        <nav className="learning-menu-container menu-scroll flex w-full gap-3 overflow-x-auto pt-3.5 pb-1 mt-1">
          {MENU_DEFINITIONS.map((menu) => {
            const state = progress[menu.id];
            const isLocked = isMenuLocked(progress, menu.id);
            const isCompleted = !isLocked && state === 'completed';
            const isActive = activeMenu === menu.id;

            let btnClasses =
              'flex-1 min-w-[132px] relative flex flex-col items-center justify-center py-3.5 px-2.5 rounded-xl border font-[var(--font-nav)] transition-all duration-200 select-none ';

            if (isLocked) {
              btnClasses +=
                'bg-[#132644]/90 border-white/20 text-white/55 cursor-not-allowed ';
            } else if (isCompleted && isActive) {
              btnClasses +=
                'bg-[#88D4AB] text-[#1E3A5F] border-2 border-white shadow-[0_0_16px_rgba(136,212,171,0.45)] cursor-pointer -translate-y-0.5 ';
            } else if (isCompleted) {
              btnClasses +=
                'bg-[#88D4AB] text-[#1E3A5F] border-[#88D4AB] hover:-translate-y-1 hover:shadow-md cursor-pointer ';
            } else if (isActive) {
              btnClasses +=
                'bg-[#23436b] text-white border-2 border-[#D8BD7B] shadow-[0_0_15px_rgba(216,189,123,0.3)] cursor-pointer -translate-y-0.5 ';
            } else {
              btnClasses +=
                'bg-[#152C5B] text-white border-[#88D4AB] hover:bg-[#23436b] hover:-translate-y-1 hover:shadow-md cursor-pointer ';
            }

            return (
              <button
                key={menu.id}
                type="button"
                id={`btn-${menu.id}`}
                onClick={() => onSelectMenu(menu.id)}
                className={btnClasses}
              >
                <div className="absolute top-2 right-2">
                  {isLocked ? (
                    <span
                      title="Terkunci — selesaikan menu sebelumnya"
                      className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#1E3A5F] border border-[#D8BD7B]/55 text-[#D8BD7B] shadow-sm"
                    >
                      <LockKey size={14} weight="fill" />
                    </span>
                  ) : isCompleted ? (
                    <CheckCircle size={17} weight="fill" />
                  ) : (
                    <CaretRight size={14} weight="bold" />
                  )}
                </div>

                <div className="mb-1.5">{renderMenuIcon(menu.id)}</div>
                <span className="text-[0.82rem] font-bold text-center leading-snug">
                  {menu.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </section>
  );
};
