import { UserSession } from '../types/learning';

export type ModeInteraksiPenerapan =
  | 'tabel_statis'
  | 'tabel_dinamis'
  | 'tabel_ceklis'
  | 'form_evaluasi'
  | 'pengelompokan'
  | 'editor_kode'
  | 'ceklis_praktik'
  | 'unggah_atau_teks'
  | 'teks_dan_unggah'
  | 'unggah_berkas'
  | 'editor_teks';

export interface KomponenJawabanSumber {
  tipe: string;
  kolom?: string[];
  baris?: string[];
  kolom_isian?: string[];
  kategori?: string[];
  instruksi_antarmuka?: string;
  aksi?: string;
  format_diterima?: string[];
  label?: string;
}

export interface AktivitasPenerapanItem {
  idKanonik: string;
  idSumberAsli: string;
  petunjuk: string;
  komponenJawaban: KomponenJawabanSumber;
  tipe: string;
  labelJenisAktivitas: string;
  modeInteraksi: ModeInteraksiPenerapan;
  formatDiterima: string[];
  langkahPengerjaan: string[];
  butirPraktik: string[];
}

export interface BarisTabelPenerapan {
  sel: string[];
}

export interface BarisCeklisPenerapan {
  indikator: string;
  opsi1: boolean;
  opsi2: boolean;
  alasan: string;
}

export interface ItemPengelompokanPenerapan {
  id: string;
  teks: string;
  kategori: string;
}

export interface InfoBerkasPenerapan {
  namaFile: string;
  ukuranBytes: number;
  tipeMime: string;
  ekstensi: string;
  pratinjauDataUrl: string;
  diunggahPada: string;
}

export interface JawabanPenerapanSiswa {
  kolomDinamis: string[];
  barisTabel: BarisTabelPenerapan[];
  barisCeklis: BarisCeklisPenerapan[];
  pilihanKesimpulan: string;
  isianEvaluasi: Record<string, string>;
  itemPengelompokan: ItemPengelompokanPenerapan[];
  teksJawaban: string;
  ceklisUtama: boolean;
  langkahTercentang: number[];
  catatanPendukung: string;
  berkas: InfoBerkasPenerapan | null;
}

export interface HasilValidasiPenerapan {
  valid: boolean;
  pesan: string;
  rincian: string[];
}

export interface RekamanTersimpanPenerapan {
  jawaban: JawabanPenerapanSiswa;
  submitted: boolean;
  savedAtIso: string;
}

export function normalisasiIdPertemuanPenerapan(rawId: string): string;
export function buatJawabanAwalPenerapan(
  aktivitasItem: AktivitasPenerapanItem
): JawabanPenerapanSiswa;
export function gabungkanJawabanPenerapan(
  aktivitasItem: AktivitasPenerapanItem,
  tersimpan: Partial<JawabanPenerapanSiswa> | null | undefined
): JawabanPenerapanSiswa;
export function muatKatalogPenerapanKonsep(): Promise<
  Record<string, AktivitasPenerapanItem>
>;
export function ambilAktivitasPenerapanKonsep(
  meetingId: string
): Promise<AktivitasPenerapanItem | null>;
export function periksaKelengkapanPenerapan(
  aktivitas: AktivitasPenerapanItem,
  jawaban: JawabanPenerapanSiswa
): HasilValidasiPenerapan;
export function prosesBerkasPenerapan(
  file: File,
  formatDiterima: string[]
): Promise<InfoBerkasPenerapan>;
export function formatUkuranBerkas(bytes: number): string;
export function simpanDrafLokalPenerapan(
  userKey: string,
  meetingId: string,
  jawaban: JawabanPenerapanSiswa
): void;
export function muatDrafLokalPenerapan(
  userKey: string,
  meetingId: string
): JawabanPenerapanSiswa | null;
export function simpanJawabanPenerapanKeDatabase(params: {
  session: UserSession;
  userKey: string;
  meetingId: string;
  judulBab: string;
  judulPertemuan: string;
  aktivitas: AktivitasPenerapanItem;
  jawaban: JawabanPenerapanSiswa;
}): Promise<{
  ok: boolean;
  syncedToCloud: boolean;
  savedAtIso: string;
  warningMessage?: string;
}>;
export function langgananJawabanPenerapan(
  userKey: string,
  meetingId: string,
  aktivitas: AktivitasPenerapanItem | null,
  onData: (record: RekamanTersimpanPenerapan | null) => void
): () => void;
