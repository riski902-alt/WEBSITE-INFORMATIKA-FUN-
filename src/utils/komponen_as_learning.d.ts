import { UserSession } from '../types/learning';

export interface ButirPertanyaanAsLearning {
  id: string;
  nomor: number;
  kunciField: string;
  teks: string;
}

export interface DataPertemuanAsLearning {
  urutan: number;
  idPertemuan: string;
  idSumberAsli: string;
  pertanyaan: ButirPertanyaanAsLearning[];
}

export type PetaJawabanAsLearning = Record<string, string>;

export interface PaketApresiasiKontekstual {
  idPertemuan: string;
  topikSingkat: string;
  kalimatMotivasi: string;
  pantun: string[];
  pesanPenerapan: string;
}

export interface InfoKelasSemesterAsLearning {
  kelas: string;
  semester: string;
  nomorPertemuan: number;
}

export interface StatistikTeksRefleksi {
  jumlahKata: number;
  jumlahKarakter: number;
}

export interface HasilValidasiAsLearning {
  lengkap: boolean;
  pesan: string;
  nomorBelumLengkap: number[];
}

export interface RekamanTersimpanAsLearning {
  jawaban: PetaJawabanAsLearning;
  submitted: boolean;
  savedAtIso: string;
  syncedFromCloud?: boolean;
}

export interface HasilSimpanAsLearning {
  ok: boolean;
  syncedToCloud: boolean;
  savedAtIso: string;
  jawabanTersimpan: PetaJawabanAsLearning;
  warningMessage?: string;
}

export function normalisasiIdPertemuanAsLearning(rawId: string): string;

export function ekstrakInfoKelasSemester(
  meetingId: string
): InfoKelasSemesterAsLearning;

export function formatSapaanPenggunaAsLearning(
  session: UserSession | null | undefined
): string;

export function ambilApresiasiKontekstualAsLearning(
  meetingId: string,
  judulBab?: string,
  judulPertemuan?: string
): PaketApresiasiKontekstual;

export function muatKatalogAsLearning(): Promise<
  Record<string, DataPertemuanAsLearning>
>;

export function ambilPertanyaanAsLearning(
  meetingId: string
): Promise<DataPertemuanAsLearning | null>;

export function buatJawabanAwalAsLearning(
  dataPertemuan: DataPertemuanAsLearning | null
): PetaJawabanAsLearning;

export function gabungkanJawabanAsLearning(
  dataPertemuan: DataPertemuanAsLearning | null,
  sumberJawaban: Record<string, unknown> | null | undefined
): PetaJawabanAsLearning;

export function hitungStatistikTeksRefleksi(
  teks: string
): StatistikTeksRefleksi;

export function periksaKelengkapanAsLearning(
  dataPertemuan: DataPertemuanAsLearning | null,
  jawabanMap: PetaJawabanAsLearning
): HasilValidasiAsLearning;

export function simpanDrafLokalAsLearning(
  userKey: string,
  meetingId: string,
  jawabanMap: PetaJawabanAsLearning
): void;

export function muatDrafLokalAsLearning(
  userKey: string,
  meetingId: string
): PetaJawabanAsLearning | null;

export function hapusDrafLokalAsLearning(
  userKey: string,
  meetingId: string
): void;

export function simpanRefleksiAsLearningKeDatabase(params: {
  session: UserSession;
  userKey: string;
  meetingId: string;
  judulBab: string;
  judulPertemuan: string;
  dataPertemuan: DataPertemuanAsLearning;
  jawabanMap: PetaJawabanAsLearning;
}): Promise<HasilSimpanAsLearning>;

export function langgananRefleksiAsLearning(
  userKey: string,
  meetingId: string,
  dataPertemuan: DataPertemuanAsLearning,
  onData: (record: RekamanTersimpanAsLearning | null) => void
): () => void;
