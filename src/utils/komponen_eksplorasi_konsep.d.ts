export type EksplorasiSlideKind = 'pembuka' | 'inti' | 'penutup';

export type EksplorasiVisualCategory =
  | 'data_tabel'
  | 'spreadsheet_formula'
  | 'mesin_pencari'
  | 'literasi_fakta'
  | 'dokumen_presentasi'
  | 'berpikir_komputasional'
  | 'algoritma_pseudocode'
  | 'scratch_visual'
  | 'perangkat_keras'
  | 'jaringan_internet'
  | 'keamanan_siber'
  | 'kewargaan_digital';

export type EksplorasiContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'code'; lines: string[] };

export interface NormalizedEksplorasiSlide {
  index: number;
  kind: EksplorasiSlideKind;
  judul: string;
  subjudul: string;
  isiMentahBersih: string;
  blocks: EksplorasiContentBlock[];
  visualKategori: EksplorasiVisualCategory;
  visualTagline: string;
}

export interface EksplorasiMeetingData {
  idPertemuanAsli: string;
  idPertemuanKanonik: string;
  totalMateri: number;
  slides: NormalizedEksplorasiSlide[];
}

export function normalisasiIdPertemuanEksplorasi(rawId: string): string;

export function bersihkanPenandaSlide(rawText: string): string;

export function muatKatalogEksplorasiKonsep(): Promise<
  Record<string, EksplorasiMeetingData>
>;

export function ambilMateriEksplorasiKonsep(
  meetingId: string
): Promise<EksplorasiMeetingData | null>;

export function muatPosisiEksplorasi(
  userKey: string,
  meetingId: string,
  maxIndex: number
): { currentIndex: number; visitedIndices: number[] };

export function simpanPosisiEksplorasi(
  userKey: string,
  meetingId: string,
  currentIndex: number,
  visitedIndices: number[]
): void;

export function unduhSlideEksplorasiPdf(params: {
  slide: NormalizedEksplorasiSlide;
  posisiSekarang: number;
  totalMateri: number;
  judulBab: string;
  judulPertemuan: string;
  meetingId: string;
}): Promise<void>;
