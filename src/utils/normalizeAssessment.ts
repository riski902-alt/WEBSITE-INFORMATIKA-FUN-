import { NormalizedQuestion, ParsedATPSections } from '../types/learning';

interface LegacyArrayQuestion {
  id_soal?: string;
  tipe: 'pg' | 'pg_kompleks' | 'menjodohkan' | 'isian';
  pertanyaan: string;
  pilihan?: string[];
  jawaban?: string | string[];
  pasangan?: Array<{ kiri: string; kanan: string }>;
  poin?: number;
}

interface NestedSoalGroup {
  pilihan_ganda?: Array<{
    id: string;
    pertanyaan: string;
    opsi: Record<string, string>;
    jawaban_benar: string;
  }>;
  pilihan_ganda_kompleks?: Array<{
    id: string;
    petunjuk?: string;
    pertanyaan: string;
    opsi: Record<string, string>;
    jawaban_benar: string[];
  }>;
  menjodohkan?: Array<{
    id: string;
    instruksi: string;
    pasangan: Array<{ pernyataan: string; jawaban: string }>;
  }>;
  isian?: Array<{
    id: string;
    pertanyaan: string;
    jawaban_benar: string[] | string;
  }>;
}

interface NestedAssessmentEntry {
  topik?: string;
  tujuan_pembelajaran?: string;
  soal?: NestedSoalGroup;
}

export function normalizeAssessmentQuestions(
  rawEntry: unknown
): NormalizedQuestion[] {
  if (!rawEntry) return [];

  // Format 1: Array langsung (Kelas 7 & Kelas 8 Bab 1)
  if (Array.isArray(rawEntry)) {
    return (rawEntry as LegacyArrayQuestion[]).map((q, index) => {
      const id = q.id_soal || `q${index + 1}`;
      if (q.tipe === 'pg') {
        const pilihan = q.pilihan || [];
        return {
          type: 'pg',
          id,
          prompt: q.pertanyaan,
          options: pilihan.map((label, idx) => ({
            key: String.fromCharCode(65 + idx),
            label,
          })),
          correctKey:
            String.fromCharCode(
              65 + Math.max(0, pilihan.findIndex((p) => p === q.jawaban))
            ) || 'A',
          points: q.poin ?? 10,
        };
      }

      if (q.tipe === 'pg_kompleks') {
        const pilihan = q.pilihan || [];
        const jawabanArr = Array.isArray(q.jawaban)
          ? q.jawaban
          : q.jawaban
          ? [q.jawaban]
          : [];
        const options = pilihan.map((label, idx) => ({
          key: String.fromCharCode(65 + idx),
          label,
        }));
        const correctKeys = options
          .filter((opt) => jawabanArr.includes(opt.label))
          .map((opt) => opt.key);

        return {
          type: 'pg_kompleks',
          id,
          prompt: q.pertanyaan,
          options,
          correctKeys,
          points: q.poin ?? 15,
        };
      }

      if (q.tipe === 'menjodohkan') {
        return {
          type: 'menjodohkan',
          id,
          prompt: q.pertanyaan,
          pairs: (q.pasangan || []).map((p) => ({
            left: p.kiri,
            right: p.kanan,
          })),
          points: q.poin ?? 10,
        };
      }

      const accepted = Array.isArray(q.jawaban)
        ? q.jawaban
        : q.jawaban
        ? [String(q.jawaban)]
        : [];

      return {
        type: 'isian',
        id,
        prompt: q.pertanyaan,
        acceptedAnswers: accepted,
        points: q.poin ?? 15,
      };
    });
  }

  // Format 2: Objek bertingkat dengan properti .soal (Kelas 8 Bab 2-4 & Kelas 9)
  const nested = rawEntry as NestedAssessmentEntry;
  if (nested && typeof nested === 'object' && nested.soal) {
    const questions: NormalizedQuestion[] = [];
    const soal = nested.soal;

    (soal.pilihan_ganda || []).forEach((item) => {
      const options = Object.entries(item.opsi || {}).map(([key, label]) => ({
        key,
        label,
      }));
      questions.push({
        type: 'pg',
        id: item.id,
        prompt: item.pertanyaan,
        options,
        correctKey: item.jawaban_benar,
        points: 10,
      });
    });

    (soal.pilihan_ganda_kompleks || []).forEach((item) => {
      const options = Object.entries(item.opsi || {}).map(([key, label]) => ({
        key,
        label,
      }));
      questions.push({
        type: 'pg_kompleks',
        id: item.id,
        prompt: item.pertanyaan,
        hint: item.petunjuk,
        options,
        correctKeys: item.jawaban_benar || [],
        points: 15,
      });
    });

    (soal.menjodohkan || []).forEach((item) => {
      questions.push({
        type: 'menjodohkan',
        id: item.id,
        prompt: item.instruksi,
        pairs: (item.pasangan || []).map((p) => ({
          left: p.pernyataan,
          right: p.jawaban,
        })),
        points: 10,
      });
    });

    (soal.isian || []).forEach((item) => {
      const accepted = Array.isArray(item.jawaban_benar)
        ? item.jawaban_benar
        : item.jawaban_benar
        ? [item.jawaban_benar]
        : [];
      questions.push({
        type: 'isian',
        id: item.id,
        prompt: item.pertanyaan,
        acceptedAnswers: accepted,
        points: 15,
      });
    });

    return questions;
  }

  return [];
}

