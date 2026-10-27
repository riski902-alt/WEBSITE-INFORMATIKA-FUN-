import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowsLeftRight,
  CheckCircle,
  CheckSquare,
  Code,
  FileArrowUp,
  FileText,
  FloppyDisk,
  FolderOpen,
  ImageSquare,
  ListChecks,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  SpinnerGap,
  Square,
  Table,
  Trash,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react';
import { ParsedATPSections, UserSession } from '../types/learning';
import {
  AktivitasPenerapanItem,
  HasilValidasiPenerapan,
  JawabanPenerapanSiswa,
  ambilAktivitasPenerapanKonsep,
  buatJawabanAwalPenerapan,
  formatUkuranBerkas,
  gabungkanJawabanPenerapan,
  langgananJawabanPenerapan,
  muatDrafLokalPenerapan,
  periksaKelengkapanPenerapan,
  prosesBerkasPenerapan,
  simpanDrafLokalPenerapan,
  simpanJawabanPenerapanKeDatabase,
} from '../utils/komponen_penerapan_konsep.js';

interface PenerapanKonsepViewProps {
  session: UserSession;
  userKey: string;
  meetingId: string;
  judulBab: string;
  judulPertemuan: string;
  atpSections: ParsedATPSections;
  isCompleted: boolean;
  onMarkCompleted: () => void;
  onContinueNext: () => void;
}

const PSEUDOCODE_SNIPPETS: Array<{ label: string; snippet: string }> = [
  { label: 'ALGORITMA', snippet: 'ALGORITMA Nama_Program\n' },
  { label: 'DEKLARASI', snippet: 'DEKLARASI\n  variabel : INTEGER\n' },
  { label: 'DESKRIPSI', snippet: 'DESKRIPSI\n  ' },
  { label: 'INPUT / READ', snippet: 'READ ' },
  { label: 'IF-THEN-ELSE', snippet: 'IF (kondisi) THEN\n  \nELSE\n  \nEND IF\n' },
  { label: 'FOR LOOP', snippet: 'FOR i <- 1 TO 5 DO\n  \nEND FOR\n' },
  { label: 'WHILE LOOP', snippet: 'WHILE (kondisi) DO\n  \nEND WHILE\n' },
  { label: 'PRINT / OUTPUT', snippet: 'PRINT ' },
];

