import { NormalizedQuestion } from '../types/learning';
import { normalizeAssessmentQuestions } from './normalizeAssessment';

let cachedAsesmenCatalog: Record<string, unknown> | null = null;

/**
 * Mem-parse teks JSON secara aman dan toleran apabila terdapat koma berlebih
 * di akhir baris atau kurung kurawal penutup akhir yang terlewat saat pengeditan manual.
 */
export function parseJsonTolerant<T>(rawText: string): T {
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    let repaired = trimmed.replace(/,\s*([}\]])/g, '$1');
    if (repaired.endsWith(',')) {
      repaired = `${repaired.slice(0, -1)}\n}`;
    }
    return JSON.parse(repaired) as T;
  }
}

/**
 * Memuat katalog Asesmen_Awal.json secara mandiri (terpisah dari materi.json & atp.json)
 * agar modul Asesmen Awal bekerja independen seperti perangkat modul ATP.
 */
export async function muatKatalogAsesmenAwal(): Promise<
  Record<string, unknown>
> {
  if (cachedAsesmenCatalog) {
    return cachedAsesmenCatalog;
  }

  const baseUrl = import.meta.env.BASE_URL;
  const response = await fetch(`${baseUrl}Asesmen_Awal.json`);

  if (!response.ok) {
    throw new Error(
      `Gagal memuat Asesmen_Awal.json (Status ${response.status})`
    );
  }

  const rawText = await response.text();
  const parsed = parseJsonTolerant<Record<string, unknown>>(rawText);
  cachedAsesmenCatalog = parsed;
  return parsed;
}

/**
 * Mengambil daftar butir soal Asesmen Awal yang sudah dinormalisasi berdasarkan ID pertemuan.
 */
export async function ambilSoalAsesmenAwal(
  meetingId: string
): Promise<NormalizedQuestion[]> {
  if (!meetingId) return [];
  const catalog = await muatKatalogAsesmenAwal();
  return normalizeAssessmentQuestions(catalog[meetingId]);
}
