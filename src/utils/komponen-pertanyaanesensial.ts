import { ParsedATPSections } from '../types/learning';
import { parseJsonTolerant } from './komponen-asesmenawal';

export interface RawPertanyaanEsensialItem {
  pertanyaan?: string;
  topik?: string;
  tujuan_pembelajaran?: string;
  pengantar_materi?: string;
}

export interface NormalizedPertanyaanEsensial {
  pertanyaan: string;
  topik: string;
  tujuanPembelajaran: string;
  pengantarMateri: string;
}

let cachedPertanyaanCatalog: Record<string, RawPertanyaanEsensialItem> | null =
  null;

function normalizeLookupKey(key: string): string {
  return key.trim().toLowerCase();
}

/**
 * Membangun teks pengantar pemantik otomatis apabila entri JSON baru
 * hanya mencantumkan properti "pertanyaan" tanpa "pengantar_materi".
 */
export function bangunPengantarOtomatis(
  topik: string,
  tujuanPembelajaran: string
): string {
  const cleanTopik = topik || 'materi pertemuan ini';
  const cleanTujuan = tujuanPembelajaran
    .replace(/^Murid mampu\s+/i, '')
    .replace(/^Peserta didik mampu\s+/i, '')
    .replace(/\.$/, '')
    .trim();

  if (cleanTujuan) {
    return `Pemikiran awal yang sangat menarik! Situasi sehari-hari yang baru saja kamu tanggapi berkaitan erat dengan pembahasan "${cleanTopik}". Pada tahap materi inti selanjutnya, kita akan mengupas konsep tersebut lebih dalam agar kamu mampu ${cleanTujuan}. Yuk, lanjutkan ke Eksplorasi Konsep untuk membuktikannya!`;
  }

  return `Pemikiran awal yang sangat menarik! Apa yang baru saja kamu renungkan menjadi pintu masuk utama untuk memahami "${cleanTopik}". Yuk, lanjutkan ke tahap Eksplorasi Konsep untuk mempelajari cara kerjanya secara mendalam!`;
}

/**
 * Memuat katalog Pertanyaan_Esensial.json secara mandiri dan memperbaiki
 * pencocokan kunci (case-insensitive serta alias bab Kelas 9 Semester 2).
 */
export async function muatKatalogPertanyaanEsensial(): Promise<
  Record<string, RawPertanyaanEsensialItem>
> {
  if (cachedPertanyaanCatalog) {
    return cachedPertanyaanCatalog;
  }

  const baseUrl = import.meta.env.BASE_URL;
  const response = await fetch(`${baseUrl}Pertanyaan_Esensial.json`);

  if (!response.ok) {
    throw new Error(
      `Gagal memuat Pertanyaan_Esensial.json (Status ${response.status})`
    );
  }

  const rawText = await response.text();
  const parsed =
    parseJsonTolerant<Record<string, RawPertanyaanEsensialItem>>(rawText);

  const normalizedMap: Record<string, RawPertanyaanEsensialItem> = {};

  Object.entries(parsed).forEach(([rawKey, val]) => {
    const lowerKey = normalizeLookupKey(rawKey);
    normalizedMap[lowerKey] = val;

    // Dukungan otomatis jika ada kunci lama Kelas9-sem2-bab1-* -> kelas9-sem2-bab3-*
    if (lowerKey.startsWith('kelas9-sem2-bab1-')) {
      const mappedKey = lowerKey.replace(
        'kelas9-sem2-bab1-',
        'kelas9-sem2-bab3-'
      );
      if (!normalizedMap[mappedKey]) {
        normalizedMap[mappedKey] = val;
      }
    }
  });

  cachedPertanyaanCatalog = normalizedMap;
  return normalizedMap;
}

/**
 * Mengambil data Pertanyaan Esensial dan penjelasan pengantar materi inti
 * untuk pertemuan tertentu.
 */
export async function ambilDataPertanyaanEsensial(
  meetingId: string,
  atpSections: ParsedATPSections,
  judulPertemuan: string
): Promise<NormalizedPertanyaanEsensial | null> {
  if (!meetingId) return null;
  const catalog = await muatKatalogPertanyaanEsensial();
  const item = catalog[normalizeLookupKey(meetingId)];

  if (!item || !item.pertanyaan) {
    return null;
  }

  const topik =
    item.topik?.trim() ||
    atpSections.topik ||
    judulPertemuan.replace(/^Pertemuan\s*\d+\s*:\s*/i, '');

  const tujuanPembelajaran =
    item.tujuan_pembelajaran?.trim() || atpSections.tujuanPembelajaran || '';

  const pengantarMateri =
    item.pengantar_materi?.trim() ||
    bangunPengantarOtomatis(topik, tujuanPembelajaran);

  return {
    pertanyaan: item.pertanyaan.trim(),
    topik,
    tujuanPembelajaran,
    pengantarMateri,
  };
}
