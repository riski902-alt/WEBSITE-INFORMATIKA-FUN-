import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  ArrowRight,
  Trophy,
  CheckSquareOffset,
  RocketLaunch,
  WarningCircle,
} from '@phosphor-icons/react';
import { NormalizedQuestion } from '../types/learning';
import { ambilSoalAsesmenAwal } from '../utils/komponen-asesmenawal';

interface AsesmenAwalViewProps {
  meetingId: string;
  userKey: string;
  isCompleted: boolean;
  onCompleteAndContinue: () => void;
}

interface SavedQuizState {
  pgAnswers: Record<string, string>;
  pgKompleksAnswers: Record<string, string[]>;
  matchingAnswers: Record<string, Record<number, string>>;
  isianAnswers: Record<string, string>;
  submitted: boolean;
}

function normalizeTextForComparison(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/[.,!?;"'()]/g, '')
    .replace(/\s+/g, ' ');
}

function deterministicShuffle(items: string[], seedStr: string): string[] {
  const copy = [...items];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function evaluateQuestion(
  q: NormalizedQuestion,
  state: SavedQuizState
): { isCorrect: boolean; earnedPoints: number } {
  if (q.type === 'pg') {
    const selected = state.pgAnswers[q.id];
    const ok = selected === q.correctKey;
    return { isCorrect: ok, earnedPoints: ok ? q.points : 0 };
  }

  if (q.type === 'pg_kompleks') {
    const selected = [...(state.pgKompleksAnswers[q.id] || [])].sort();
    const expected = [...q.correctKeys].sort();
    const ok =
      selected.length === expected.length &&
      selected.every((val, idx) => val === expected[idx]);
    return { isCorrect: ok, earnedPoints: ok ? q.points : 0 };
  }

  if (q.type === 'menjodohkan') {
    const map = state.matchingAnswers[q.id] || {};
    const ok =
      q.pairs.length > 0 &&
      q.pairs.every((pair, idx) => map[idx] === pair.right);
    return { isCorrect: ok, earnedPoints: ok ? q.points : 0 };
  }

  const typed = normalizeTextForComparison(state.isianAnswers[q.id] || '');
  const ok =
    typed.length > 0 &&
    q.acceptedAnswers.some(
      (ans) => normalizeTextForComparison(ans) === typed
    );
  return { isCorrect: ok, earnedPoints: ok ? q.points : 0 };
}

function getQuestionCardTheme(type: NormalizedQuestion['type']): {
  cardBg: string;
  badgeBg: string;
  label: string;
} {
  switch (type) {
    case 'pg':
      return {
        cardBg:
          'from-[#EDF4FB] to-[#F7FAFE] border-[#527DA8]/25 border-l-[#1E3A5F]',
        badgeBg: 'bg-[#1E3A5F] text-[#88D4AB]',
        label: 'Pilihan Ganda',
      };
    case 'pg_kompleks':
      return {
        cardBg:
          'from-[#E5F5EC] to-[#F3FBF6] border-[#88D4AB]/60 border-l-[#3BA776]',
        badgeBg: 'bg-[#88D4AB] text-[#1E3A5F]',
        label: 'Pilihan Ganda Kompleks',
      };
    case 'menjodohkan':
      return {
        cardBg:
          'from-[#FAF3E1] to-[#FDFBF4] border-[#D8BD7B]/60 border-l-[#C9A44C]',
        badgeBg: 'bg-[#D8BD7B] text-[#1E3A5F]',
        label: 'Menjodohkan',
      };
    default:
      return {
        cardBg:
          'from-[#E6F0FA] to-[#F5F9FD] border-[#527DA8]/30 border-l-[#527DA8]',
        badgeBg: 'bg-[#527DA8] text-white',
        label: 'Isian Singkat',
      };
  }
}

export const AsesmenAwalView: React.FC<AsesmenAwalViewProps> = ({
  meetingId,
  userKey,
  isCompleted,
  onCompleteAndContinue,
}) => {
  const storageKey = `infoFun_Asesmen_${userKey}_${meetingId}`;

  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [quizState, setQuizState] = useState<SavedQuizState>({
    pgAnswers: {},
    pgKompleksAnswers: {},
    matchingAnswers: {},
    isianAnswers: {},
    submitted: false,
  });

  const [validationHint, setValidationHint] = useState<string | null>(null);

  // Muat data soal secara mandiri melalui komponen-asesmenawal
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    ambilSoalAsesmenAwal(meetingId)
      .then((items) => {
        if (!cancelled) {
          setQuestions(items);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat data Asesmen Awal.'
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  // Muat jawaban tersimpan dari localStorage
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SavedQuizState;
        setQuizState({
          pgAnswers: parsed.pgAnswers || {},
          pgKompleksAnswers: parsed.pgKompleksAnswers || {},
          matchingAnswers: parsed.matchingAnswers || {},
          isianAnswers: parsed.isianAnswers || {},
          submitted: Boolean(parsed.submitted),
        });
        setValidationHint(null);
        return;
      } catch {
        // Gunakan state kosong jika gagal parse
      }
    }
    setQuizState({
      pgAnswers: {},
      pgKompleksAnswers: {},
      matchingAnswers: {},
      isianAnswers: {},
      submitted: false,
    });
    setValidationHint(null);
  }, [storageKey]);

  const persistState = (next: SavedQuizState) => {
    setQuizState(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const shuffledMatchingOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    questions.forEach((q) => {
      if (q.type === 'menjodohkan') {
        map[q.id] = deterministicShuffle(
          q.pairs.map((p) => p.right),
          `${meetingId}-${q.id}`
        );
      }
    });
    return map;
  }, [questions, meetingId]);

  const scoreSummary = useMemo(() => {
    let earned = 0;
    let maxPoints = 0;
    let correctCount = 0;

    questions.forEach((q) => {
      maxPoints += q.points;
      const res = evaluateQuestion(q, quizState);
      if (res.isCorrect) {
        correctCount += 1;
        earned += res.earnedPoints;
      }
    });

    const normalizedScore =
      maxPoints > 0 ? Math.round((earned / maxPoints) * 100) : 0;

    return { earned, maxPoints, correctCount, normalizedScore };
  }, [questions, quizState]);

  const handleToggleMulti = (qId: string, optionKey: string) => {
    if (quizState.submitted) return;
    const prev = quizState.pgKompleksAnswers[qId] || [];
    const nextList = prev.includes(optionKey)
      ? prev.filter((k) => k !== optionKey)
      : [...prev, optionKey];

    persistState({
      ...quizState,
      pgKompleksAnswers: {
        ...quizState.pgKompleksAnswers,
        [qId]: nextList,
      },
    });
  };

  const handleSubmitQuiz = () => {
    const unansweredIndex = questions.findIndex((q) => {
      if (q.type === 'pg') return !quizState.pgAnswers[q.id];
      if (q.type === 'pg_kompleks')
        return (quizState.pgKompleksAnswers[q.id] || []).length === 0;
      if (q.type === 'menjodohkan') {
        const m = quizState.matchingAnswers[q.id] || {};
        return q.pairs.some((_, idx) => !m[idx]);
      }
      return !(quizState.isianAnswers[q.id] || '').trim();
    });

    if (unansweredIndex !== -1) {
      setValidationHint(
        `Masih ada soal yang belum dijawab (Soal Nomor ${unansweredIndex + 1}). Silakan lengkapi seluruh jawaban terlebih dahulu.`
      );
      return;
    }

    setValidationHint(null);
    persistState({
      ...quizState,
      submitted: true,
    });
  };

  const handleResetQuiz = () => {
    const empty: SavedQuizState = {
      pgAnswers: {},
      pgKompleksAnswers: {},
      matchingAnswers: {},
      isianAnswers: {},
      submitted: false,
    };
    setValidationHint(null);
    persistState(empty);
  };

  if (isLoading) {
    return (
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl p-8 text-center text-[#1E3A5F] font-[var(--font-nav)] shadow-sm">
        Memuat soal Asesmen Awal...
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
          Gagal Memuat Soal Asesmen Awal
        </h3>
        <p className="text-sm text-[#607286]">{loadError}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl p-8 text-center text-[#243447] shadow-sm">
        <p className="text-sm text-[#607286] mb-4">
          Belum ada butir soal Asesmen Awal untuk pertemuan ini.
        </p>
        <button
          type="button"
          onClick={onCompleteAndContinue}
          className="inline-flex items-center gap-2 bg-[#1E3A5F] text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
        >
          Lanjut ke Tahap Berikutnya
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-[#243447]">
      {/* Ringkasan Skor setelah Submit (Ringkas & Tidak Dominan) */}
      {quizState.submitted && (
        <div className="bg-[#1E3A5F] border border-[#88D4AB] rounded-xl py-2.5 px-4 text-white shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#88D4AB]/20 border border-[#88D4AB]/70 flex items-center justify-center text-[#88D4AB] shrink-0">
              <Trophy size={20} weight="duotone" />
            </div>
            <div className="leading-tight">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D8BD7B] font-[var(--font-nav)]">
                  Hasil Asesmen Awal
                </span>
                <span className="text-base sm:text-lg font-bold text-white font-[var(--font-title)]">
                  Nilai: {scoreSummary.normalizedScore} / 100
                </span>
              </div>
              <p className="text-xs text-[#DCEAF5]/90 mt-0.5">
                Menjawab benar {scoreSummary.correctCount} dari{' '}
                {questions.length} soal ({scoreSummary.earned} dari{' '}
                {scoreSummary.maxPoints} poin).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetQuiz}
            className="inline-flex items-center justify-center gap-1.5 bg-[#152C5B] hover:bg-[#23436b] text-white border border-white/25 px-3 py-1.5 rounded-lg font-[var(--font-nav)] font-bold text-xs cursor-pointer transition shrink-0"
          >
            <ArrowsClockwise size={14} weight="bold" />
            Ulangi Kuis
          </button>
        </div>
      )}

      {/* 1 Kotak Utama Putih Membungkus Seluruh Butir Soal Asesmen Awal (Selaras dengan ATP) */}
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_14px_34px_rgba(21,44,91,0.16)]">
        <div className="flex flex-col gap-4">
          {questions.map((q, index) => {
            const evalResult = quizState.submitted
              ? evaluateQuestion(q, quizState)
              : null;
            const theme = getQuestionCardTheme(q.type);

            return (
              <div
                key={q.id}
                className={`bg-gradient-to-r ${theme.cardBg} border border-l-4 rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md ${
                  evalResult
                    ? evalResult.isCorrect
                      ? 'ring-2 ring-[#10B981]/60'
                      : 'ring-2 ring-[#E57373]/60'
                    : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-extrabold text-xs font-[var(--font-nav)] shadow-sm ${theme.badgeBg}`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold bg-white/85 text-[#1E3A5F] border border-[#527DA8]/25 px-2.5 py-1 rounded-md font-[var(--font-nav)]">
                      {theme.label}
                    </span>
                    <span className="text-xs text-[#3B526B] font-semibold font-[var(--font-nav)]">
                      ({q.points} Poin)
                    </span>
                  </div>

                  {evalResult && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md font-[var(--font-nav)] ${
                        evalResult.isCorrect
                          ? 'bg-[#D1FAE5] text-[#065F46]'
                          : 'bg-[#FEE2E2] text-[#991B1B]'
                      }`}
                    >
                      {evalResult.isCorrect ? (
                        <>
                          <CheckCircle size={15} weight="fill" />
                          Benar (+{evalResult.earnedPoints})
                        </>
                      ) : (
                        <>
                          <XCircle size={15} weight="fill" />
                          Belum Tepat (0)
                        </>
                      )}
                    </span>
                  )}
                </div>

                <p className="text-[0.96rem] font-semibold text-[#1E3A5F] mb-3.5 leading-relaxed">
                  {q.prompt}
                </p>

                {/* TIPE 1: PILIHAN GANDA */}
                {q.type === 'pg' && (
                  <div className="grid grid-cols-1 gap-2.5">
                    {q.options.map((opt) => {
                      const selected = quizState.pgAnswers[q.id] === opt.key;
                      const isRightOption =
                        quizState.submitted && opt.key === q.correctKey;
                      const isWrongSelected =
                        quizState.submitted &&
                        selected &&
                        opt.key !== q.correctKey;

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={quizState.submitted}
                          onClick={() =>
                            persistState({
                              ...quizState,
                              pgAnswers: {
                                ...quizState.pgAnswers,
                                [q.id]: opt.key,
                              },
                            })
                          }
                          className={`text-left flex items-center gap-3 p-3.5 rounded-xl border text-sm transition ${
                            isRightOption
                              ? 'bg-[#D1FAE5] border-[#10B981] text-[#065F46] font-semibold'
                              : isWrongSelected
                              ? 'bg-[#FEE2E2] border-[#E57373] text-[#991B1B]'
                              : selected
                              ? 'bg-[#DCEAF5] border-[#527DA8] text-[#1E3A5F] font-semibold shadow-sm'
                              : 'bg-white border-[#CBD5E1]/80 hover:border-[#527DA8] text-[#243447]'
                          } ${
                            quizState.submitted
                              ? 'cursor-default'
                              : 'cursor-pointer'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              selected
                                ? 'bg-[#1E3A5F] text-white'
                                : 'bg-[#F8FAFC] border border-[#CBD5E1] text-[#243B53]'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* TIPE 2: PILIHAN GANDA KOMPLEKS */}
                {q.type === 'pg_kompleks' && (
                  <div>
                    <p className="text-xs text-[#243B53] font-semibold mb-2.5 flex items-center gap-1.5">
                      <CheckSquareOffset size={16} weight="bold" />
                      {q.hint || 'Pilih lebih dari satu jawaban yang benar.'}
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {q.options.map((opt) => {
                        const selectedList =
                          quizState.pgKompleksAnswers[q.id] || [];
                        const checked = selectedList.includes(opt.key);
                        const isRightOption =
                          quizState.submitted &&
                          q.correctKeys.includes(opt.key);
                        const isWrongSelected =
                          quizState.submitted &&
                          checked &&
                          !q.correctKeys.includes(opt.key);

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            disabled={quizState.submitted}
                            onClick={() => handleToggleMulti(q.id, opt.key)}
                            className={`text-left flex items-center gap-3 p-3.5 rounded-xl border text-sm transition ${
                              isRightOption
                                ? 'bg-[#D1FAE5] border-[#10B981] text-[#065F46] font-semibold'
                                : isWrongSelected
                                ? 'bg-[#FEE2E2] border-[#E57373] text-[#991B1B]'
                                : checked
                                ? 'bg-[#DCEAF5] border-[#527DA8] text-[#1E3A5F] font-semibold shadow-sm'
                                : 'bg-white border-[#CBD5E1]/80 hover:border-[#527DA8] text-[#243447]'
                            } ${
                              quizState.submitted
                                ? 'cursor-default'
                                : 'cursor-pointer'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 border ${
                                checked
                                  ? 'bg-[#1E3A5F] border-[#1E3A5F] text-white'
                                  : 'bg-[#F8FAFC] border-[#CBD5E1] text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TIPE 3: MENJODOHKAN */}
                {q.type === 'menjodohkan' && (
                  <div className="space-y-2.5">
                    {q.pairs.map((pair, pairIdx) => {
                      const currentMap = quizState.matchingAnswers[q.id] || {};
                      const selectedVal = currentMap[pairIdx] || '';
                      const rightChoices = shuffledMatchingOptions[q.id] || [];

                      return (
                        <div
                          key={pairIdx}
                          className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3.5 rounded-xl bg-white border border-[#CBD5E1]/80"
                        >
                          <div className="flex-1 text-sm font-medium text-[#243B53]">
                            {pair.left}
                          </div>
                          <div className="sm:w-[52%]">
                            <select
                              disabled={quizState.submitted}
                              value={selectedVal}
                              onChange={(e) =>
                                persistState({
                                  ...quizState,
                                  matchingAnswers: {
                                    ...quizState.matchingAnswers,
                                    [q.id]: {
                                      ...currentMap,
                                      [pairIdx]: e.target.value,
                                    },
                                  },
                                })
                              }
                              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#243B53] outline-none focus:border-[#527DA8]"
                            >
                              <option value="">
                                -- Pilih Pasangan Jawaban --
                              </option>
                              {rightChoices.map((choice, cIdx) => (
                                <option key={cIdx} value={choice}>
                                  {choice}
                                </option>
                              ))}
                            </select>
                            {quizState.submitted &&
                              selectedVal !== pair.right && (
                                <p className="text-xs text-[#065F46] font-semibold mt-1">
                                  Pasangan tepat: {pair.right}
                                </p>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TIPE 4: ISIAN SINGKAT */}
                {q.type === 'isian' && (
                  <div>
                    <input
                      type="text"
                      disabled={quizState.submitted}
                      value={quizState.isianAnswers[q.id] || ''}
                      onChange={(e) =>
                        persistState({
                          ...quizState,
                          isianAnswers: {
                            ...quizState.isianAnswers,
                            [q.id]: e.target.value,
                          },
                        })
                      }
                      placeholder="Ketik jawaban singkatmu di sini..."
                      className="w-full bg-white border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-sm text-[#243B53] outline-none focus:border-[#527DA8]"
                    />
                    {quizState.submitted &&
                      evalResult &&
                      !evalResult.isCorrect && (
                        <p className="text-xs text-[#065F46] font-semibold mt-2">
                          Kunci Jawaban: {q.acceptedAnswers.join(' / ')}
                        </p>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pesan Validasi jika ada soal yang belum dijawab */}
      {validationHint && (
        <div className="max-w-3xl mx-auto w-full bg-[#FEE2E2] border border-[#E57373] text-[#991B1B] px-4 py-3 rounded-xl text-sm font-semibold">
          {validationHint}
        </div>
      )}

      {/* Kotak Aksi Bawah (Ukuran lebih kecil & selaras dengan kotak bawah ATP) */}
      <div className="max-w-3xl mx-auto w-full mt-1 bg-[#1E3A5F] border-2 border-[#88D4AB] rounded-xl py-3.5 px-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 text-white">
        <div className="flex items-center gap-3">
          <div className="text-[#88D4AB] shrink-0">
            <RocketLaunch size={24} weight="duotone" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#D8BD7B]">
              {quizState.submitted
                ? 'Asesmen Awal Selesai Diperiksa!'
                : 'Sudah Menjawab Seluruh Soal?'}
            </h4>
            <p className="text-xs sm:text-[13px] text-[#DCEAF5]/90 leading-snug">
              {quizState.submitted
                ? 'Kamu dapat melanjutkan pembelajaran ke tahap Pertanyaan Esensial.'
                : 'Periksa kembali jawabanmu sebelum menekan tombol Periksa Jawaban.'}
            </p>
          </div>
        </div>

        {!quizState.submitted ? (
          <button
            type="button"
            onClick={handleSubmitQuiz}
            className="group inline-flex items-center justify-center gap-1.5 bg-[#88D4AB] hover:bg-[#9be0bb] text-[#1E3A5F] px-4 py-2 rounded-lg font-[var(--font-nav)] font-extrabold text-xs sm:text-[13px] cursor-pointer shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_20px_rgba(136,212,171,0.45)] active:translate-y-0 active:scale-95 shrink-0 w-full sm:w-auto"
          >
            Periksa Jawaban
            <ArrowRight
              size={16}
              weight="bold"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        ) : (
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
                Lanjut ke Pertanyaan Esensial
              </>
            ) : (
              <>
                Selesai &amp; Lanjut
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