export const PenerapanKonsepView: React.FC<PenerapanKonsepViewProps> = ({
  session,
  userKey,
  meetingId,
  judulBab,
  judulPertemuan,
  atpSections,
  isCompleted,
  onMarkCompleted,
  onContinueNext,
}) => {
  const [aktivitas, setAktivitas] = useState<AktivitasPenerapanItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [jawaban, setJawaban] = useState<JawabanPenerapanSiswa | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedAtText, setSavedAtText] = useState<string>('');

  const [checkResult, setCheckResult] = useState<HasilValidasiPenerapan | null>(
    null
  );
  const [statusBanner, setStatusBanner] = useState<{
    tone: 'idle' | 'info' | 'success' | 'error';
    message: string;
  }>({ tone: 'idle', message: '' });

  // Input lokal untuk papan pengelompokan (Fakta / Opini)
  const [newGroupText, setNewGroupText] = useState<string>('');
  const [newGroupCat, setNewGroupCat] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hydratedMeetingRef = useRef<string>('');

  // 1. Muat definisi aktivitas sesuai meetingId
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setCheckResult(null);
    setStatusBanner({ tone: 'idle', message: '' });
    setNewGroupText('');
    hydratedMeetingRef.current = '';

    ambilAktivitasPenerapanKonsep(meetingId)
      .then((item) => {
        if (cancelled) return;
        if (!item) {
          setLoadError(
            `Konten Penerapan Konsep untuk pertemuan "${meetingId}" tidak ditemukan.`
          );
          setAktivitas(null);
          setJawaban(null);
          setIsLoading(false);
          return;
        }

        setAktivitas(item);
        const kategoriAwal = item.komponenJawaban.kategori?.[0] || 'Fakta';
        setNewGroupCat(kategoriAwal);

        // Muat draf lokal bila ada sebelum data tersimpan masuk
        const draf = muatDrafLokalPenerapan(userKey, meetingId);
        const awal = draf
          ? gabungkanJawabanPenerapan(item, draf)
          : buatJawabanAwalPenerapan(item);

        setJawaban(awal);
        setIsSubmitted(false);
        setIsEditing(false);
        setSavedAtText('');
        hydratedMeetingRef.current = `${userKey}__${meetingId}`;
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat data Penerapan Konsep.'
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, userKey]);

  // 2. Langganan data tersimpan dari Firebase Firestore & localStorage khusus siswa aktif
  useEffect(() => {
    if (!aktivitas) return;

    const unsubscribe = langgananJawabanPenerapan(
      userKey,
      meetingId,
      aktivitas,
      (record) => {
        if (record && record.submitted) {
          setJawaban((prev) =>
            isEditing && prev ? prev : record.jawaban
          );
          setIsSubmitted(true);
          if (record.savedAtIso) {
            try {
              const dt = new Date(record.savedAtIso);
              setSavedAtText(
                dt.toLocaleString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              );
            } catch {
              setSavedAtText('');
            }
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [aktivitas, userKey, meetingId, isEditing]);

  // 3. Simpan draf otomatis setiap ada perubahan jawaban yang belum dikunci
  useEffect(() => {
    if (!aktivitas || !jawaban) return;
    if (hydratedMeetingRef.current !== `${userKey}__${meetingId}`) return;
    if (isSubmitted && !isEditing) return;

    simpanDrafLokalPenerapan(userKey, meetingId, jawaban);
  }, [aktivitas, jawaban, userKey, meetingId, isSubmitted, isEditing]);

  const inputsLocked = (isSubmitted && !isEditing) || isSaving;

  const codeLineNumbers = useMemo(() => {
    if (!jawaban) return [1];
    const count = Math.max(8, jawaban.teksJawaban.split(/\r?\n/).length);
    return Array.from({ length: count }, (_, idx) => idx + 1);
  }, [jawaban]);

  const wordCount = useMemo(() => {
    if (!jawaban?.teksJawaban.trim()) return 0;
    return jawaban.teksJawaban.trim().split(/\s+/).length;
  }, [jawaban]);

  // Handler pembaruan state jawaban yang bersih
  const updateCellTabel = (rowIdx: number, colIdx: number, val: string) => {
    if (inputsLocked || !jawaban) return;
    setCheckResult(null);
    setJawaban((prev) => {
      if (!prev) return prev;
      const nextRows = prev.barisTabel.map((r, rIdx) => {
        if (rIdx !== rowIdx) return r;
        const nextCells = [...r.sel];
        nextCells[colIdx] = val;
        return { sel: nextCells };
      });
      return { ...prev, barisTabel: nextRows };
    });
  };

  const handleAddTableRow = () => {
    if (inputsLocked || !jawaban || !aktivitas) return;
    setCheckResult(null);
    const colCount =
      aktivitas.modeInteraksi === 'tabel_dinamis'
        ? jawaban.kolomDinamis.length
        : (aktivitas.komponenJawaban.kolom || jawaban.kolomDinamis).length;
    setJawaban((prev) =>
      prev
        ? {
            ...prev,
            barisTabel: [
              ...prev.barisTabel,
              { sel: Array.from({ length: colCount }, () => '') },
            ],
          }
        : prev
    );
  };

  const handleRemoveTableRow = (rowIdx: number) => {
    if (inputsLocked || !jawaban || jawaban.barisTabel.length <= 1) return;
    setCheckResult(null);
    setJawaban((prev) =>
      prev
        ? {
            ...prev,
            barisTabel: prev.barisTabel.filter((_, idx) => idx !== rowIdx),
          }
        : prev
    );
  };

  const handleUpdateDynamicHeader = (colIdx: number, title: string) => {
    if (inputsLocked || !jawaban) return;
    setCheckResult(null);
    setJawaban((prev) => {
      if (!prev) return prev;
      const nextHeaders = [...prev.kolomDinamis];
      nextHeaders[colIdx] = title;
      return { ...prev, kolomDinamis: nextHeaders };
    });
  };

  const handleAddDynamicColumn = () => {
    if (inputsLocked || !jawaban || jawaban.kolomDinamis.length >= 7) return;
    setCheckResult(null);
    setJawaban((prev) => {
      if (!prev) return prev;
      const nextColNum = prev.kolomDinamis.length + 1;
      return {
        ...prev,
        kolomDinamis: [...prev.kolomDinamis, `Atribut ${nextColNum}`],
        barisTabel: prev.barisTabel.map((r) => ({ sel: [...r.sel, ''] })),
      };
    });
  };

  const handleRemoveDynamicColumn = (colIdx: number) => {
    if (inputsLocked || !jawaban || jawaban.kolomDinamis.length <= 2) return;
    setCheckResult(null);
    setJawaban((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        kolomDinamis: prev.kolomDinamis.filter((_, idx) => idx !== colIdx),
        barisTabel: prev.barisTabel.map((r) => ({
          sel: r.sel.filter((_, idx) => idx !== colIdx),
        })),
      };
    });
  };

  const handleToggleCeklisMatrix = (
    rowIdx: number,
    field: 'opsi1' | 'opsi2'
  ) => {
    if (inputsLocked || !jawaban) return;
    setCheckResult(null);
    setJawaban((prev) => {
      if (!prev) return prev;
      const next = prev.barisCeklis.map((r, idx) =>
        idx === rowIdx ? { ...r, [field]: !r[field] } : r
      );
      return { ...prev, barisCeklis: next };
    });
  };

  const handleChangeAlasanMatrix = (rowIdx: number, val: string) => {
    if (inputsLocked || !jawaban) return;
    setCheckResult(null);
    setJawaban((prev) => {
      if (!prev) return prev;
      const next = prev.barisCeklis.map((r, idx) =>
        idx === rowIdx ? { ...r, alasan: val } : r
      );
      return { ...prev, barisCeklis: next };
    });
  };

  const handleAddPengelompokanItem = () => {
    if (inputsLocked || !jawaban || !aktivitas) return;
    const trimmed = newGroupText.trim();
    if (!trimmed) return;
    const katTarget =
      newGroupCat || aktivitas.komponenJawaban.kategori?.[0] || 'Fakta';
    setCheckResult(null);
    setJawaban((prev) =>
      prev
        ? {
            ...prev,
            itemPengelompokan: [
              ...prev.itemPengelompokan,
              {
                id: `kat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                teks: trimmed,
                kategori: katTarget,
              },
            ],
          }
        : prev
    );
    setNewGroupText('');
  };

  const handleSwitchItemCategory = (itemId: string) => {
    if (inputsLocked || !jawaban || !aktivitas) return;
    const cats = aktivitas.komponenJawaban.kategori || ['Fakta', 'Opini'];
    if (cats.length < 2) return;
    setCheckResult(null);
    setJawaban((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        itemPengelompokan: prev.itemPengelompokan.map((it) => {
          if (it.id !== itemId) return it;
          const nextCat = it.kategori === cats[0] ? cats[1] : cats[0];
          return { ...it, kategori: nextCat };
        }),
      };
    });
  };

  const handleDeleteGroupItem = (itemId: string) => {
    if (inputsLocked || !jawaban) return;
    setCheckResult(null);
    setJawaban((prev) =>
      prev
        ? {
            ...prev,
            itemPengelompokan: prev.itemPengelompokan.filter(
              (it) => it.id !== itemId
            ),
          }
        : prev
    );
  };

  const handleInsertPseudocodeSnippet = (snippet: string) => {
    if (inputsLocked || !jawaban) return;
    setCheckResult(null);
    setJawaban((prev) => {
      if (!prev) return prev;
      const prefix =
        prev.teksJawaban.length > 0 && !prev.teksJawaban.endsWith('\n')
          ? `${prev.teksJawaban}\n`
          : prev.teksJawaban;
      return { ...prev, teksJawaban: `${prefix}${snippet}` };
    });
  };

  const handleTogglePracticeStep = (stepIdx: number) => {
    if (inputsLocked || !jawaban) return;
    setCheckResult(null);
    setJawaban((prev) => {
      if (!prev) return prev;
      const exists = prev.langkahTercentang.includes(stepIdx);
      const nextSteps = exists
        ? prev.langkahTercentang.filter((n) => n !== stepIdx)
        : [...prev.langkahTercentang, stepIdx];
      return { ...prev, langkahTercentang: nextSteps };
    });
  };

  const handleProcessSelectedFile = async (file: File | undefined) => {
    if (!file || inputsLocked || !aktivitas) return;
    setCheckResult(null);
    setStatusBanner({ tone: 'idle', message: '' });
    try {
      const infoBerkas = await prosesBerkasPenerapan(
        file,
        aktivitas.formatDiterima
      );
      setJawaban((prev) => (prev ? { ...prev, berkas: infoBerkas } : prev));
    } catch (err) {
      setStatusBanner({
        tone: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Berkas tidak dapat diproses. Silakan pilih berkas lain.',
      });
    }
  };

  const handleCheckCompleteness = () => {
    if (!aktivitas || !jawaban) return;
    const hasil = periksaKelengkapanPenerapan(aktivitas, jawaban);
    setCheckResult(hasil);
    setStatusBanner({ tone: 'idle', message: '' });
  };

  const handleSaveSubmission = async () => {
    if (!aktivitas || !jawaban || isSaving) return;

    const hasilValidasi = periksaKelengkapanPenerapan(aktivitas, jawaban);
    setCheckResult(hasilValidasi);

    if (!hasilValidasi.valid) {
      setStatusBanner({
        tone: 'error',
        message: hasilValidasi.pesan,
      });
      return;
    }

    setIsSaving(true);
    setStatusBanner({
      tone: 'info',
      message: 'Menyimpan hasil pekerjaan Penerapan Konsep...',
    });

    const result = await simpanJawabanPenerapanKeDatabase({
      session,
      userKey,
      meetingId,
      judulBab,
      judulPertemuan,
      aktivitas,
      jawaban,
    });

    setIsSaving(false);

    if (result.ok) {
      setIsSubmitted(true);
      setIsEditing(false);
      onMarkCompleted();

      try {
        const dt = new Date(result.savedAtIso);
        setSavedAtText(
          dt.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } catch {
        setSavedAtText('');
      }

      setStatusBanner({
        tone: 'success',
        message: result.warningMessage
          ? result.warningMessage
          : 'Jawaban Penerapan Konsep berhasil disimpan.',
      });
    } else {
      setStatusBanner({
        tone: 'error',
        message: 'Gagal menyimpan jawaban. Silakan coba kembali.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-10 shadow-md text-[#243B53] flex flex-col items-center justify-center gap-3">
        <SpinnerGap size={32} weight="bold" className="animate-spin text-[#527DA8]" />
        <p className="text-sm font-semibold font-[var(--font-nav)]">
          Memuat ruang kerja Penerapan Konsep...
        </p>
      </div>
    );
  }

  if (loadError || !aktivitas || !jawaban) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E57373] shadow-md text-[#243B53]">
        <div className="flex items-start gap-3">
          <WarningCircle size={24} weight="fill" className="text-[#E57373] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-[#1E3A5F]">
              Gagal Memuat Aktivitas Penerapan Konsep
            </h3>
            <p className="text-sm text-[#607286] mt-1">
              {loadError || 'Data aktivitas pertemuan ini belum tersedia.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const kolomTabelStatis =
    aktivitas.komponenJawaban.kolom || jawaban.kolomDinamis;
  const kategoriPengelompokan = aktivitas.komponenJawaban.kategori || [
    'Fakta',
    'Opini',
  ];

  return (
    <div className="flex flex-col gap-5 text-[#243447]">
      {/* 1. HEADER AKTIVITAS (Judul Aktivitas & Identitas Pertemuan) */}
      <div className="atp-header-gradient border-2 border-[#88D4AB] rounded-2xl p-6 sm:p-7 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold tracking-wide text-[#DCEAF5] font-[var(--font-nav)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#88D4AB] font-bold">PENERAPAN KONSEP</span>
            <span aria-hidden="true">·</span>
            <span>{aktivitas.labelJenisAktivitas}</span>
            <span aria-hidden="true">·</span>
            <span>{judulBab}</span>
          </div>
          {isSubmitted && (
            <span className="inline-flex items-center gap-1.5 text-[#88D4AB] font-bold">
              <CheckCircle size={16} weight="fill" />
              {savedAtText ? `Tersimpan ${savedAtText}` : 'Tersimpan'}
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 leading-snug">
          {judulPertemuan}
        </h2>
        <p className="text-sm text-[#DCEAF5]/95 mt-1.5 max-w-3xl">
          Terapkan pemahaman konsepmu secara langsung melalui aktivitas terarah sesuai karakteristik materi pada pertemuan ini.
        </p>
      </div>

      {/* BENTO GRID BARIS 1: Soal/Permasalahan Sumber (Kiri) + Petunjuk Pengerjaan (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 3. Soal atau Permasalahan (100% Verbatim dari JSON Sumber) */}
        <section className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 text-[#1E3A5F] mb-3">
              <FileText size={22} weight="duotone" className="text-[#527DA8] shrink-0" />
              <h3 className="text-base sm:text-lg font-bold">
                Soal &amp; Permasalahan Aktivitas
              </h3>
            </div>
            <p className="text-[0.96rem] sm:text-base leading-relaxed text-[#243447]">
              {aktivitas.petunjuk}
            </p>
          </div>

          {atpSections.tujuanPembelajaran && (
            <div className="pt-4 border-t border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-[#527DA8] mb-1 font-[var(--font-nav)]">
                Keterkaitan Tujuan Pembelajaran
              </p>
              <p className="text-sm text-[#486581] leading-relaxed">
                {atpSections.tujuanPembelajaran}
              </p>
            </div>
          )}
        </section>

        {/* 2. Petunjuk Pengerjaan (Kalimat Perintah Komunikatif SMP) */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-2.5 text-[#1E3A5F] mb-3.5">
            <ListChecks size={22} weight="duotone" className="text-[#527DA8] shrink-0" />
            <h3 className="text-base sm:text-lg font-bold">
              Petunjuk Pengerjaan
            </h3>
          </div>

          <ol className="space-y-3">
            {aktivitas.langkahPengerjaan.map((langkah, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-[#334E68] leading-relaxed">
                <span className="w-6 h-6 rounded-lg bg-[#DCEAF5] text-[#1E3A5F] font-bold text-xs inline-flex items-center justify-center shrink-0 mt-0.5 font-[var(--font-nav)]">
                  {idx + 1}
                </span>
                <span>{langkah}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* 4. KONTEN AKTIVITAS & PANDUAN PENDUKUNG BERBASIS KODE */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-2.5 text-[#1E3A5F]">
            {aktivitas.modeInteraksi === 'editor_kode' ? (
              <Code size={22} weight="duotone" className="text-[#527DA8]" />
            ) : aktivitas.modeInteraksi === 'unggah_berkas' ||
              aktivitas.modeInteraksi === 'teks_dan_unggah' ? (
              <FolderOpen size={22} weight="duotone" className="text-[#527DA8]" />
            ) : (
              <Table size={22} weight="duotone" className="text-[#527DA8]" />
            )}
            <h3 className="text-base sm:text-lg font-bold">
              Acuan &amp; Spesifikasi Aktivitas
            </h3>
          </div>
          <span className="text-xs text-[#607286] font-[var(--font-nav)]">
            Format Kerja: <strong className="text-[#1E3A5F]">{aktivitas.labelJenisAktivitas}</strong>
          </span>
        </div>

        {/* Ilustrasi & acuan kontekstual sesuai karakteristik tipe aktivitas */}
        {aktivitas.modeInteraksi === 'editor_kode' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-[#F8FAFC]">
              <p className="font-bold text-[#1E3A5F] mb-1">1. Bagian Deklarasi</p>
              <p className="text-[#486581] text-xs leading-relaxed">
                Daftarkan nama variabel beserta tipe datanya (misalnya <code className="font-mono text-[#1E3A5F]">INTEGER</code>, <code className="font-mono text-[#1E3A5F]">STRING</code>, atau <code className="font-mono text-[#1E3A5F]">BOOLEAN</code>).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC]">
              <p className="font-bold text-[#1E3A5F] mb-1">2. Alur Proses &amp; Kontrol</p>
              <p className="text-[#486581] text-xs leading-relaxed">
                Gunakan kata kunci tegas seperti <code className="font-mono text-[#1E3A5F]">READ</code>, <code className="font-mono text-[#1E3A5F]">IF-THEN-ELSE</code>, <code className="font-mono text-[#1E3A5F]">FOR</code>, atau <code className="font-mono text-[#1E3A5F]">WHILE</code> secara berurutan.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC]">
              <p className="font-bold text-[#1E3A5F] mb-1">3. Bagian Keluaran</p>
              <p className="text-[#486581] text-xs leading-relaxed">
                Akhiri dengan instruksi <code className="font-mono text-[#1E3A5F]">PRINT</code> atau <code className="font-mono text-[#1E3A5F]">OUTPUT</code> untuk menampilkan hasil pemrosesan.
              </p>
            </div>
          </div>
        ) : aktivitas.modeInteraksi === 'pengelompokan' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-[#F4FAF7]">
              <p className="font-bold text-[#1E3A5F] mb-1">Kriteria Fakta Objektif</p>
              <p className="text-xs text-[#334E68] leading-relaxed">
                Memuat peristiwa nyata, angka, tanggal, atau klaim yang dapat diuji dan dibuktikan kebenarannya melalui sumber valid.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC]">
              <p className="font-bold text-[#1E3A5F] mb-1">Kriteria Opini Subjektif</p>
              <p className="text-xs text-[#334E68] leading-relaxed">
                Memuat pendapat pribadi, penilaian rasa, atau perkiraan (sering ditandai kata seperti menurut saya, sebaiknya, paling menarik).
              </p>
            </div>
          </div>
        ) : aktivitas.modeInteraksi === 'unggah_berkas' ||
          aktivitas.modeInteraksi === 'unggah_atau_teks' ||
          aktivitas.modeInteraksi === 'teks_dan_unggah' ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F8FAFC] text-sm">
            <div>
              <p className="font-bold text-[#1E3A5F]">
                Ketentuan Berkas Karya Siswa
              </p>
              <p className="text-xs text-[#486581] mt-0.5">
                Pastikan berkas yang diunggah sesuai dengan instruksi pertemuan dan diberi nama yang rapi sebelum dikumpulkan.
              </p>
            </div>
            <div className="text-xs font-semibold text-[#1E3A5F] font-[var(--font-nav)] shrink-0">
              Ekstensi diterima: {aktivitas.formatDiterima.join(' · ')}
            </div>
          </div>
        ) : aktivitas.modeInteraksi === 'tabel_statis' ||
          aktivitas.modeInteraksi === 'tabel_dinamis' ||
          aktivitas.modeInteraksi === 'tabel_ceklis' ? (
          <div className="p-4 rounded-xl bg-[#F8FAFC] text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-[#1E3A5F]">Struktur Kolom Tabel Kerja</p>
              <p className="text-xs text-[#486581] mt-0.5">
                {aktivitas.modeInteraksi === 'tabel_dinamis'
                  ? aktivitas.komponenJawaban.instruksi_antarmuka ||
                    'Kamu bebas mengubah judul kolom atribut serta menambah baris maupun kolom.'
                  : `Susun pengamatan dan analisismu ke dalam kolom: ${(
                      aktivitas.komponenJawaban.kolom || []
                    ).join(' · ')}.`}
              </p>
            </div>
            <span className="text-xs font-semibold text-[#527DA8] font-[var(--font-nav)] shrink-0">
              {aktivitas.modeInteraksi === 'tabel_dinamis'
                ? `${jawaban.kolomDinamis.length} Kolom · ${jawaban.barisTabel.length} Baris`
                : `${kolomTabelStatis.length} Kolom · ${jawaban.barisTabel.length} Baris`}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#334E68]">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC]">
              <strong className="block text-[#1E3A5F] text-sm mb-0.5">1. Identifikasi</strong>
              Amati objek, kasus, atau skenario yang dijelaskan pada soal aktivitas.
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC]">
              <strong className="block text-[#1E3A5F] text-sm mb-0.5">2. Analisis Konsep</strong>
              Hubungkan temuanmu dengan konsep Informatika pada pertemuan ini.
            </div>
            <div className="p-3.5 rounded-xl bg-[#F8FAFC]">
              <strong className="block text-[#1E3A5F] text-sm mb-0.5">3. Rumuskan Solusi</strong>
              Tuliskan kesimpulan atau langkah penyelesaian dengan kalimat yang runtut.
            </div>
          </div>
        )}
      </section>

      {/* 5. AREA PENGERJAAN SISWA INTERAKTIF */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-[#527DA8]/35 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-[#1E3A5F]">
              Area Pengerjaan Siswa
            </h3>
            {aktivitas.komponenJawaban.label && (
              <p className="text-sm text-[#486581] mt-0.5">
                {aktivitas.komponenJawaban.label}
              </p>
            )}
          </div>

          {inputsLocked && (
            <span className="text-xs font-semibold text-[#1E3A5F] font-[var(--font-nav)]">
              Jawaban terkunci · Klik Ubah Jawaban bila ingin memperbarui
            </span>
          )}
        </div>

        {/* --- MODE 1: TABEL STATIS --- */}
        {aktivitas.modeInteraksi === 'tabel_statis' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse min-w-[540px]">
                <thead>
                  <tr className="bg-[#1E3A5F] text-white text-xs sm:text-sm font-[var(--font-nav)]">
                    <th className="py-3 px-3.5 w-12 text-center font-bold">No</th>
                    {kolomTabelStatis.map((kol, cIdx) => (
                      <th key={cIdx} className="py-3 px-4 font-bold">
                        {kol}
                      </th>
                    ))}
                    {!inputsLocked && (
                      <th className="py-3 px-3 w-14 text-center font-bold">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {jawaban.barisTabel.map((row, rIdx) => (
                    <tr key={rIdx} className="bg-white hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-[#527DA8] align-top pt-4">
                        {rIdx + 1}
                      </td>
                      {kolomTabelStatis.map((kol, cIdx) => (
                        <td key={cIdx} className="p-2.5 align-top">
                          <textarea
                            rows={2}
                            disabled={inputsLocked}
                            value={row.sel[cIdx] || ''}
                            onChange={(e) =>
                              updateCellTabel(rIdx, cIdx, e.target.value)
                            }
                            placeholder={`Isi ${kol.toLowerCase()}...`}
                            className="w-full rounded-lg border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#527DA8] focus:outline-none px-3 py-2 text-sm text-[#243447] resize-y disabled:opacity-75"
                          />
                        </td>
                      ))}
                      {!inputsLocked && (
                        <td className="p-2.5 text-center align-top pt-3.5">
                          <button
                            type="button"
                            onClick={() => handleRemoveTableRow(rIdx)}
                            disabled={jawaban.barisTabel.length <= 1}
                            title="Hapus baris"
                            className="p-2 rounded-lg text-slate-400 hover:text-[#E57373] hover:bg-red-50 disabled:opacity-30 cursor-pointer transition"
                          >
                            <Trash size={17} weight="bold" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!inputsLocked && (
              <button
                type="button"
                onClick={handleAddTableRow}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#527DA8] text-[#1E3A5F] hover:bg-[#DCEAF5]/60 text-xs sm:text-sm font-bold font-[var(--font-nav)] cursor-pointer transition"
              >
                <Plus size={16} weight="bold" />
                Tambah Baris Tabel
              </button>
            )}
          </div>
        )}

        {/* --- MODE 2: TABEL DINAMIS (Tambah/Hapus Kolom & Baris) --- */}
        {aktivitas.modeInteraksi === 'tabel_dinamis' && (
          <div className="space-y-4">
            {!inputsLocked && (
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleAddDynamicColumn}
                  disabled={jawaban.kolomDinamis.length >= 7}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E3A5F] hover:bg-[#152C5B] text-white text-xs font-bold font-[var(--font-nav)] disabled:opacity-40 cursor-pointer transition"
                >
                  <Plus size={15} weight="bold" />
                  Tambah Kolom Atribut
                </button>
                <button
                  type="button"
                  onClick={handleAddTableRow}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#527DA8] text-[#1E3A5F] hover:bg-[#DCEAF5]/60 text-xs font-bold font-[var(--font-nav)] cursor-pointer transition"
                >
                  <Plus size={15} weight="bold" />
                  Tambah Baris Data
                </button>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-[#1E3A5F] text-white text-xs sm:text-sm">
                    <th className="py-3 px-3 w-12 text-center font-bold font-[var(--font-nav)]">
                      Baris
                    </th>
                    {jawaban.kolomDinamis.map((judulKol, cIdx) => (
                      <th key={cIdx} className="p-2.5 min-w-[160px]">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            disabled={inputsLocked}
                            value={judulKol}
                            onChange={(e) =>
                              handleUpdateDynamicHeader(cIdx, e.target.value)
                            }
                            placeholder={`Judul Atribut ${cIdx + 1}`}
                            className="w-full rounded-lg bg-white/15 border border-white/30 focus:bg-white focus:text-[#1E3A5F] px-2.5 py-1.5 text-xs sm:text-sm font-bold placeholder:text-white/60 focus:outline-none"
                          />
                          {!inputsLocked && jawaban.kolomDinamis.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDynamicColumn(cIdx)}
                              title="Hapus kolom ini"
                              className="p-1.5 rounded-md text-white/75 hover:text-white hover:bg-white/15 cursor-pointer transition shrink-0"
                            >
                              <Trash size={14} weight="bold" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    {!inputsLocked && (
                      <th className="py-3 px-3 w-12 text-center font-bold">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {jawaban.barisTabel.map((row, rIdx) => (
                    <tr key={rIdx} className="bg-white hover:bg-[#F8FAFC]/80">
                      <td className="py-3 px-3 text-center font-bold text-[#527DA8]">
                        {rIdx + 1}
                      </td>
                      {jawaban.kolomDinamis.map((judulKol, cIdx) => (
                        <td key={cIdx} className="p-2.5">
                          <input
                            type="text"
                            disabled={inputsLocked}
                            value={row.sel[cIdx] || ''}
                            onChange={(e) =>
                              updateCellTabel(rIdx, cIdx, e.target.value)
                            }
                            placeholder={`Data ${judulKol || `kolom ${cIdx + 1}`}...`}
                            className="w-full rounded-lg border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#527DA8] focus:outline-none px-3 py-2 text-sm text-[#243447] disabled:opacity-75"
                          />
                        </td>
                      ))}
                      {!inputsLocked && (
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveTableRow(rIdx)}
                            disabled={jawaban.barisTabel.length <= 1}
                            title="Hapus baris"
                            className="p-2 rounded-lg text-slate-400 hover:text-[#E57373] hover:bg-red-50 disabled:opacity-30 cursor-pointer transition"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MODE 3: TABEL CEKLIS INDIKATOR --- */}
        {aktivitas.modeInteraksi === 'tabel_ceklis' && (
          <div className="space-y-5">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse min-w-[580px]">
                <thead>
                  <tr className="bg-[#1E3A5F] text-white text-xs sm:text-sm font-[var(--font-nav)]">
                    <th className="py-3 px-4 font-bold">
                      {aktivitas.komponenJawaban.kolom?.[0] || 'Indikator'}
                    </th>
                    <th className="py-3 px-4 text-center font-bold w-32">
                      {aktivitas.komponenJawaban.kolom?.[1] || 'Artikel 1'}
                    </th>
                    <th className="py-3 px-4 text-center font-bold w-32">
                      {aktivitas.komponenJawaban.kolom?.[2] || 'Artikel 2'}
                    </th>
                    <th className="py-3 px-4 font-bold">
                      {aktivitas.komponenJawaban.kolom?.[3] || 'Alasan'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {jawaban.barisCeklis.map((row, idx) => (
                    <tr key={row.indikator} className="bg-white">
                      <td className="py-3.5 px-4 font-bold text-[#1E3A5F]">
                        {row.indikator}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={inputsLocked}
                          onClick={() => handleToggleCeklisMatrix(idx, 'opsi1')}
                          className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition cursor-pointer disabled:cursor-default ${
                            row.opsi1
                              ? 'bg-[#88D4AB] border-[#88D4AB] text-[#1E3A5F]'
                              : 'bg-[#F8FAFC] border-slate-300 text-slate-400 hover:border-[#527DA8]'
                          }`}
                        >
                          {row.opsi1 ? (
                            <CheckSquare size={22} weight="fill" />
                          ) : (
                            <Square size={22} />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={inputsLocked}
                          onClick={() => handleToggleCeklisMatrix(idx, 'opsi2')}
                          className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition cursor-pointer disabled:cursor-default ${
                            row.opsi2
                              ? 'bg-[#88D4AB] border-[#88D4AB] text-[#1E3A5F]'
                              : 'bg-[#F8FAFC] border-slate-300 text-slate-400 hover:border-[#527DA8]'
                          }`}
                        >
                          {row.opsi2 ? (
                            <CheckSquare size={22} weight="fill" />
                          ) : (
                            <Square size={22} />
                          )}
                        </button>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          disabled={inputsLocked}
                          value={row.alasan}
                          onChange={(e) =>
                            handleChangeAlasanMatrix(idx, e.target.value)
                          }
                          placeholder={`Tuliskan alasan penilaian ${row.indikator.toLowerCase()}...`}
                          className="w-full rounded-lg border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#527DA8] focus:outline-none px-3 py-2 text-sm text-[#243447]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-sm font-bold text-[#1E3A5F]">
                Kesimpulan Artikel Lebih Kredibel:
              </span>
              {['Artikel 1', 'Artikel 2'].map((opsi) => (
                <button
                  key={opsi}
                  type="button"
                  disabled={inputsLocked}
                  onClick={() =>
                    setJawaban((prev) =>
                      prev ? { ...prev, pilihanKesimpulan: opsi } : prev
                    )
                  }
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold font-[var(--font-nav)] border transition cursor-pointer disabled:cursor-default ${
                    jawaban.pilihanKesimpulan === opsi
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                      : 'bg-[#F8FAFC] text-[#243B53] border-slate-300 hover:border-[#527DA8]'
                  }`}
                >
                  {opsi}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- MODE 4: FORM EVALUASI MULTI-KOLOM --- */}
        {aktivitas.modeInteraksi === 'form_evaluasi' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(aktivitas.komponenJawaban.kolom_isian || []).map((kolName, idx) => {
              const isWide = idx === (aktivitas.komponenJawaban.kolom_isian?.length || 0) - 1;
              return (
                <div
                  key={kolName}
                  className={isWide ? 'md:col-span-2' : ''}
                >
                  <label className="block text-sm font-bold text-[#1E3A5F] mb-1.5">
                    {kolName}
                  </label>
                  {isWide ? (
                    <textarea
                      rows={3}
                      disabled={inputsLocked}
                      value={jawaban.isianEvaluasi[kolName] || ''}
                      onChange={(e) => {
                        setCheckResult(null);
                        setJawaban((prev) =>
                          prev
                            ? {
                                ...prev,
                                isianEvaluasi: {
                                  ...prev.isianEvaluasi,
                                  [kolName]: e.target.value,
                                },
                              }
                            : prev
                        );
                      }}
                      placeholder={`uraikan ${kolName.toLowerCase()}...`}
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#527DA8] focus:outline-none px-4 py-3 text-sm text-[#243447]"
                    />
                  ) : (
                    <input
                      type="text"
                      disabled={inputsLocked}
                      value={jawaban.isianEvaluasi[kolName] || ''}
                      onChange={(e) => {
                        setCheckResult(null);
                        setJawaban((prev) =>
                          prev
                            ? {
                                ...prev,
                                isianEvaluasi: {
                                  ...prev.isianEvaluasi,
                                  [kolName]: e.target.value,
                                },
                              }
                            : prev
                        );
                      }}
                      placeholder={`Masukkan ${kolName.toLowerCase()}...`}
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#527DA8] focus:outline-none px-4 py-2.5 text-sm text-[#243447]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* --- MODE 5: PENGELOMPOKAN KATEGORI (Fakta vs Opini) --- */}
        {aktivitas.modeInteraksi === 'pengelompokan' && (
          <div className="space-y-5">
            {!inputsLocked && (
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={newGroupText}
                  onChange={(e) => setNewGroupText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPengelompokanItem();
                    }
                  }}
                  placeholder="Ketik kutipan kalimat dari media sosial/artikel di sini..."
                  className="flex-1 rounded-xl border border-slate-300 bg-[#F8FAFC] focus:bg-white focus:border-[#527DA8] focus:outline-none px-4 py-2.5 text-sm text-[#243447]"
                />
                <select
                  aria-label="Pilih Kategori"
                  value={newGroupCat}
                  onChange={(e) => setNewGroupCat(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-bold text-[#1E3A5F] focus:outline-none cursor-pointer"
                >
                  {kategoriPengelompokan.map((kat) => (
                    <option key={kat} value={kat}>
                      Kategori: {kat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddPengelompokanItem}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#152C5B] text-white text-sm font-bold font-[var(--font-nav)] cursor-pointer transition shrink-0"
                >
                  <Plus size={16} weight="bold" />
                  Tambahkan
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {kategoriPengelompokan.map((kat, idx) => {
                const itemsInKat = jawaban.itemPengelompokan.filter(
                  (it) => it.kategori === kat
                );
                return (
                  <div
                    key={kat}
                    className={`rounded-xl p-4 border ${
                      idx === 0
                        ? 'bg-[#F5FBF8] border-[#88D4AB]/60'
                        : 'bg-[#F8FAFC] border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/80">
                      <h4 className="font-bold text-[#1E3A5F] text-base">
                        Kelompok {kat}
                      </h4>
                      <span className="text-xs font-semibold text-[#527DA8] font-[var(--font-nav)]">
                        {itemsInKat.length} pernyataan
                      </span>
                    </div>

                    {itemsInKat.length === 0 ? (
                      <p className="text-xs text-[#607286] py-4 text-center">
                        Belum ada kutipan kalimat pada kelompok {kat}.
                      </p>
                    ) : (
                      <ul className="space-y-2.5">
                        {itemsInKat.map((it) => (
                          <li
                            key={it.id}
                            className="bg-white rounded-lg p-3 border border-slate-200/90 flex items-start justify-between gap-2 text-sm"
                          >
                            <span className="text-[#243447] leading-relaxed">
                              &ldquo;{it.teks}&rdquo;
                            </span>
                            {!inputsLocked && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleSwitchItemCategory(it.id)}
                                  title="Pindahkan ke kategori sebelah"
                                  className="p-1.5 rounded-md text-[#527DA8] hover:bg-[#DCEAF5]/60 cursor-pointer transition"
                                >
                                  <ArrowsLeftRight size={15} weight="bold" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGroupItem(it.id)}
                                  title="Hapus pernyataan"
                                  className="p-1.5 rounded-md text-slate-400 hover:text-[#E57373] hover:bg-red-50 cursor-pointer transition"
                                >
                                  <Trash size={15} weight="bold" />
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- MODE 6: EDITOR KODE / PSEUDOCODE --- */}
        {aktivitas.modeInteraksi === 'editor_kode' && (
          <div className="space-y-3">
            {!inputsLocked && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[#607286] mr-1">
                  Sisipkan cepat:
                </span>
                {PSEUDOCODE_SNIPPETS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleInsertPseudocodeSnippet(item.snippet)}
                    className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#DCEAF5] text-[#1E3A5F] font-mono text-xs font-semibold cursor-pointer transition"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-xl overflow-hidden border border-[#1E3A5F] bg-[#0F1E36] text-slate-100 flex">
              <div
                aria-hidden="true"
                className="select-none bg-[#152847] text-slate-400 font-mono text-xs py-4 px-3 text-right leading-6 border-r border-white/10"
              >
                {codeLineNumbers.map((num) => (
                  <div key={num}>{num}</div>
                ))}
              </div>
              <textarea
                rows={aktivitas.tipe === 'teks_kode_panjang' ? 13 : 9}
                disabled={inputsLocked}
                value={jawaban.teksJawaban}
                onChange={(e) => {
                  setCheckResult(null);
                  setJawaban((prev) =>
                    prev ? { ...prev, teksJawaban: e.target.value } : prev
                  );
                }}
                spellCheck={false}
                placeholder={`ALGORITMA Penyelesaian_Masalah\nDEKLARASI\n  ...\nDESKRIPSI\n  ...`}
                className="w-full bg-transparent text-[#E2E8F0] placeholder:text-slate-500 font-mono text-sm leading-6 p-4 focus:outline-none resize-y disabled:opacity-80"
              />
            </div>
          </div>
        )}

        {/* --- MODE 7: CEKLIS PRAKTIK MANDIRI --- */}
        {aktivitas.modeInteraksi === 'ceklis_praktik' && (
          <div className="space-y-4">
            {aktivitas.butirPraktik.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#527DA8] font-[var(--font-nav)]">
                  Daftar Tahapan Praktik
                </p>
                {aktivitas.butirPraktik.map((butir, idx) => {
                  const checked = jawaban.langkahTercentang.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={inputsLocked}
                      onClick={() => handleTogglePracticeStep(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition cursor-pointer disabled:cursor-default ${
                        checked
                          ? 'bg-[#F4FAF7] border-[#88D4AB] text-[#1E3A5F]'
                          : 'bg-[#F8FAFC] border-slate-200 text-[#334E68] hover:border-[#527DA8]'
                      }`}
                    >
                      <span className="mt-0.5 text-[#1E3A5F] shrink-0">
                        {checked ? (
                          <CheckSquare size={20} weight="fill" className="text-[#2E8555]" />
                        ) : (
                          <Square size={20} />
                        )}
                      </span>
                      <span className="text-sm leading-relaxed">{butir}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              disabled={inputsLocked}
              onClick={() => {
                setCheckResult(null);
                setJawaban((prev) =>
                  prev ? { ...prev, ceklisUtama: !prev.ceklisUtama } : prev
                );
              }}
              className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-3.5 transition cursor-pointer disabled:cursor-default ${
                jawaban.ceklisUtama
                  ? 'bg-[#1E3A5F] border-[#88D4AB] text-white'
                  : 'bg-[#F8FAFC] border-slate-300 text-[#1E3A5F] hover:border-[#527DA8]'
              }`}
            >
              {jawaban.ceklisUtama ? (
                <CheckSquare size={24} weight="fill" className="text-[#88D4AB] shrink-0" />
              ) : (
                <Square size={24} className="text-[#527DA8] shrink-0" />
              )}
              <span className="text-sm sm:text-base font-bold">
                {aktivitas.komponenJawaban.label ||
                  'Saya telah menyelesaikan seluruh tahapan praktik di atas dengan jujur dan mandiri.'}
              </span>
            </button>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#527DA8] mb-1.5 font-[var(--font-nav)]">
                Catatan Hasil Praktik (Opsional)
              </label>
              <textarea
                rows={3}
                disabled={inputsLocked}
                value={jawaban.catatanPendukung}
                onChange={(e) =>
                  setJawaban((prev) =>
                    prev ? { ...prev, catatanPendukung: e.target.value } : prev
                  )
                }
                placeholder="Tuliskan temuan singkat atau hal yang kamu pelajari saat mempraktikkan langkah di atas..."
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#527DA8] focus:outline-none px-4 py-3 text-sm text-[#243447]"
              />
            </div>
          </div>
        )}

        {/* --- MODE 8: EDITOR TEKS / ANALISIS / REFLEKSI / LAPORAN --- */}
        {aktivitas.modeInteraksi === 'editor_teks' && (
          <div className="space-y-2">
            <textarea
              rows={aktivitas.tipe === 'teks_panjang' ? 9 : 6}
              disabled={inputsLocked}
              value={jawaban.teksJawaban}
              onChange={(e) => {
                setCheckResult(null);
                setJawaban((prev) =>
                  prev ? { ...prev, teksJawaban: e.target.value } : prev
                );
              }}
              placeholder="Tuliskan hasil pengamatan, analisis, atau kesimpulanmu secara jelas di sini..."
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#527DA8] focus:outline-none p-4 text-sm sm:text-[0.95rem] leading-relaxed text-[#243447] resize-y disabled:opacity-80"
            />
            <div className="flex justify-end text-xs text-[#607286]">
              <span>
                {wordCount} kata · {jawaban.teksJawaban.length} karakter
              </span>
            </div>
          </div>
        )}

        {/* --- MODE 9, 10, 11: UNGGAH BERKAS / GAMBAR / KOMBINASI TEKS & UNGGAH --- */}
        {(aktivitas.modeInteraksi === 'unggah_berkas' ||
          aktivitas.modeInteraksi === 'unggah_atau_teks' ||
          aktivitas.modeInteraksi === 'teks_dan_unggah') && (
          <div
            className={
              aktivitas.modeInteraksi === 'unggah_atau_teks' ||
              aktivitas.modeInteraksi === 'teks_dan_unggah'
                ? 'grid grid-cols-1 lg:grid-cols-2 gap-5'
                : 'space-y-4'
            }
          >
            {/* Kolom Teks bila mode kombinasi */}
            {(aktivitas.modeInteraksi === 'unggah_atau_teks' ||
              aktivitas.modeInteraksi === 'teks_dan_unggah') && (
              <div className="flex flex-col">
                <label className="text-sm font-bold text-[#1E3A5F] mb-2">
                  {aktivitas.modeInteraksi === 'teks_dan_unggah'
                    ? 'Uraian Tertulis / Algoritma / Takarir'
                    : 'Opsi 1 — Ketik Struktur Tabel & Daftar'}
                </label>
                <textarea
                  rows={8}
                  disabled={inputsLocked}
                  value={jawaban.teksJawaban}
                  onChange={(e) => {
                    setCheckResult(null);
                    setJawaban((prev) =>
                      prev ? { ...prev, teksJawaban: e.target.value } : prev
                    );
                  }}
                  placeholder="Tuliskan jawaban tertulis, langkah algoritma, atau takarir beserta daftar pustaka di sini..."
                  className="w-full flex-1 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#527DA8] focus:outline-none p-4 text-sm leading-relaxed text-[#243447] resize-y disabled:opacity-80"
                />
              </div>
            )}

            {/* Area Unggah Berkas / Gambar */}
            <div className="flex flex-col gap-3">
              {(aktivitas.modeInteraksi === 'unggah_atau_teks' ||
                aktivitas.modeInteraksi === 'teks_dan_unggah') && (
                <span className="text-sm font-bold text-[#1E3A5F]">
                  {aktivitas.modeInteraksi === 'teks_dan_unggah'
                    ? 'Unggah Berkas / Tangkapan Layar Pendukung'
                    : 'Opsi 2 — Unggah Berkas Lembar Kerja'}
                </span>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={aktivitas.formatDiterima.join(',')}
                disabled={inputsLocked}
                onChange={(e) => {
                  const chosen = e.target.files?.[0];
                  handleProcessSelectedFile(chosen);
                  e.target.value = '';
                }}
                className="hidden"
              />

              {!jawaban.berkas ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!inputsLocked) setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (inputsLocked) return;
                    const dropped = e.dataTransfer.files?.[0];
                    handleProcessSelectedFile(dropped);
                  }}
                  onClick={() => {
                    if (!inputsLocked) fileInputRef.current?.click();
                  }}
                  className={`rounded-2xl border-2 border-dashed p-8 text-center transition flex flex-col items-center justify-center gap-2.5 ${
                    inputsLocked
                      ? 'border-slate-200 bg-slate-50 opacity-70'
                      : isDraggingFile
                        ? 'border-[#1E3A5F] bg-[#DCEAF5]/50 cursor-pointer'
                        : 'border-[#527DA8]/50 bg-[#F8FAFC] hover:bg-[#DCEAF5]/30 hover:border-[#1E3A5F] cursor-pointer'
                  }`}
                >
                  {aktivitas.tipe === 'unggah_gambar' ? (
                    <ImageSquare size={40} weight="duotone" className="text-[#527DA8]" />
                  ) : (
                    <FileArrowUp size={40} weight="duotone" className="text-[#527DA8]" />
                  )}
                  <p className="text-sm font-bold text-[#1E3A5F]">
                    Klik untuk memilih berkas atau seret berkas ke area ini
                  </p>
                  <p className="text-xs text-[#607286]">
                    Format diterima: {aktivitas.formatDiterima.join(', ')} (Maks. 25 MB)
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#88D4AB] bg-[#F5FBF8] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UploadSimple
                        size={24}
                        weight="bold"
                        className="text-[#1E3A5F] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1E3A5F] truncate">
                          {jawaban.berkas.namaFile}
                        </p>
                        <p className="text-xs text-[#486581]">
                          {formatUkuranBerkas(jawaban.berkas.ukuranBytes)} ·{' '}
                          {jawaban.berkas.ekstensi.toUpperCase().replace('.', '')}
                        </p>
                      </div>
                    </div>

                    {!inputsLocked && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-[#527DA8] text-xs font-bold text-[#1E3A5F] cursor-pointer transition"
                        >
                          Ganti Berkas
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setJawaban((prev) =>
                              prev ? { ...prev, berkas: null } : prev
                            )
                          }
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#E57373] hover:bg-red-50 cursor-pointer transition"
                          title="Hapus berkas"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      </div>
                    )}
                  </div>

                  {jawaban.berkas.pratinjauDataUrl && (
                    <div className="pt-2 border-t border-[#88D4AB]/40">
                      <img
                        src={jawaban.berkas.pratinjauDataUrl}
                        alt={`Pratinjau ${jawaban.berkas.namaFile}`}
                        className="max-h-72 w-auto mx-auto rounded-xl border border-slate-200 object-contain bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {aktivitas.tipe === 'praktik_observasi' && (
                <div className="pt-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#527DA8] mb-1.5 font-[var(--font-nav)]">
                    Catatan Simulasi Penyampaian Presentasi (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    disabled={inputsLocked}
                    value={jawaban.catatanPendukung}
                    onChange={(e) =>
                      setJawaban((prev) =>
                        prev ? { ...prev, catatanPendukung: e.target.value } : prev
                      )
                    }
                    placeholder="Tuliskan refleksi singkat simulasi presentasimu di depan kelas..."
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:border-[#527DA8] focus:outline-none px-3.5 py-2.5 text-sm text-[#243447]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* UMPAN BALIK PERIKSA JAWABAN / STATUS SIMPAN */}
        {checkResult && (
          <div
            className={`mt-5 p-4 rounded-xl border flex items-start gap-3 text-sm ${
              checkResult.valid
                ? 'bg-[#F4FAF7] border-[#88D4AB] text-[#1E3A5F]'
                : 'bg-[#FFF8F6] border-[#E57373] text-[#7A271A]'
            }`}
          >
            {checkResult.valid ? (
              <CheckCircle
                size={20}
                weight="fill"
                className="text-[#2E8555] shrink-0 mt-0.5"
              />
            ) : (
              <WarningCircle
                size={20}
                weight="fill"
                className="text-[#E57373] shrink-0 mt-0.5"
              />
            )}
            <div>
              <p className="font-bold">{checkResult.pesan}</p>
              {checkResult.rincian.length > 1 && (
                <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                  {checkResult.rincian.slice(1).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {statusBanner.tone !== 'idle' && (
          <div
            className={`mt-4 p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
              statusBanner.tone === 'success'
                ? 'bg-[#F4FAF7] border-[#88D4AB] text-[#065F46]'
                : statusBanner.tone === 'error'
                  ? 'bg-[#FFF8F6] border-[#E57373] text-[#991B1B]'
                  : 'bg-[#F8FAFC] border-[#527DA8]/40 text-[#1E3A5F]'
            }`}
          >
            {statusBanner.tone === 'info' ? (
              <SpinnerGap size={19} weight="bold" className="animate-spin shrink-0" />
            ) : statusBanner.tone === 'success' ? (
              <CheckCircle size={20} weight="fill" className="text-[#2E8555] shrink-0" />
            ) : (
              <WarningCircle size={20} weight="fill" className="text-[#E57373] shrink-0" />
            )}
            <span>{statusBanner.message}</span>
          </div>
        )}

        {/* 6. TOMBOL AKSI AKTIVITAS */}
        <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#607286]">
            {isSubmitted && !isEditing
              ? 'Pekerjaanmu telah tersimpan. Kamu tetap dapat memperbaruinya kapan saja.'
              : 'Draf jawaban tersimpan otomatis saat kamu berpindah menu.'}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSubmitted && !isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setStatusBanner({ tone: 'idle', message: '' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#527DA8] text-[#1E3A5F] hover:bg-[#DCEAF5]/50 font-[var(--font-nav)] font-bold text-sm cursor-pointer transition"
              >
                <PencilSimple size={18} weight="bold" />
                Ubah Jawaban
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleCheckCompleteness}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#527DA8] text-[#1E3A5F] hover:bg-[#DCEAF5]/50 font-[var(--font-nav)] font-bold text-sm cursor-pointer transition disabled:opacity-50"
                >
                  <MagnifyingGlass size={18} weight="bold" />
                  Periksa Jawaban
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveSubmission}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#152C5B] text-white font-[var(--font-nav)] font-bold text-sm shadow-sm cursor-pointer transition disabled:opacity-60"
                >
                  {isSaving ? (
                    <SpinnerGap size={18} weight="bold" className="animate-spin" />
                  ) : (
                    <FloppyDisk size={18} weight="bold" />
                  )}
                  {isSaving ? 'Menyimpan...' : 'Simpan Jawaban'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* PANEL NAVIGASI LANJUT KE MENU AS LEARNING */}
      <div className="bg-[#1E3A5F] border-2 border-[#88D4AB] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white shadow-md">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#88D4AB] uppercase font-[var(--font-nav)]">
            Tahap Selanjutnya
          </p>
          <p className="text-sm text-white/90 mt-0.5">
            {isSubmitted || isCompleted
              ? 'Aktivitas Penerapan Konsep telah tuntas. Lanjutkan ke menu As Learning untuk refleksi akhir pertemuan.'
              : 'Simpan hasil aktivitas Penerapan Konsep terlebih dahulu untuk membuka menu As Learning.'}
          </p>
        </div>

        <button
          type="button"
          disabled={!isSubmitted && !isCompleted}
          onClick={onContinueNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#88D4AB] hover:opacity-95 text-[#1E3A5F] font-[var(--font-nav)] font-bold text-sm cursor-pointer transition disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
        >
          Selesai &amp; Lanjut ke As Learning
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
};
