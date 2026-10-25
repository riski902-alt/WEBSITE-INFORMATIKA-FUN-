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
      {/* 1 Kotak Utama Warna Putih yang membungkus ke-4 kotak elemen ATP */}
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_14px_34px_rgba(21,44,91,0.16)]">
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {/* 1. Elemen — Nuansa Navy & Pale Blue */}
          <div className="group bg-gradient-to-r from-[#EDF4FB] to-[#F7FAFE] border border-[#527DA8]/25 border-l-4 border-l-[#1E3A5F] rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#527DA8]/55 hover:shadow-[0_10px_24px_rgba(30,58,95,0.12)] active:translate-y-0 active:scale-[0.995] flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1E3A5F] text-[#88D4AB] shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95">
              <Compass size={26} weight="duotone" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#1E3A5F] mb-1">
                Elemen
              </h3>
              <p className="text-[0.95rem] leading-relaxed text-[#3B526B]">
                {sections.elemen.length > 0
                  ? sections.elemen.join(', ')
                  : 'Informatika'}
              </p>
            </div>
          </div>

          {/* 2. Capaian Pembelajaran — Nuansa Denim Blue */}
          <div className="group bg-gradient-to-r from-[#E6F0FA] to-[#F5F9FD] border border-[#527DA8]/30 border-l-4 border-l-[#527DA8] rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#527DA8]/65 hover:shadow-[0_10px_24px_rgba(82,125,168,0.15)] active:translate-y-0 active:scale-[0.995] flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#527DA8] text-white shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95">
              <BookBookmark size={26} weight="duotone" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#1E3A5F] mb-1">
                Capaian Pembelajaran
              </h3>
              <p className="text-[0.95rem] leading-relaxed text-[#3B526B]">
                {sections.capaianPembelajaran ||
                  'Data Capaian Pembelajaran belum tersedia untuk pertemuan ini.'}
              </p>
            </div>
          </div>

          {/* 3. Tujuan Pembelajaran — Nuansa Mint Green (Aksen Utama Informatika Fun) */}
          <div className="group bg-gradient-to-r from-[#E5F5EC] to-[#F3FBF6] border border-[#88D4AB]/65 border-l-4 border-l-[#3BA776] rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#3BA776]/70 hover:shadow-[0_10px_24px_rgba(59,167,118,0.15)] active:translate-y-0 active:scale-[0.995] flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#88D4AB] text-[#1E3A5F] shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95">
              <Target size={26} weight="duotone" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#1E3A5F] mb-1">
                Tujuan Pembelajaran
              </h3>
              <p className="text-[0.95rem] leading-relaxed text-[#243447] font-medium">
                {sections.tujuanPembelajaran ||
                  'Data Tujuan Pembelajaran belum tersedia untuk pertemuan ini.'}
              </p>
            </div>
          </div>

          {/* 4. Topik — Nuansa Soft Gold (Selaras dengan Badge Pertemuan) */}
          <div className="group bg-gradient-to-r from-[#FAF3E1] to-[#FDFBF4] border border-[#D8BD7B]/60 border-l-4 border-l-[#C9A44C] rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-[#C9A44C]/75 hover:shadow-[0_10px_24px_rgba(201,164,76,0.16)] active:translate-y-0 active:scale-[0.995] flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D8BD7B] text-[#1E3A5F] shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95">
              <Lightbulb size={26} weight="duotone" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#1E3A5F] mb-1">
                Topik
              </h3>
              <p className="text-[0.95rem] leading-relaxed text-[#3B526B]">
                {sections.topik || judulPertemuan}
              </p>
            </div>
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
