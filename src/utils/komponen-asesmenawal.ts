import { NormalizedQuestion } from '../types/learning';
import { normalizeAssessmentQuestions } from './normalizeAssessment';

let cachedAsesmenCatalog: Record<string, unknown> | null = null;

/**
 * Menormalkan ID pertemuan Asesmen Awal agar konsisten huruf kecil (lowercase)
 * serta memetakan alias lama Kelas9-sem2-bab1-* ke kunci resmi kelas9-sem2-bab3-*.
 */
export function normalisasiIdAsesmenAwal(rawId: string): string {
  if (!rawId) return '';
  const lower = String(rawId).trim().toLowerCase();
  if (lower.startsWith('kelas9-sem2-bab1-')) {
    return lower.replace('kelas9-sem2-bab1-', 'kelas9-sem2-bab3-');
  }
  return lower;
}

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
 * Memuat katalog Asesmen_Awal.json secara mandiri (seluruh 81 pertemuan Kelas VII, VIII, dan IX)
 * dengan normalisasi kunci pertemuan agar tidak pernah gagal baca akibat perbedaan kapitalisasi/alias.
 */
export async function muatKatalogAsesmenAwal(): Promise<
  Record<string, unknown>
> {
  if (cachedAsesmenCatalog) {
    return cachedAsesmenCatalog;
  }

  const baseUrl =
    (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL || '/';
  const response = await fetch(`${baseUrl}Asesmen_Awal.json`);

  if (!response.ok) {
    throw new Error(
      `Gagal memuat Asesmen_Awal.json (Status ${response.status})`
    );
  }

  const rawText = await response.text();
  const parsed = parseJsonTolerant<Record<string, unknown>>(rawText);

  const normalizedCatalog: Record<string, unknown> = {};
  Object.entries(parsed).forEach(([rawKey, val]) => {
    const canonicalKey = normalisasiIdAsesmenAwal(rawKey);
    normalizedCatalog[canonicalKey] = val;
  });

  cachedAsesmenCatalog = normalizedCatalog;
  return normalizedCatalog;
}

/**
 * Mengambil daftar butir soal Asesmen Awal yang sudah dinormalisasi berdasarkan ID pertemuan.
 */
export async function ambilSoalAsesmenAwal(
  meetingId: string
): Promise<NormalizedQuestion[]> {
  if (!meetingId) return [];
  const catalog = await muatKatalogAsesmenAwal();
  const canonicalKey = normalisasiIdAsesmenAwal(meetingId);
  return normalizeAssessmentQuestions(
    catalog[canonicalKey] ?? catalog[meetingId]
  );
}
