import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardText,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  ArrowRight,
  Trophy,
  CheckSquareOffset,
} from '@phosphor-icons/react';
import { NormalizedQuestion } from '../types/learning';

interface AsesmenAwalViewProps {
  meetingId: string;
  userKey: string;
  judulPertemuan: string;
  questions: NormalizedQuestion[];
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

export const AsesmenAwalView: React.FC<AsesmenAwalViewProps> = ({
  meetingId,
  userKey,
  judulPertemuan,
  questions,
  isCompleted,
  onCompleteAndContinue,
}) => {
  const storageKey = `infoFun_Asesmen_${userKey}_${meetingId}`;

  const [quizState, setQuizState] = useState<SavedQuizState>({
    pgAnswers: {},
    pgKompleksAnswers: {},
    matchingAnswers: {},
    isianAnswers: {},
    submitted: false,
  });

  const [validationHint, setValidationHint] = useState<string | null>(null);

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
    // Cek apakah semua soal sudah dijawab
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

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-[#243447] shadow-sm">
        <h3 className="text-lg font-bold text-[#243B53] mb-2">Asesmen Awal</h3>
        <p className="text-sm text-[#607286] mb-4">
          Belum ada butir soal asesmen awal untuk pertemuan ini.
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
      {/* Header Asesmen Awal */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DCEAF5] text-[#1E3A5F] flex items-center justify-center shrink-0">
            <ClipboardText size={28} weight="duotone" />
          </div>
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#527DA8] mb-0.5 font-[var(--font-nav)]">
              Tahap 2 • Asesmen Awal Diagnostik
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#243B53]">
              {judulPertemuan}
            </h2>
            <p className="text-xs sm:text-sm text-[#607286] mt-0.5">
              Jawab {questions.length} pertanyaan berikut (Pilihan Ganda, Pilihan Ganda Kompleks, Menjodohkan, dan Isian Singkat) untuk memetakan pemahaman awalmu.
            </p>
          </div>
        </div>

        <div className="bg-[#F4F8FA] border border-[#DCEAF5] px-4 py-2.5 rounded-xl text-right font-[var(--font-nav)]">
          <span className="block text-[11px] font-bold text-[#607286] uppercase">
            Jumlah Soal
          </span>
          <span className="text-base font-extrabold text-[#1E3A5F]">
            {questions.length} Soal ({scoreSummary.maxPoints} Poin)
          </span>
        </div>
      </div>

      {/* Ringkasan Skor setelah Submit */}
      {quizState.submitted && (
        <div className="bg-[#1E3A5F] border-2 border-[#88D4AB] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#88D4AB]/20 border border-[#88D4AB] flex items-center justify-center text-[#88D4AB] shrink-0">
              <Trophy size={32} weight="duotone" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D8BD7B] font-[var(--font-nav)]">
                Hasil Asesmen Awal
              </span>
              <h3 className="text-2xl font-bold text-white">
                Nilai: {scoreSummary.normalizedScore} / 100
              </h3>
              <p className="text-sm text-[#DCEAF5]">
                Menjawab benar {scoreSummary.correctCount} dari {questions.length} soal ({scoreSummary.earned} dari {scoreSummary.maxPoints} poin).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetQuiz}
              className="inline-flex items-center justify-center gap-1.5 bg-[#152C5B] hover:bg-[#23436b] text-white border border-white/25 px-4 py-2.5 rounded-xl font-[var(--font-nav)] font-bold text-xs sm:text-sm cursor-pointer transition"
            >
              <ArrowsClockwise size={17} weight="bold" />
              Ulangi Kuis
            </button>
            <button
              type="button"
              onClick={onCompleteAndContinue}
              className="inline-flex items-center justify-center gap-2 bg-[#88D4AB] hover:opacity-95 text-[#1E3A5F] px-5 py-2.5 rounded-xl font-[var(--font-nav)] font-extrabold text-xs sm:text-sm cursor-pointer shadow transition"
            >
              Selesai &amp; Lanjut
              <ArrowRight size={17} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Daftar Soal */}
      <div className="flex flex-col gap-4">
        {questions.map((q, index) => {
          const evalResult = quizState.submitted
            ? evaluateQuestion(q, quizState)
            : null;

          const typeBadgeLabel =
            q.type === 'pg'
              ? 'Pilihan Ganda'
              : q.type === 'pg_kompleks'
              ? 'Pilihan Ganda Kompleks'
              : q.type === 'menjodohkan'
              ? 'Menjodohkan'
              : 'Isian Singkat';

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl p-5 sm:p-6 shadow-sm border transition ${
                evalResult
                  ? evalResult.isCorrect
                    ? 'border-[#10B981]'
                    : 'border-[#E57373]'
                  : 'border-black/5'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#1E3A5F] text-white font-bold text-xs font-[var(--font-nav)]">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold bg-[#F4F8FA] text-[#527DA8] border border-[#DCEAF5] px-2.5 py-1 rounded-md font-[var(--font-nav)]">
                    {typeBadgeLabel}
                  </span>
                  <span className="text-xs text-[#607286] font-semibold font-[var(--font-nav)]">
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

              <p className="text-[0.98rem] font-semibold text-[#243447] mb-3.5 leading-relaxed">
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
                      quizState.submitted && selected && opt.key !== q.correctKey;

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
                            ? 'bg-[#D1FAE5]/70 border-[#10B981] text-[#065F46] font-semibold'
                            : isWrongSelected
                            ? 'bg-[#FEE2E2]/70 border-[#E57373] text-[#991B1B]'
                            : selected
                            ? 'bg-[#DCEAF5] border-[#527DA8] text-[#1E3A5F] font-semibold'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#527DA8] text-[#243447]'
                        } ${quizState.submitted ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            selected
                              ? 'bg-[#1E3A5F] text-white'
                              : 'bg-white border border-[#CBD5E1] text-[#243B53]'
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
                  <p className="text-xs text-[#527DA8] font-semibold mb-2.5 flex items-center gap-1.5">
                    <CheckSquareOffset size={16} weight="bold" />
                    {q.hint || 'Pilih lebih dari satu jawaban yang benar.'}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {q.options.map((opt) => {
                      const selectedList =
                        quizState.pgKompleksAnswers[q.id] || [];
                      const checked = selectedList.includes(opt.key);
                      const isRightOption =
                        quizState.submitted && q.correctKeys.includes(opt.key);
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
                              ? 'bg-[#D1FAE5]/70 border-[#10B981] text-[#065F46] font-semibold'
                              : isWrongSelected
                              ? 'bg-[#FEE2E2]/70 border-[#E57373] text-[#991B1B]'
                              : checked
                              ? 'bg-[#DCEAF5] border-[#527DA8] text-[#1E3A5F] font-semibold'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#527DA8] text-[#243447]'
                          } ${quizState.submitted ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 border ${
                              checked
                                ? 'bg-[#1E3A5F] border-[#1E3A5F] text-white'
                                : 'bg-white border-[#CBD5E1] text-transparent'
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
                <div className="space-y-3">
                  {q.pairs.map((pair, pairIdx) => {
                    const currentMap = quizState.matchingAnswers[q.id] || {};
                    const selectedVal = currentMap[pairIdx] || '';
                    const rightChoices = shuffledMatchingOptions[q.id] || [];

                    return (
                      <div
                        key={pairIdx}
                        className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
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
                            className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#243B53] outline-none focus:border-[#527DA8]"
                          >
                            <option value="">-- Pilih Pasangan Jawaban --</option>
                            {rightChoices.map((choice, cIdx) => (
                              <option key={cIdx} value={choice}>
                                {choice}
                              </option>
                            ))}
                          </select>
                          {quizState.submitted && selectedVal !== pair.right && (
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
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-sm text-[#243B53] outline-none focus:border-[#527DA8] focus:bg-white"
                  />
                  {quizState.submitted && evalResult && !evalResult.isCorrect && (
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

      {/* Pesan Validasi & Tombol Kumpulkan */}
      {validationHint && (
        <div className="bg-[#FEE2E2] border border-[#E57373] text-[#991B1B] px-4 py-3 rounded-xl text-sm font-semibold">
          {validationHint}
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-[#607286]">
          {quizState.submitted
            ? 'Asesmen awal telah diperiksa. Kamu dapat mengulangi kuis atau lanjut ke Pertanyaan Esensial.'
            : 'Periksa kembali jawabanmu sebelum menekan tombol Periksa Jawaban.'}
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          {!quizState.submitted ? (
            <button
              type="button"
              onClick={handleSubmitQuiz}
              className="inline-flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152C5B] text-white px-6 py-3 rounded-xl font-[var(--font-nav)] font-bold text-sm cursor-pointer shadow-md transition"
            >
              Periksa Jawaban Asesmen Awal
            </button>
          ) : (
            <button
              type="button"
              onClick={onCompleteAndContinue}
              className="inline-flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152C5B] text-white px-6 py-3 rounded-xl font-[var(--font-nav)] font-bold text-sm cursor-pointer shadow-md transition"
            >
              {isCompleted ? 'Lanjut ke Pertanyaan Esensial' : 'Tandai Selesai & Lanjut'}
              <ArrowRight size={18} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
