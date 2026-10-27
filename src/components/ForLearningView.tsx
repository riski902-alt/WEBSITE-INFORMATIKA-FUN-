import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  FloppyDisk,
  PencilSimple,
  ArrowRight,
  Trophy,
  WarningCircle,
  BookOpenText,
  RocketLaunch,
  SpinnerGap,
} from '@phosphor-icons/react';
import { UserSession } from '../types/learning';
import {
  ForLearningAnswersMap,
  ForLearningQuestionType,
  NormalizedForLearningQuestion,
  ambilSoalForLearning,
  evaluasiJawabanForLearning,
  formatAngkaPoin,
  langgananJawabanForLearning,
  simpanJawabanForLearningKeDatabase,
} from '../utils/komponen_for_learning.js';

interface ForLearningViewProps {
  session: UserSession;
  userKey: string;
  meetingId: string;
  judulBab: string;
  judulPertemuan: string;
  isCompleted: boolean;
  onMarkCompleted: () => void;
  onContinueNext: () => void;
}

function getQuestionTypeMeta(type: ForLearningQuestionType): {
  label: string;
  instruction: string;
  surfaceClass: string;
  numberBadgeClass: string;
} {
  switch (type) {
    case 'pg':
      return {
        label: 'Pilihan Ganda',
        instruction: 'Pilih satu jawaban yang paling tepat',
        surfaceClass: 'bg-[#F8FAFC] border-[#527DA8]/25',
        numberBadgeClass: 'bg-[#1E3A5F] text-[#88D4AB]',
      };
    case 'pg_kompleks':
      return {
        label: 'Pilihan Ganda Kompleks',
        instruction: 'Pilih seluruh pernyataan yang benar (lebih dari satu)',
        surfaceClass: 'bg-[#F5FBF8] border-[#88D4AB]/50',
        numberBadgeClass: 'bg-[#88D4AB] text-[#1E3A5F]',
      };
    case 'menjodohkan':
      return {
        label: 'Menjodohkan Konsep',
        instruction: 'Pasangkan pernyataan berikut dengan istilah yang sesuai',
        surfaceClass: 'bg-[#FCFBF7] border-[#D8BD7B]/55',
        numberBadgeClass: 'bg-[#D8BD7B] text-[#1E3A5F]',
      };
    default:
      return {
        label: 'Isian Singkat',
        instruction: 'Ketikkan istilah atau jawaban konsep yang tepat',
        surfaceClass: 'bg-[#F6FAFE] border-[#527DA8]/30',
        numberBadgeClass: 'bg-[#527DA8] text-white',
      };
  }
}

function apakahSoalSudahTerisi(
  soal: NormalizedForLearningQuestion,
  jawabanMap: ForLearningAnswersMap
): boolean {
  const val = jawabanMap[soal.id];
  if (soal.type === 'pg_kompleks') {
    return Array.isArray(val) && val.length > 0;
  }
  return typeof val === 'string' && val.trim().length > 0;
}

