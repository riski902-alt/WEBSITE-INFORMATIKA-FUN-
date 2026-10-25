import React, { useEffect, useState } from 'react';
import {
  Lightbulb,
  NotePencil,
  Sparkle,
  PaperPlaneRight,
  CheckCircle,
  ArrowRight,
  PencilSimple,
  RocketLaunch,
  WarningCircle,
  Target,
} from '@phosphor-icons/react';
import { ParsedATPSections } from '../types/learning';
import {
  NormalizedPertanyaanEsensial,
  ambilDataPertanyaanEsensial,
} from '../utils/komponen-pertanyaanesensial';

interface PertanyaanEsensialViewProps {
  meetingId: string;
  userKey: string;
  judulPertemuan: string;
  atpSections: ParsedATPSections;
  isCompleted: boolean;
  onMarkCompleted: () => void;
  onContinueNext: () => void;
}

interface SavedAnswerState {
  answer: string;
  submitted: boolean;
  savedAt: string;
}

export const PertanyaanEsensialView: React.FC<PertanyaanEsensialViewProps> = ({
  meetingId,
  userKey,
  judulPertemuan,
  atpSections,
  isCompleted,
  onMarkCompleted,
  onContinueNext,
}) => {
  const storageKey = `infoFun_PertanyaanEsensial_${userKey}_${meetingId}`;

  const [data, setData] = useState<NormalizedPertanyaanEsensial | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [answerText, setAnswerText] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [validationHint, setValidationHint] = useState<string | null>(null);

  // Muat data Pertanyaan_Esensial.json secara mandiri
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    ambilDataPertanyaanEsensial(meetingId, atpSections, judulPertemuan)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat data Pertanyaan Esensial.'
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, atpSections, judulPertemuan]);

  // Muat jawaban siswa yang tersimpan di localStorage
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SavedAnswerState;
        setAnswerText(parsed.answer || '');
        setIsSubmitted(Boolean(parsed.submitted && parsed.answer?.trim()));
        setIsEditing(false);
        setValidationHint(null);
        return;
      } catch {
        // Abaikan jika gagal parse
      }
    }
    setAnswerText('');
    setIsSubmitted(false);
    setIsEditing(false);
    setValidationHint(null);
  }, [storageKey]);

  const handleSaveAndSubmit = () => {
    const cleanAnswer = answerText.trim();
    if (!cleanAnswer) {
      setValidationHint(
        'Silakan tuliskan jawaban atau pendapat awalmu terlebih dahulu sebelum menyimpan.'
      );
      return;
    }

    const payload: SavedAnswerState = {
      answer: cleanAnswer,
      submitted: true,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
    setAnswerText(cleanAnswer);
    setIsSubmitted(true);
    setIsEditing(false);
    setValidationHint(null);
    onMarkCompleted();
  };

  if (isLoading) {
    return (
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl p-8 text-center text-[#1E3A5F] font-[var(--font-nav)] shadow-sm">
        Memuat Pertanyaan Esensial...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white border-2 border-[#E57373] rounded-2xl p-6 text-center text-[#243447] shadow-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#E57373] mb-2">
          <WarningCircle size={28} weight="fill" />
        </div>
        <h3 className="text-base font-bold text-[#991B1B] mb-1">
          Gagal Memuat Pertanyaan Esensial
        </h3>
        <p className="text-sm text-[#607286]">{loadError}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl p-8 text-center text-[#243447] shadow-sm">
        <p className="text-sm text-[#607286] mb-4">
          Belum ada data Pertanyaan Esensial untuk pertemuan ini.
        </p>
        <button
          type="button"
          onClick={onContinueNext}
          className="inline-flex items-center gap-2 bg-[#1E3A5F] text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
        >
          Lanjut ke Tahap Berikutnya
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>
    );
  }

  const showAnswerForm = !isSubmitted || isEditing;

  return (
    <div className="flex flex-col gap-5 text-[#243447]">
      {/* 1 Kotak Utama Putih Membungkus Pertanyaan, Jawaban Siswa, & Pengantar Otomatis */}
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_14px_34px_rgba(21,44,91,0.16)]">
        <div className="flex flex-col gap-4">
          {/* 1. Kotak Pertanyaan Pemantik Esensial */}
          <div className="group bg-gradient-to-r from-[#FAF3E1] to-[#FDFBF4] border border-[#D8BD7B]/65 border-l-4 border-l-[#C9A44C] rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#D8BD7B] text-[#1E3A5F] shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6">
              <Lightbulb size={26} weight="duotone" />
            </div>
            <div className="flex-1">
              <p className="text-base sm:text-[1.05rem] font-bold text-[#1E3A5F] leading-relaxed">
                {data.pertanyaan}
              </p>
            </div>
          </div>

          {/* 2. Kotak Jawaban / Pendapat Siswa */}
          <div className="bg-gradient-to-r from-[#EDF4FB] to-[#F7FAFE] border border-[#527DA8]/30 border-l-4 border-l-[#527DA8] rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#527DA8] text-white shadow-sm flex items-center justify-center shrink-0">
                  <NotePencil size={22} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1E3A5F]">
                    Jawaban &amp; Pendapatmu
                  </h3>
                  <p className="text-xs text-[#607286]">
                    Ceritakan ide atau pengalamanmu berdasarkan pertanyaan di atas
                  </p>
                </div>
              </div>

              {isSubmitted && !isEditing && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#D1FAE5] text-[#065F46] px-2.5 py-1 rounded-md font-[var(--font-nav)]">
                    <CheckCircle size={14} weight="fill" />
                    Tersimpan
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 bg-white hover:bg-[#DCEAF5] text-[#1E3A5F] border border-[#527DA8]/40 px-2.5 py-1 rounded-md text-xs font-bold font-[var(--font-nav)] cursor-pointer transition"
                  >
                    <PencilSimple size={14} weight="bold" />
                    Ubah Jawaban
                  </button>
                </div>
              )}
            </div>

            {showAnswerForm ? (
              <div>
                <textarea
                  rows={4}
                  value={answerText}
                  onChange={(e) => {
                    setAnswerText(e.target.value);
                    if (validationHint) setValidationHint(null);
                  }}
                  placeholder="Tuliskan pendapat atau jawabanmu dengan bahasa sendiri di sini..."
                  className="w-full bg-white border border-[#CBD5E1] focus:border-[#527DA8] rounded-xl p-3.5 text-sm sm:text-[0.95rem] text-[#1E3A5F] leading-relaxed outline-none resize-y"
                />
              </div>
            ) : (
              <div className="bg-white border border-[#DCEAF5] rounded-xl p-4 text-sm sm:text-[0.95rem] text-[#243447] leading-relaxed whitespace-pre-wrap">
                {answerText}
              </div>
            )}
          </div>

          {/* 3. Keterangan / Penjelasan Pemantik Otomatis Menuju Materi Inti (Muncul Otomatis setelah Simpan) */}
          {isSubmitted && (
            <div className="group bg-gradient-to-r from-[#E5F5EC] to-[#F3FBF6] border-2 border-[#88D4AB] border-l-4 border-l-[#2F9E66] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#1E3A5F] text-[#88D4AB] shadow-sm flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Sparkle size={24} weight="fill" />
                </div>
                <div className="flex-1">
                  <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-[#1F7A4C] font-[var(--font-nav)] mb-1">
                    Pengantar Menuju Materi Inti
                  </span>
                  <h4 className="text-base font-bold text-[#1E3A5F] mb-1.5">
                    Kaitan Jawabanmu dengan Topik: {data.topik}
                  </h4>
                  <p className="text-sm sm:text-[0.95rem] text-[#243447] leading-relaxed">
                    {data.pengantarMateri}
                  </p>

                  {data.tujuanPembelajaran && (
                    <div className="mt-3.5 pt-3 border-t border-[#88D4AB]/50 flex items-start gap-2.5">
                      <Target
                        size={18}
                        weight="duotone"
                        className="text-[#1F7A4C] shrink-0 mt-0.5"
                      />
                      <p className="text-xs sm:text-[13px] text-[#1E3A5F] leading-snug">
                        <strong className="font-bold">Fokus Tujuan Pembelajaran:</strong>{' '}
                        {data.tujuanPembelajaran}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pesan Validasi jika jawaban masih kosong */}
      {validationHint && (
        <div className="max-w-3xl mx-auto w-full bg-[#FEE2E2] border border-[#E57373] text-[#991B1B] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold">
          {validationHint}
        </div>
      )}

      {/* Kotak Aksi Bawah yang Ringkas & Selaras dengan ATP dan Asesmen Awal */}
      <div className="max-w-3xl mx-auto w-full mt-1 bg-[#1E3A5F] border-2 border-[#88D4AB] rounded-xl py-3.5 px-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 text-white">
        <div className="flex items-center gap-3">
          <div className="text-[#88D4AB] shrink-0">
            <RocketLaunch size={24} weight="duotone" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#D8BD7B]">
              {showAnswerForm
                ? 'Sampaikan Pendapat Awalmu!'
                : 'Siap Menjelajahi Materi Inti?'}
            </h4>
            <p className="text-xs sm:text-[13px] text-[#DCEAF5]/90 leading-snug">
              {showAnswerForm
                ? 'Kirim dan simpan jawabanmu untuk melihat penjelasan pemantik menuju materi inti.'
                : 'Simak pengantar pemantik di atas, lalu lanjutkan ke tahap Eksplorasi Konsep!'}
            </p>
          </div>
        </div>

        {showAnswerForm ? (
          <button
            type="button"
            onClick={handleSaveAndSubmit}
            className="group inline-flex items-center justify-center gap-1.5 bg-[#88D4AB] hover:bg-[#9be0bb] text-[#1E3A5F] px-4 py-2 rounded-lg font-[var(--font-nav)] font-extrabold text-xs sm:text-[13px] cursor-pointer shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_20px_rgba(136,212,171,0.45)] active:translate-y-0 active:scale-95 shrink-0 w-full sm:w-auto"
          >
            Kirim &amp; Simpan Jawaban
            <PaperPlaneRight
              size={16}
              weight="fill"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinueNext}
            className="group inline-flex items-center justify-center gap-1.5 bg-[#88D4AB] hover:bg-[#9be0bb] text-[#1E3A5F] px-4 py-2 rounded-lg font-[var(--font-nav)] font-extrabold text-xs sm:text-[13px] cursor-pointer shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_20px_rgba(136,212,171,0.45)] active:translate-y-0 active:scale-95 shrink-0 w-full sm:w-auto"
          >
            {isCompleted ? (
              <>
                <CheckCircle
                  size={16}
                  weight="fill"
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                Lanjut ke Eksplorasi Konsep
              </>
            ) : (
              <>
                Lanjut ke Eksplorasi Konsep
                <ArrowRight
                  size={16}
                  weight="bold"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
