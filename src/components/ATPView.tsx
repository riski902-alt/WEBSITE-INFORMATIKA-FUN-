import React from 'react';
import {
  Compass,
  BookBookmark,
  Target,
  Lightbulb,
  RocketLaunch,
  CheckCircle,
  ArrowRight,
} from '@phosphor-icons/react';
import { ParsedATPSections } from '../types/learning';

interface ATPViewProps {
  judulPertemuan: string;
  sections: ParsedATPSections;
  isCompleted: boolean;
  onCompleteAndContinue: () => void;
}

export const ATPView: React.FC<ATPViewProps> = ({
  judulPertemuan,
  sections,
  isCompleted,
  onCompleteAndContinue,
}) => {
  return (
    <div className="flex flex-col gap-5 text-[#243447]">
      {/* Deretan 4 Kartu ATP ke Bawah (1 Baris 1 Elemen) */}
      <div className="flex flex-col gap-4">
        {/* 1. Elemen */}
        <div className="group bg-white border border-[#527DA8]/20 rounded-2xl p-5 sm:p-6 shadow-sm cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] hover:border-[#88D4AB] hover:shadow-[0_12px_28px_rgba(30,58,95,0.18)] active:-translate-y-0.5 active:scale-[0.99] flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DCEAF5] text-[#243B53] flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95">
            <Compass size={26} weight="duotone" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#243B53] mb-1.5 transition-colors duration-300 group-hover:text-[#1E3A5F]">
              Elemen
            </h3>
            <p className="text-[0.95rem] leading-relaxed text-[#607286]">
              {sections.elemen.length > 0
                ? sections.elemen.join(', ')
                : 'Informatika'}
            </p>
          </div>
        </div>

        {/* 2. Capaian Pembelajaran */}
        <div className="group bg-white border border-[#527DA8]/20 rounded-2xl p-5 sm:p-6 shadow-sm cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] hover:border-[#88D4AB] hover:shadow-[0_12px_28px_rgba(30,58,95,0.18)] active:-translate-y-0.5 active:scale-[0.99] flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DCEAF5] text-[#527DA8] flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95">
            <BookBookmark size={26} weight="duotone" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#243B53] mb-1.5 transition-colors duration-300 group-hover:text-[#1E3A5F]">
              Capaian Pembelajaran
            </h3>
            <p className="text-[0.95rem] leading-relaxed text-[#607286]">
              {sections.capaianPembelajaran ||
                'Data Capaian Pembelajaran belum tersedia untuk pertemuan ini.'}
            </p>
          </div>
        </div>

        {/* 3. Tujuan Pembelajaran */}
        <div className="group bg-white border-2 border-[#88D4AB]/60 rounded-2xl p-5 sm:p-6 shadow-sm cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] hover:border-[#88D4AB] hover:shadow-[0_12px_28px_rgba(30,58,95,0.18)] active:-translate-y-0.5 active:scale-[0.99] flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E1EFE5] text-[#1E3A5F] flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95">
            <Target size={26} weight="duotone" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#243B53] mb-1.5 transition-colors duration-300 group-hover:text-[#1E3A5F]">
              Tujuan Pembelajaran
            </h3>
            <p className="text-[0.95rem] leading-relaxed text-[#243447] font-medium">
              {sections.tujuanPembelajaran ||
                'Data Tujuan Pembelajaran belum tersedia untuk pertemuan ini.'}
            </p>
          </div>
        </div>

        {/* 4. Topik */}
        <div className="group bg-white border border-[#527DA8]/20 rounded-2xl p-5 sm:p-6 shadow-sm cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] hover:border-[#88D4AB] hover:shadow-[0_12px_28px_rgba(30,58,95,0.18)] active:-translate-y-0.5 active:scale-[0.99] flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95">
            <Lightbulb size={26} weight="duotone" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#243B53] mb-1.5 transition-colors duration-300 group-hover:text-[#1E3A5F]">
              Topik
            </h3>
            <p className="text-[0.95rem] leading-relaxed text-[#607286]">
              {sections.topik || judulPertemuan}
            </p>
          </div>
        </div>
      </div>

      {/* Motivasi & Tombol Aksi Selesai (Lebih kecil & beda warna dari konten inti) */}
      <div className="max-w-3xl mx-auto w-full mt-1 bg-[#1E3A5F] border-2 border-[#88D4AB] rounded-xl py-3.5 px-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 text-white">
        <div className="flex items-center gap-3">
          <div className="text-[#88D4AB] shrink-0">
            <RocketLaunch size={24} weight="duotone" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#D8BD7B]">
              Siap Memulai Pembelajaran?
            </h4>
            <p className="text-xs sm:text-[13px] text-[#DCEAF5]/90 leading-snug">
              Setelah memahami Tujuan Pembelajaran di atas, lanjutkan ke tahap Asesmen Awal untuk mengukur kesiapanmu!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCompleteAndContinue}
          className="group inline-flex items-center justify-center gap-1.5 bg-[#88D4AB] hover:bg-[#9be0bb] text-[#1E3A5F] px-4 py-2 rounded-lg font-[var(--font-nav)] font-extrabold text-xs sm:text-[13px] cursor-pointer shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_20px_rgba(136,212,171,0.45)] active:translate-y-0 active:scale-95 shrink-0 w-full sm:w-auto"
        >
          {isCompleted ? (
            <>
              <CheckCircle
                size={16}
                weight="fill"
                className="transition-transform duration-300 group-hover:scale-110"
              />
              Lanjut ke Asesmen Awal
            </>
          ) : (
            <>
              Pahami ATP &amp; Lanjut
              <ArrowRight
                size={16}
                weight="bold"
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
