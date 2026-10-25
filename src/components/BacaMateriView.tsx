import React from 'react';
import {
  ArrowLeft,
  PushPin,
  CheckCircle,
  LockKey,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import {
  MENU_DEFINITIONS,
  MateriItem,
  MenuId,
  ParsedATPSections,
  StudentProgress,
  UserRole,
} from '../types/learning';

interface BacaMateriViewProps {
  materi: MateriItem;
  atpSections: ParsedATPSections;
  progress: StudentProgress;
  userRole: UserRole;
  onOpenStageInDashboard: (menuId: MenuId) => void;
  onBackToDashboard: () => void;
}

export const BacaMateriView: React.FC<BacaMateriViewProps> = ({
  materi,
  atpSections,
  progress,
  userRole,
  onOpenStageInDashboard,
  onBackToDashboard,
}) => {
  return (
    <div id="dashboard-container" className="px-[5%] py-6 flex flex-col gap-6">
      {/* Bagian Kepala sesuai baca-materi.html */}
      <div className="bg-[#243B53] border-2 border-[#88D4AB] rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="self-start bg-white/15 px-3.5 py-1 rounded-full text-xs text-white font-bold font-[var(--font-nav)]">
            MODE BACA MATERI LENGKAP
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug mt-1">
            {materi.judul_bab}
          </h1>
          <h2 className="text-sm sm:text-base text-[#88D4AB] font-medium">
            {materi.judul_pertemuan}
          </h2>
        </div>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 bg-[#E57373] hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-[var(--font-nav)] font-bold text-sm cursor-pointer transition self-start sm:self-center shrink-0"
        >
          <ArrowLeft size={18} weight="bold" />
          Kembali ke Menu Utama
        </button>
      </div>

      {/* Daftar Seluruh 7 Bagian Materi */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm text-[#243447] flex flex-col gap-6">
        {MENU_DEFINITIONS.map((menu) => {
          const state = progress[menu.id];
          const isLocked = state === 'locked' && userRole !== 'guru';

          return (
            <div
              key={menu.id}
              className="border border-[#E2E8F0] rounded-2xl p-5 bg-[#F8FAFC]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-base font-bold text-[#1a73e8] flex items-center gap-2">
                  <PushPin size={18} weight="fill" />
                  {menu.label.toUpperCase()} — {menu.subtitle}
                </h3>

                <div className="flex items-center gap-2">
                  {state === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#D1FAE5] text-[#065F46] px-2.5 py-1 rounded-md">
                      <CheckCircle size={14} weight="fill" />
                      Selesai
                    </span>
                  ) : isLocked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md">
                      <LockKey size={14} weight="bold" />
                      Terkunci
                    </span>
                  ) : null}

                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => onOpenStageInDashboard(menu.id)}
                      className="inline-flex items-center gap-1 bg-[#1E3A5F] hover:bg-[#152C5B] text-white px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition"
                    >
                      Buka Tahap
                      <ArrowSquareOut size={14} weight="bold" />
                    </button>
                  )}
                </div>
              </div>

              {menu.id === 'atp' ? (
                <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] space-y-2.5 text-sm">
                  <p>
                    <strong className="text-[#243B53]">Elemen:</strong>{' '}
                    {atpSections.elemen.join(', ') || 'Informatika'}
                  </p>
                  <p>
                    <strong className="text-[#243B53]">Capaian Pembelajaran:</strong>{' '}
                    {atpSections.capaianPembelajaran}
                  </p>
                  <p>
                    <strong className="text-[#243B53]">Tujuan Pembelajaran:</strong>{' '}
                    {atpSections.tujuanPembelajaran}
                  </p>
                  <p>
                    <strong className="text-[#243B53]">Topik:</strong>{' '}
                    {atpSections.topik || materi.judul_pertemuan}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-dashed border-[#E2E8F0] text-sm text-[#607286]">
                  Konten masih kosong (file JSON belum dihubungkan).
                </div>
              )}
            </div>
          );
        })}

        <div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 bg-[#dc3545] hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-[var(--font-nav)] font-bold text-sm cursor-pointer transition"
          >
            <ArrowLeft size={18} weight="bold" />
            Kembali ke Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
};