export const ForLearningView: React.FC<ForLearningViewProps> = ({
  session,
  userKey,
  meetingId,
  judulBab,
  judulPertemuan,
  isCompleted,
  onMarkCompleted,
  onContinueNext,
}) => {
  const [questions, setQuestions] = useState<NormalizedForLearningQuestion[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<ForLearningAnswersMap>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [saveStatus, setSaveStatus] = useState<{
    state: 'idle' | 'saving' | 'success' | 'error';
    message: string;
  }>({ state: 'idle', message: '' });

  const [validationNotice, setValidationNotice] = useState<string | null>(null);

  // 1. Muat soal For Learning sesuai pertemuan aktif
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setValidationNotice(null);
    setSaveStatus({ state: 'idle', message: '' });

    ambilSoalForLearning(meetingId)
      .then((list) => {
        if (cancelled) return;
        setQuestions(list);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat soal For Learning.'
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  // 2. Pulihkan & langgani jawaban real-time dari Firebase Firestore khusus akun siswa ini
  useEffect(() => {
    setAnswers({});
    setIsSubmitted(false);
    setIsEditing(false);
    setValidationNotice(null);
    setSaveStatus({ state: 'idle', message: '' });

    const unsubscribe = langgananJawabanForLearning(
      userKey,
      meetingId,
      (record) => {
        if (record && record.submitted) {
          setAnswers(record.jawaban || {});
          setIsSubmitted(true);
          setIsEditing((prevEditing) => prevEditing);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userKey, meetingId]);

  const evaluation = useMemo(
    () => evaluasiJawabanForLearning(questions, answers),
    [questions, answers]
  );

  const inputsLocked = (isSubmitted && !isEditing) || isSaving;

  const handleSelectPg = (questionId: string, optionKey: string) => {
    if (inputsLocked) return;
    setValidationNotice(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleTogglePgKompleks = (questionId: string, optionKey: string) => {
    if (inputsLocked) return;
    setValidationNotice(null);
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId])
        ? (prev[questionId] as string[])
        : [];
      const next = current.includes(optionKey)
        ? current.filter((k) => k !== optionKey)
        : [...current, optionKey];
      return {
        ...prev,
        [questionId]: next,
      };
    });
  };

  const handleSelectMenjodohkan = (questionId: string, chosenValue: string) => {
    if (inputsLocked) return;
    setValidationNotice(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: chosenValue,
    }));
  };

  const handleChangeIsian = (questionId: string, textValue: string) => {
    if (inputsLocked) return;
    setValidationNotice(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: textValue,
    }));
  };

  const handleSaveAnswers = async () => {
    if (isSaving || questions.length === 0) return;

    // Validasi kelengkapan seluruh jawaban terlebih dahulu
    const belumTerisi = questions.filter(
      (q) => !apakahSoalSudahTerisi(q, answers)
    );
    if (belumTerisi.length > 0) {
      const daftarNomor = belumTerisi.map((q) => q.nomorUrut).join(', ');
      setValidationNotice(
        `Masih ada soal yang belum dijawab (Nomor: ${daftarNomor}). Lengkapi seluruh jawaban sebelum menyimpan.`
      );
      return;
    }

    setValidationNotice(null);
    setIsSaving(true);
    setSaveStatus({
      state: 'saving',
      message: 'Menyimpan...',
    });

    const result = await simpanJawabanForLearningKeDatabase({
      session,
      userKey,
      meetingId,
      judulBab,
      judulPertemuan,
      daftarSoal: questions,
      jawabanMap: answers,
    });

    setIsSaving(false);

    if (result.ok) {
      setIsSubmitted(true);
      setIsEditing(false);
      setSaveStatus({
        state: 'success',
        message: 'Jawaban berhasil disimpan',
      });
      if (!isCompleted) {
        onMarkCompleted();
      }
    } else {
      setSaveStatus({
        state: 'error',
        message:
          result.errorMessage || 'Gagal menyimpan, silakan coba kembali',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl p-8 text-center text-[#1E3A5F] font-[var(--font-nav)] shadow-sm">
        Memuat latihan interaktif For Learning...
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
          Gagal Memuat Soal For Learning
        </h3>
        <p className="text-sm text-[#607286]">{loadError}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl p-8 text-center text-[#243447] shadow-sm">
        <p className="text-sm text-[#607286]">
          Belum ada soal For Learning yang tersedia untuk pertemuan ini.
        </p>
      </div>
    );
  }

  const showResultsAndExplanation = isSubmitted && !isEditing;
  const answeredCount = questions.filter((q) =>
    apakahSoalSudahTerisi(q, answers)
  ).length;

  return (
    <div className="flex flex-col gap-5 text-[#243447]">
      {/* Kontainer Utama Putih Selaras Tema Informatika Fun */}
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_14px_34px_rgba(21,44,91,0.16)] flex flex-col gap-5">
        {/* Ringkasan Progres Pengerjaan / Hasil Poin Otomatis */}
        {showResultsAndExplanation ? (
          <div className="rounded-2xl bg-gradient-to-r from-[#1E3A5F] to-[#243B53] border border-[#88D4AB] p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#88D4AB]/20 border border-[#88D4AB] flex items-center justify-center text-[#D8BD7B] shrink-0">
                <Trophy size={24} weight="fill" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#88D4AB] font-[var(--font-nav)] font-bold">
                  <span>Hasil Latihan For Learning</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {evaluation.jumlahBenar} dari {evaluation.totalSoal} Benar
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-white tabular-nums mt-0.5">
                  Skor: {formatAngkaPoin(evaluation.poinDiperoleh)}/
                  {evaluation.skorMaksimal}{' '}
                  <span className="text-xs sm:text-sm font-normal text-[#DCEAF5]">
                    (Poin diperoleh: {formatAngkaPoin(evaluation.poinDiperoleh)})
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setSaveStatus({ state: 'idle', message: '' });
              }}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white px-3.5 py-2 rounded-xl font-[var(--font-nav)] font-bold text-xs sm:text-sm cursor-pointer transition whitespace-nowrap shrink-0"
            >
              <PencilSimple size={16} weight="bold" />
              <span>Ubah Jawaban</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 text-xs sm:text-sm font-[var(--font-nav)]">
            <span className="font-bold text-[#1E3A5F]">
              Kerjakan seluruh soal sesuai materi pertemuan ini
            </span>
            <span className="text-[#527DA8] font-semibold tabular-nums">
              Terjawab: {answeredCount} dari {questions.length} soal (Skala 0–100)
            </span>
          </div>
        )}

        {/* Daftar 8 Kartu Soal */}
        <div className="flex flex-col gap-4">
          {questions.map((soal) => {
            const meta = getQuestionTypeMeta(soal.type);
            const itemEval = evaluation.hasilPerSoal[soal.id];
            const currentVal = answers[soal.id];

            return (
              <div
                key={soal.id}
                id={`kartu-soal-${soal.nomorUrut}`}
                className={`rounded-2xl border p-4 sm:p-5 transition duration-150 ${meta.surfaceClass}`}
              >
                {/* Header Kartu Soal */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 tabular-nums font-[var(--font-nav)] ${meta.numberBadgeClass}`}
                    >
                      {soal.nomorUrut}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#527DA8] font-[var(--font-nav)] font-semibold">
                      <span className="text-[#1E3A5F] font-bold">
                        {meta.label}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{meta.instruction}</span>
                    </div>
                  </div>

                  {showResultsAndExplanation && itemEval && (
                    <div
                      className={`inline-flex items-center gap-1.5 text-xs font-bold font-[var(--font-nav)] tabular-nums ${
                        itemEval.benar ? 'text-[#065F46]' : 'text-[#991B1B]'
                      }`}
                    >
                      {itemEval.benar ? (
                        <CheckCircle size={17} weight="fill" className="text-[#10B981]" />
                      ) : (
                        <XCircle size={17} weight="fill" className="text-[#EF4444]" />
                      )}
                      <span>
                        {itemEval.benar
                          ? `Benar (+${formatAngkaPoin(itemEval.poinDiperoleh)} Poin)`
                          : 'Belum Tepat (0 Poin)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Teks Pertanyaan / Pernyataan */}
                <p className="text-[0.95rem] sm:text-base font-bold text-[#1E3A5F] leading-relaxed mb-3.5">
                  {soal.pertanyaan}
                </p>

                {/* Kontrol Input Berdasarkan Tipe Soal */}
                {soal.type === 'pg' && soal.pilihan && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {soal.pilihan.map((opt) => {
                      const selected = currentVal === opt.key;
                      const isCorrectKey =
                        showResultsAndExplanation && soal.kunciJawaban === opt.key;
                      const isWrongSelected =
                        showResultsAndExplanation && selected && !isCorrectKey;

                      let optClass =
                        'bg-white border-slate-200 text-[#243447] hover:border-[#527DA8]';
                      if (isCorrectKey) {
                        optClass =
                          'bg-[#E8F8EE] border-[#10B981] text-[#065F46] font-semibold';
                      } else if (isWrongSelected) {
                        optClass =
                          'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B]';
                      } else if (selected) {
                        optClass =
                          'bg-[#EDF4FB] border-[#1E3A5F] text-[#1E3A5F] font-semibold ring-1 ring-[#1E3A5F]/30';
                      }

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={inputsLocked}
                          onClick={() => handleSelectPg(soal.id, opt.key)}
                          className={`w-full text-left rounded-xl border p-3 flex items-start gap-2.5 text-sm transition duration-150 ${
                            inputsLocked ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
                          } ${optClass}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                              selected
                                ? 'bg-[#1E3A5F] text-[#88D4AB]'
                                : 'bg-slate-100 text-[#1E3A5F]'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="leading-snug">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {soal.type === 'pg_kompleks' && soal.pilihan && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {soal.pilihan.map((opt) => {
                      const selectedArr = Array.isArray(currentVal)
                        ? currentVal
                        : [];
                      const checked = selectedArr.includes(opt.key);
                      const isKey =
                        showResultsAndExplanation &&
                        Boolean(soal.kunciJawabanList?.includes(opt.key));
                      const isWrongChecked =
                        showResultsAndExplanation && checked && !isKey;

                      let optClass =
                        'bg-white border-slate-200 text-[#243447] hover:border-[#3BA776]';
                      if (isKey) {
                        optClass =
                          'bg-[#E8F8EE] border-[#10B981] text-[#065F46] font-semibold';
                      } else if (isWrongChecked) {
                        optClass =
                          'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B]';
                      } else if (checked) {
                        optClass =
                          'bg-[#E8F5EE] border-[#3BA776] text-[#1E3A5F] font-semibold ring-1 ring-[#3BA776]/30';
                      }

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={inputsLocked}
                          onClick={() =>
                            handleTogglePgKompleks(soal.id, opt.key)
                          }
                          className={`w-full text-left rounded-xl border p-3 flex items-start gap-2.5 text-sm transition duration-150 ${
                            inputsLocked ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
                          } ${optClass}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md border text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                              checked
                                ? 'bg-[#1E3A5F] border-[#1E3A5F] text-[#88D4AB]'
                                : 'bg-white border-slate-300 text-[#1E3A5F]'
                            }`}
                          >
                            {checked ? '✓' : opt.key}
                          </span>
                          <span className="leading-snug">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {soal.type === 'menjodohkan' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs sm:text-sm font-semibold text-[#527DA8]">
                      Pasangan Konsep:
                    </span>
                    <select
                      aria-label={`Pilih pasangan untuk soal nomor ${soal.nomorUrut}`}
                      disabled={inputsLocked}
                      value={typeof currentVal === 'string' ? currentVal : ''}
                      onChange={(e) =>
                        handleSelectMenjodohkan(soal.id, e.target.value)
                      }
                      className="w-full sm:w-72 rounded-xl border border-[#527DA8]/40 bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#1E3A5F] focus:outline-none focus:border-[#1E3A5F] disabled:opacity-75"
                    >
                      <option value="">-- Pilih istilah yang tepat --</option>
                      {(soal.opsiMenjodohkan || []).map((opsi) => (
                        <option key={opsi} value={opsi}>
                          {opsi}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {soal.type === 'isian' && (
                  <div>
                    <input
                      type="text"
                      disabled={inputsLocked}
                      value={typeof currentVal === 'string' ? currentVal : ''}
                      onChange={(e) =>
                        handleChangeIsian(soal.id, e.target.value)
                      }
                      placeholder="Ketik jawaban singkatmu di sini..."
                      className="w-full rounded-xl border border-[#527DA8]/40 bg-white px-4 py-2.5 text-sm sm:text-base text-[#1E3A5F] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] disabled:bg-slate-50"
                    />
                  </div>
                )}

                {/* Kotak Penjelasan Inti Otomatis (Muncul Setelah Jawaban Berhasil Disimpan) */}
                {showResultsAndExplanation && itemEval && (
                  <div className="mt-3.5 rounded-xl bg-white border border-[#527DA8]/25 p-3.5 sm:p-4 flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-[var(--font-nav)]">
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#1E3A5F]">
                        <BookOpenText
                          size={16}
                          weight="duotone"
                          className="text-[#527DA8]"
                        />
                        Kunci Konsep: {itemEval.kunciTeks}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#243447] leading-relaxed">
                      <strong className="text-[#1E3A5F]">
                        Penjelasan inti:
                      </strong>{' '}
                      {itemEval.penjelasanInti}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Umpan Balik Validasi & Status Penyimpanan Real-Time */}
        {validationNotice && (
          <div className="rounded-xl bg-[#FEF3C7] border border-[#D97706]/50 px-4 py-3 text-xs sm:text-sm font-medium text-[#92400E] flex items-center gap-2.5">
            <WarningCircle size={19} weight="fill" className="shrink-0" />
            <span>{validationNotice}</span>
          </div>
        )}

        {saveStatus.state !== 'idle' && (
          <div
            role="status"
            className={`rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
              saveStatus.state === 'saving'
                ? 'bg-[#EDF4FB] border border-[#527DA8]/40 text-[#1E3A5F]'
                : saveStatus.state === 'success'
                  ? 'bg-[#E8F8EE] border border-[#88D4AB] text-[#065F46]'
                  : 'bg-[#FEE2E2] border border-[#E57373] text-[#991B1B]'
            }`}
          >
            {saveStatus.state === 'saving' ? (
              <SpinnerGap size={19} weight="bold" className="animate-spin shrink-0" />
            ) : saveStatus.state === 'success' ? (
              <CheckCircle size={19} weight="fill" className="shrink-0" />
            ) : (
              <WarningCircle size={19} weight="fill" className="shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
        )}

        {/* Tombol Utama Simpan Jawaban */}
        {(!isSubmitted || isEditing) && (
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            {isEditing && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setIsEditing(false);
                  setValidationNotice(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-bold text-[#243447] cursor-pointer transition whitespace-nowrap"
              >
                Batal
              </button>
            )}

            <button
              type="button"
              id="btn-simpan-for-learning"
              disabled={isSaving}
              onClick={handleSaveAnswers}
              className="inline-flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152C5B] disabled:opacity-60 text-white px-6 py-3 rounded-xl font-[var(--font-nav)] font-bold text-sm sm:text-base cursor-pointer transition duration-150 shadow-md active:scale-[0.98] whitespace-nowrap"
            >
              <FloppyDisk size={20} weight="fill" className="text-[#88D4AB]" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Jawaban'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bar Bawah Lanjut ke Menu Berikutnya (Penerapan Konsep) */}
      <div className="max-w-3xl mx-auto w-full bg-[#1E3A5F] border-2 border-[#88D4AB] rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#88D4AB]/20 border border-[#88D4AB] flex items-center justify-center text-[#88D4AB] shrink-0">
            {isSubmitted || isCompleted ? (
              <CheckCircle size={18} weight="fill" />
            ) : (
              <RocketLaunch size={18} weight="duotone" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white leading-tight">
              {isSubmitted || isCompleted
                ? `Latihan Selesai — Skor ${formatAngkaPoin(evaluation.poinDiperoleh)}/${evaluation.skorMaksimal}`
                : 'Selesaikan & Simpan Jawaban Latihan'}
            </h4>
            <p className="text-[11px] sm:text-xs text-[#DCEAF5]">
              {isSubmitted || isCompleted
                ? 'Pelajari penjelasan inti di atas atau lanjutkan ke Penerapan Konsep.'
                : 'Klik Simpan Jawaban untuk melihat penjelasan inti dan perolehan poin.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!isSubmitted && !isCompleted}
          onClick={onContinueNext}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-[var(--font-nav)] font-bold text-xs sm:text-sm transition shrink-0 whitespace-nowrap ${
            isSubmitted || isCompleted
              ? 'bg-[#88D4AB] hover:bg-[#74c69a] text-[#1E3A5F] cursor-pointer shadow-sm'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
          }`}
        >
          <span>Lanjut ke Penerapan Konsep</span>
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
};