export function sanitizeATPHtml(rawHtml: string): string {
  // Perbaiki tag penutup ganda seperti </p></h3> pada beberapa entri materi.json
  return rawHtml.replace(/<\/p>\s*<\/h3>/gi, '</p>');
}

export function parseATPSections(rawHtml: string): ParsedATPSections {
  const cleaned = sanitizeATPHtml(rawHtml);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, 'text/html');

  const result: ParsedATPSections = {
    elemen: [],
    capaianPembelajaran: '',
    tujuanPembelajaran: '',
    topik: '',
  };

  let currentHeading = '';
  Array.from(doc.body.children).forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || '').trim();
    if (!text) return;

    if (tag === 'h3' || tag === 'h4') {
      currentHeading = text.toLowerCase();
    } else if (tag === 'p') {
      if (currentHeading.includes('elemen')) {
        result.elemen.push(text);
      } else if (currentHeading.includes('capaian')) {
        result.capaianPembelajaran = result.capaianPembelajaran
          ? `${result.capaianPembelajaran} ${text}`
          : text;
      } else if (currentHeading.includes('tujuan')) {
        result.tujuanPembelajaran = result.tujuanPembelajaran
          ? `${result.tujuanPembelajaran} ${text}`
          : text;
      } else if (currentHeading.includes('topik')) {
        result.topik = result.topik ? `${result.topik} ${text}` : text;
      }
    }
  });

  return result;
}

export function formatMeetingGroupLabel(meetingId: string): {
  kelasLabel: string;
  semesterLabel: string;
  babNumber: string;
  pertemuanNumber: string;
} {
  // Format contoh: kelas7-sem1-bab1-pertemuan1
  const match = meetingId.match(
    /^kelas(\d+)-sem(\d+)-bab(\d+)-pertemuan(\d+)$/i
  );
  if (!match) {
    return {
      kelasLabel: 'Kelas VII',
      semesterLabel: 'Semester 1',
      babNumber: '1',
      pertemuanNumber: '1',
    };
  }
  const romanMap: Record<string, string> = {
    '7': 'VII',
    '8': 'VIII',
    '9': 'IX',
  };
  return {
    kelasLabel: `Kelas ${romanMap[match[1]] || match[1]}`,
    semesterLabel: `Semester ${match[2]}`,
    babNumber: match[3],
    pertemuanNumber: match[4],
  };
}
