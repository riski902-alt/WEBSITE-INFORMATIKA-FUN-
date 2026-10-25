export type MenuId =
  | 'atp'
  | 'asesmen-awal'
  | 'pertanyaan-esensial'
  | 'eksplorasi-konsep'
  | 'for-learning'
  | 'penerapan-konsep'
  | 'as-learning';

export const MENU_ORDER: MenuId[] = [
  'atp',
  'asesmen-awal',
  'pertanyaan-esensial',
  'eksplorasi-konsep',
  'for-learning',
  'penerapan-konsep',
  'as-learning',
];

export interface MenuDefinition {
  id: MenuId;
  label: string;
  subtitle: string;
}

export const MENU_DEFINITIONS: MenuDefinition[] = [
  {
    id: 'atp',
    label: 'ATP',
    subtitle: 'Alur Tujuan Pembelajaran',
  },
  {
    id: 'asesmen-awal',
    label: 'Asesmen Awal',
    subtitle: 'Kuis Diagnostik Kesiapan Belajar',
  },
  {
    id: 'pertanyaan-esensial',
    label: 'Pertanyaan Esensial',
    subtitle: 'Pemantik Rasa Ingin Tahu & Diskusi Awal',
  },
  {
    id: 'eksplorasi-konsep',
    label: 'Eksplorasi Konsep',
    subtitle: 'Pendalaman Materi & Konsep Inti',
  },
  {
    id: 'for-learning',
    label: 'For Learning',
    subtitle: 'Latihan Terbimbing & Umpan Balik Formatif',
  },
  {
    id: 'penerapan-konsep',
    label: 'Penerapan Konsep',
    subtitle: 'Praktik Mandiri & Studi Kasus Nyata',
  },
  {
    id: 'as-learning',
    label: 'As Learning',
    subtitle: 'Refleksi Mandiri & Evaluasi Pemahaman',
  },
];

export type MenuStatus = 'locked' | 'available' | 'completed';

export type StudentProgress = Record<MenuId, MenuStatus>;

export type UserRole = 'siswa' | 'guru';

export interface UserSession {
  nama: string;
  nisn: string;
  email: string;
  role: UserRole;
}

export interface MateriItem {
  judul_bab: string;
  judul_pertemuan: string;
  konten: Record<MenuId, string>;
}

export type MateriCatalog = Record<string, MateriItem>;

export interface ATPItem {
  konten: string;
}

export type ATPCatalog = Record<string, ATPItem>;

export interface ParsedATPSections {
  elemen: string[];
  capaianPembelajaran: string;
  tujuanPembelajaran: string;
  topik: string;
}

export interface QuestionOption {
  key: string;
  label: string;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export type NormalizedQuestion =
  | {
      type: 'pg';
      id: string;
      prompt: string;
      options: QuestionOption[];
      correctKey: string;
      points: number;
    }
  | {
      type: 'pg_kompleks';
      id: string;
      prompt: string;
      hint?: string;
      options: QuestionOption[];
      correctKeys: string[];
      points: number;
    }
  | {
      type: 'menjodohkan';
      id: string;
      prompt: string;
      pairs: MatchingPair[];
      points: number;
    }
  | {
      type: 'isian';
      id: string;
      prompt: string;
      acceptedAnswers: string[];
      points: number;
    };
