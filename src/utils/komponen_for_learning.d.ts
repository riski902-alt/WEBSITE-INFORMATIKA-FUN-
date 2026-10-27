import { UserSession } from '../types/learning';

export type ForLearningQuestionType =
  | 'pg'
  | 'pg_kompleks'
  | 'menjodohkan'
  | 'isian';

export interface ForLearningOption {
  key: string;
  label: string;
}

export interface NormalizedForLearningQuestion {
  id: string;
  nomorUrut: number;
  nomorBagian: number;
  type: ForLearningQuestionType;
  pertanyaan: string;
  pilihan?: ForLearningOption[];
  kunciJawaban?: string;
  kunciJawabanList?: string[];
  jawabanBenarTeks: string;
  opsiMenjodohkan?: string[];
  bobot: number;
  pembahasanSumber?: string;
}

export type ForLearningAnswersMap = Record<string, string | string[]>;

export interface ForLearningItemEvaluation {
  idSoal: string;
  benar: boolean;
  poinDiperoleh: number;
  bobotMaksimal: number;
  jawabanSiswaTeks: string;
  kunciTeks: string;
  penjelasanInti: string;
}

export interface ForLearningEvaluationSummary {
  hasilPerSoal: Record<string, ForLearningItemEvaluation>;
  jumlahBenar: number;
  totalSoal: number;
  poinDiperoleh: number;
  skorMaksimal: number;
}

export interface SavedForLearningRecord {
  jawaban: ForLearningAnswersMap;
  poinDiperoleh: number;
  skorMaksimal: number;
  jumlahBenar: number;
  totalSoal: number;
  submitted: boolean;
  savedAtIso: string;
}

export function normalisasiIdPertemuanForLearning(rawId: string): string;

export function muatKatalogForLearning(): Promise<
  Record<string, NormalizedForLearningQuestion[]>
>;

export function ambilSoalForLearning(
  meetingId: string
): Promise<NormalizedForLearningQuestion[]>;

export function periksaJawabanIsian(
  jawabanSiswa: string,
  kunciSumber: string
): boolean;

export function evaluasiJawabanForLearning(
  daftarSoal: NormalizedForLearningQuestion[],
  jawabanMap: ForLearningAnswersMap
): ForLearningEvaluationSummary;

export function formatAngkaPoin(nilai: number): string;

export function simpanJawabanForLearningKeDatabase(params: {
  session: UserSession;
  userKey: string;
  meetingId: string;
  judulBab: string;
  judulPertemuan: string;
  daftarSoal: NormalizedForLearningQuestion[];
  jawabanMap: ForLearningAnswersMap;
}): Promise<{
  ok: boolean;
  evaluasi: ForLearningEvaluationSummary;
  savedAtIso: string;
  errorMessage?: string;
}>;

export function langgananJawabanForLearning(
  userKey: string,
  meetingId: string,
  onData: (record: SavedForLearningRecord | null) => void
): () => void;
