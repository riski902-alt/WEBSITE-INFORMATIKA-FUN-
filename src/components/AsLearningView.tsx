import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowsClockwise,
  BookOpenText,
  Books,
  CheckCircle,
  FloppyDisk,
  NotePencil,
  PencilSimple,
  Sparkle,
  SpinnerGap,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { MateriCatalog, UserSession } from '../types/learning';
import { countCompletedMenus, loadMeetingProgress } from '../utils/firebaseSync';
import {
  DataPertemuanAsLearning,
  HasilValidasiAsLearning,
  PetaJawabanAsLearning,
  ambilApresiasiKontekstualAsLearning,
  ambilPertanyaanAsLearning,
  buatJawabanAwalAsLearning,
  ekstrakInfoKelasSemester,
  formatSapaanPenggunaAsLearning,
  gabungkanJawabanAsLearning,
  hapusDrafLokalAsLearning,
  hitungStatistikTeksRefleksi,
  langgananRefleksiAsLearning,
  muatDrafLokalAsLearning,
  periksaKelengkapanAsLearning,
  simpanDrafLokalAsLearning,
  simpanRefleksiAsLearningKeDatabase,
} from '../utils/komponen_as_learning.js';

interface AsLearningViewProps {
  session: UserSession;
  userKey: string;
  meetingId: string;
  materiCatalog: MateriCatalog;
  judulBab: string;
  judulPertemuan: string;
  isCompleted: boolean;
  onMarkCompleted: () => void;
  onSelectMeeting: (nextMeetingId: string) => void;
  onOpenBacaMateri: () => void;
}

const PANDUAN_REFLEKSI_PER_NOMOR: Record<number, { kategori: string; petunjuk: string }> = {
  1: {
    kategori: 'Pemahaman Konsep Inti',
    petunjuk:
      'Ceritakan dengan bahasamu sendiri poin utama yang paling kamu pahami dari aktivitas pertemuan ini.',
  },
  2: {
    kategori: 'Pengalaman & Perasaan Belajar',
    petunjuk:
      'Ungkapkan dengan jujur bagian yang terasa menyenangkan, berkesan, atau sempat menantang bagimu.',
  },
};

export const AsLearningView: React.FC<AsLearningViewProps> = ({
  session,
  userKey,
  meetingId,
  materiCatalog,
  judulBab,
  judulPertemuan,
  isCompleted,
  onMarkCompleted,
  onSelectMeeting,
  onOpenBacaMateri,
}) => {
  const [dataPertemuan, setDataPertemuan] =
    useState<DataPertemuanAsLearning | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [jawabanMap, setJawabanMap] = useState<PetaJawabanAsLearning>({});
  const [savedSnapshot, setSavedSnapshot] =
    useState<PetaJawabanAsLearning | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedAtText, setSavedAtText] = useState<string>('');
  const [syncedCloud, setSyncedCloud] = useState<boolean>(false);

  const [validasi, setValidasi] = useState<HasilValidasiAsLearning | null>(null);
  const [statusPesan, setStatusPesan] = useState<{
    tipe: 'idle' | 'success' | 'info' | 'error';
    teks: string;
  }>({ tipe: 'idle', teks: '' });

  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [shimmerRunId, setShimmerRunId] = useState<number>(1);
  const [confirmClearDraft, setConfirmClearDraft] = useState<boolean>(false);

  const [showDaftarMateri, setShowDaftarMateri] = useState<boolean>(false);
  const [selectedDaftarKelas, setSelectedDaftarKelas] = useState<
    'kelas7' | 'kelas8' | 'kelas9'
  >(() => {
    const match = meetingId.toLowerCase().match(/^(kelas[789])/);
    return (match?.[1] as 'kelas7' | 'kelas8' | 'kelas9') || 'kelas7';
  });

  const hydratedRef = useRef<string>('');
  const appreciationRef = useRef<HTMLDivElement | null>(null);

  const infoKelas = useMemo(
    () => ekstrakInfoKelasSemester(meetingId),
    [meetingId]
  );

  const sapaanPengguna = useMemo(
    () => formatSapaanPenggunaAsLearning(session),
    [session]
  );

  const apresiasi = useMemo(
    () =>
      ambilApresiasiKontekstualAsLearning(meetingId, judulBab, judulPertemuan),
    [meetingId, judulBab, judulPertemuan]
  );

  // Urutan pertemuan berikutnya dari katalog materi utama
  const infoPertemuanBerikutnya = useMemo(() => {
    const semuaId = Object.keys(materiCatalog);
    const idxSekarang = semuaId.indexOf(meetingId);
    if (idxSekarang === -1 || idxSekarang >= semuaId.length - 1) {
      return null;
    }
    const nextId = semuaId[idxSekarang + 1];
    const nextItem = materiCatalog[nextId];
    return {
      id: nextId,
      judulBab: nextItem?.judul_bab || '',
      judulPertemuan: nextItem?.judul_pertemuan || nextId,
    };
  }, [materiCatalog, meetingId]);

  // Pengelompokan daftar materi per Bab untuk panel Daftar Materi
  const daftarBabTerfilter = useMemo(() => {
    const semuaId = Object.keys(materiCatalog).filter((id) =>
      id.toLowerCase().startsWith(selectedDaftarKelas)
    );
    const mapBab = new Map<
      string,
      Array<{
        id: string;
        judulPertemuan: string;
        completedCount: number;
        totalMenus: number;
      }>
    >();

    semuaId.forEach((id) => {
      const item = materiCatalog[id];
      const namaBab = item?.judul_bab || 'Materi Pembelajaran';
      const prog = loadMeetingProgress(userKey, id);
      const { completedCount, totalMenus } = countCompletedMenus(prog);
      if (!mapBab.has(namaBab)) {
        mapBab.set(namaBab, []);
      }
      mapBab.get(namaBab)?.push({
        id,
        judulPertemuan: item?.judul_pertemuan || id,
        completedCount,
        totalMenus,
      });
    });

    return Array.from(mapBab.entries()).map(([namaBab, daftarPertemuan]) => ({
      namaBab,
      daftarPertemuan,
    }));
  }, [materiCatalog, selectedDaftarKelas, userKey, isCompleted, isSubmitted]);

  // Sinkronkan tab kelas pada panel daftar materi saat meetingId berganti
  useEffect(() => {
    const match = meetingId.toLowerCase().match(/^(kelas[789])/);
    if (match?.[1]) {
      setSelectedDaftarKelas(match[1] as 'kelas7' | 'kelas8' | 'kelas9');
    }
  }, [meetingId]);

  // 1. Muat pertanyaan refleksi sesuai meetingId aktif
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setValidasi(null);
    setStatusPesan({ tipe: 'idle', teks: '' });
    setIsCardFlipped(false);
    setConfirmClearDraft(false);
    setShowDaftarMateri(false);
    hydratedRef.current = '';

    ambilPertanyaanAsLearning(meetingId)
      .then((item) => {
        if (cancelled) return;
        if (!item || item.pertanyaan.length === 0) {
          setLoadError(
            `Pertanyaan refleksi AS Learning untuk pertemuan "${meetingId}" belum ditemukan.`
          );
          setDataPertemuan(null);
          setJawabanMap({});
          setSavedSnapshot(null);
          setIsSubmitted(false);
          setIsEditing(false);
          setIsLoading(false);
          return;
        }

        setDataPertemuan(item);

        const draf = muatDrafLokalAsLearning(userKey, meetingId);
        const awal = draf
          ? gabungkanJawabanAsLearning(item, draf)
          : buatJawabanAwalAsLearning(item);

        setJawabanMap(awal);
        setSavedSnapshot(null);
        setIsSubmitted(false);
        setIsEditing(false);
        setSavedAtText('');
        setSyncedCloud(false);
        hydratedRef.current = `${userKey}__${meetingId}`;
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Terjadi kendala saat memuat data refleksi AS Learning.'
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, userKey]);

  // 2. Langganan real-time jawaban tersimpan dari Firebase Firestore & cermin lokal
  useEffect(() => {
    if (!dataPertemuan) return;

    const unsubscribe = langgananRefleksiAsLearning(
      userKey,
      meetingId,
      dataPertemuan,
      (record) => {
        if (record && record.submitted) {
          setSavedSnapshot(record.jawaban);
          setJawabanMap((prev) => (isEditing ? prev : record.jawaban));
          setIsSubmitted(true);
          setSyncedCloud(Boolean(record.syncedFromCloud));

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
  }, [dataPertemuan, userKey, meetingId, isEditing]);

  // Pastikan status progres menu ke-7 sinkron bila jawaban sudah terkirim
  useEffect(() => {
    if (isSubmitted && !isCompleted) {
      onMarkCompleted();
    }
  }, [isSubmitted, isCompleted, onMarkCompleted]);

  // 3. Simpan draf otomatis ke localStorage saat siswa mengetik
  useEffect(() => {
    if (!dataPertemuan) return;
    if (hydratedRef.current !== `${userKey}__${meetingId}`) return;
    if (isSubmitted && !isEditing) return;

    simpanDrafLokalAsLearning(userKey, meetingId, jawabanMap);
  }, [jawabanMap, dataPertemuan, userKey, meetingId, isSubmitted, isEditing]);

  const handleUbahJawaban = (kunciField: string, nilaiBaru: string) => {
    setJawabanMap((prev) => ({
      ...prev,
      [kunciField]: nilaiBaru,
    }));
    if (validasi && !validasi.lengkap) {
      setValidasi(null);
    }
    if (statusPesan.tipe === 'error') {
      setStatusPesan({ tipe: 'idle', teks: '' });
    }
  };

  const handleKirimRefleksi = async () => {
    if (!dataPertemuan || isSaving) return;

    const hasilCek = periksaKelengkapanAsLearning(dataPertemuan, jawabanMap);
    setValidasi(hasilCek);

    if (!hasilCek.lengkap) {
      setStatusPesan({
        tipe: 'error',
        teks: hasilCek.pesan,
      });
      return;
    }

    setIsSaving(true);
    setStatusPesan({ tipe: 'idle', teks: '' });

    try {
      const hasilSimpan = await simpanRefleksiAsLearningKeDatabase({
        session,
        userKey,
        meetingId,
        judulBab,
        judulPertemuan,
        dataPertemuan,
        jawabanMap,
      });

      setJawabanMap(hasilSimpan.jawabanTersimpan);
      setSavedSnapshot(hasilSimpan.jawabanTersimpan);
      setIsSubmitted(true);
      setIsEditing(false);
      setIsCardFlipped(false);
      setShimmerRunId((n) => n + 1);
      setSyncedCloud(hasilSimpan.syncedToCloud);

      try {
        const dt = new Date(hasilSimpan.savedAtIso);
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

      onMarkCompleted();

      setStatusPesan({
        tipe: hasilSimpan.warningMessage ? 'info' : 'success',
        teks:
          hasilSimpan.warningMessage ||
          'Refleksi belajarmu berhasil disimpan secara real-time! Selamat menyelesaikan seluruh rangkaian pertemuan ini.',
      });

      window.setTimeout(() => {
        appreciationRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 120);
    } catch (err) {
      setStatusPesan({
        tipe: 'error',
        teks:
          err instanceof Error
            ? err.message
            : 'Gagal menyimpan refleksi. Silakan coba kembali.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMulaiEdit = () => {
    setIsEditing(true);
    setValidasi(null);
    setStatusPesan({
      tipe: 'info',
      teks: 'Mode penyuntingan aktif. Perbarui jawaban refleksimu lalu klik Simpan Perubahan Refleksi.',
    });
  };

  const handleBatalEdit = () => {
    if (savedSnapshot) {
      setJawabanMap(savedSnapshot);
    }
    setIsEditing(false);
    setValidasi(null);
    setStatusPesan({ tipe: 'idle', teks: '' });
  };

  const handleResetDraf = () => {
    if (!dataPertemuan) return;
    const kosong = buatJawabanAwalAsLearning(dataPertemuan);
    setJawabanMap(kosong);
    hapusDrafLokalAsLearning(userKey, meetingId);
    setConfirmClearDraft(false);
    setValidasi(null);
    setStatusPesan({
      tipe: 'info',
      teks: 'Draf jawaban telah dikosongkan. Silakan mulai menulis kembali refleksimu.',
    });
  };

  const adaIsiDraf = useMemo(() => {
    return Object.values(jawabanMap).some((v) => String(v || '').trim().length > 0);
  }, [jawabanMap]);

  if (isLoading) {
    return (
      <section className="max-w-5xl mx-auto bg-white rounded-2xl border border-[#DCEAF5] p-8 shadow-sm text-[#243B53]">
        <div className="flex items-center justify-center gap-3 py-10">
          <SpinnerGap
            size={26}
            weight="bold"
            className="text-[#527DA8] animate-spin"
          />
          <p className="font-[var(--font-nav)] font-semibold text-sm sm:text-base text-[#243B53]">
            Memuat ruang refleksi AS Learning untuk pertemuan ini...
          </p>
        </div>
      </section>
    );
  }

  if (loadError || !dataPertemuan) {
    return (
      <section className="max-w-5xl mx-auto bg-white rounded-2xl border border-[#E57373] p-6 sm:p-8 shadow-sm text-[#243B53]">
        <div className="flex items-start gap-3">
          <WarningCircle
            size={26}
            weight="fill"
            className="text-[#E57373] shrink-0 mt-0.5"
          />
          <div>
            <h2 className="text-lg font-bold text-[#1E3A5F] mb-1">
              Data Refleksi Tidak Dapat Dimuat
            </h2>
            <p className="text-sm text-[#4A5568]">
              {loadError || 'Data pertanyaan refleksi tidak tersedia.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const dalamModeBaca = isSubmitted && !isEditing;

  return (
    <section
      aria-labelledby="as-learning-heading"
      className="max-w-5xl mx-auto flex flex-col gap-6"
    >
      {/* 1. HEADER REFLEKSI PEMBELAJARAN */}
      <div className="bg-white rounded-2xl border border-[#DCEAF5] overflow-hidden shadow-sm">
        <div className="atp-header-gradient px-6 py-5 sm:px-8 sm:py-6 text-white">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-[var(--font-nav)] text-[#DCEAF5] mb-2">
            <span>{infoKelas.kelas}</span>
            <span aria-hidden="true">·</span>
            <span>{infoKelas.semester}</span>
            <span aria-hidden="true">·</span>
            <span>Tahap 7 dari 7 Menu</span>
            {isSubmitted && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#88D4AB] font-semibold">
                  Refleksi Tersimpan
                </span>
              </>
            )}
          </div>

          <h2
            id="as-learning-heading"
            className="text-xl sm:text-2xl font-bold tracking-tight text-white [text-wrap:balance]"
          >
            AS Learning — Refleksi Pembelajaran
          </h2>

          <p className="mt-1.5 text-sm text-[#DCEAF5]/95 max-w-3xl leading-relaxed">
            {judulBab} · {judulPertemuan}
          </p>
        </div>

        <div className="px-6 py-4 sm:px-8 sm:py-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <NotePencil
              size={22}
              weight="duotone"
              className="text-[#527DA8] shrink-0 mt-0.5"
            />
            <p className="text-sm text-[#334E68] leading-relaxed max-w-3xl">
              Luangkan waktu sejenak untuk menengok kembali perjalanan belajarmu
              hari ini. Tidak ada penilaian benar atau salah pada ruang
              refleksi—tuliskan pemahaman dan perasaanmu secara jujur menggunakan
              bahasamu sendiri.
            </p>
          </div>

          {dalamModeBaca && (
            <button
              type="button"
              onClick={handleMulaiEdit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#527DA8] bg-white hover:bg-[#F0F6FC] text-[#1E3A5F] text-xs sm:text-sm font-[var(--font-nav)] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#527DA8]"
            >
              <PencilSimple size={17} weight="bold" />
              Edit Jawaban
            </button>
          )}
        </div>
      </div>

      {/* 2. KARTU PERTANYAAN REFLEKSI & AREA JAWABAN SISWA */}
      <div className="bg-white rounded-2xl border border-[#DCEAF5] p-6 sm:p-8 shadow-sm flex flex-col gap-7">
        {dataPertemuan.pertanyaan.map((butir, index) => {
          const nilaiJawaban = jawabanMap[butir.kunciField] || '';
          const statistik = hitungStatistikTeksRefleksi(nilaiJawaban);
          const panduan = PANDUAN_REFLEKSI_PER_NOMOR[butir.nomor] || {
            kategori: `Refleksi Bagian ${butir.nomor}`,
            petunjuk:
              'Tuliskan pendapat, pemahaman, atau pengalaman belajarmu secara jelas dan jujur.',
          };
          const belumLengkap =
            validasi !== null &&
            !validasi.lengkap &&
            validasi.nomorBelumLengkap.includes(butir.nomor);

          const nomorFormat = String(butir.nomor).padStart(2, '0');
          const inputId = `input-refleksi-${butir.id}`;

          return (
            <div
              key={butir.id}
              className={`${
                index > 0 ? 'pt-7 border-t border-[#E2E8F0]' : ''
              } flex flex-col gap-3.5`}
            >
              {/* Baris Nomor & Kategori Refleksi Tanpa Kapsul Statis */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-[var(--font-nav)] text-[#527DA8]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1E3A5F] tabular-nums">
                    Pertanyaan {nomorFormat}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-[#527DA8]">
                    {panduan.kategori}
                  </span>
                </div>

                <div className="text-[#627D98] tabular-nums">
                  <span>{statistik.jumlahKata} kata</span>
                  <span aria-hidden="true" className="mx-1.5">
                    ·
                  </span>
                  <span>{statistik.jumlahKarakter} karakter</span>
                </div>
              </div>

              {/* Kalimat Pertanyaan Refleksi Asli Utuh */}
              <label
                htmlFor={inputId}
                className="text-base sm:text-[1.06rem] font-bold text-[#1E3A5F] leading-relaxed block"
              >
                {butir.nomor}. {butir.teks}
              </label>

              {dalamModeBaca ? (
                <div className="rounded-xl border border-[#DCEAF5] bg-[#F8FAFC] px-5 py-4 text-[15px] text-[#243B53] leading-[1.7] whitespace-pre-wrap break-words">
                  {nilaiJawaban}
                </div>
              ) : (
                <>
                  <textarea
                    id={inputId}
                    rows={4}
                    value={nilaiJawaban}
                    onChange={(e) =>
                      handleUbahJawaban(butir.kunciField, e.target.value)
                    }
                    placeholder="Ketik jawaban refleksimu di sini dengan santai dan jujur..."
                    className={`w-full min-h-[136px] rounded-xl px-4 py-3.5 text-[15px] leading-[1.65] text-[#1E3A5F] placeholder:text-[#829AB1] bg-[#F8FAFC] focus:bg-white border transition-colors resize-y focus:outline-none focus:ring-2 ${
                      belumLengkap
                        ? 'border-[#E57373] focus:border-[#E57373] focus:ring-[#E57373]/25'
                        : 'border-[#CBD5E1] focus:border-[#527DA8] focus:ring-[#527DA8]/25'
                    }`}
                  />

                  <p
                    className={`text-xs leading-relaxed ${
                      belumLengkap
                        ? 'text-[#C53030] font-medium'
                        : 'text-[#627D98]'
                    }`}
                  >
                    {belumLengkap
                      ? 'Jawaban pada nomor ini masih kosong atau terlalu singkat. Tuliskan minimal satu kalimat refleksimu.'
                      : panduan.petunjuk}
                  </p>
                </>
              )}
            </div>
          );
        })}

        {/* Pesan Umpan Balik / Validasi Inline */}
        {statusPesan.tipe !== 'idle' && statusPesan.teks && (
          <div
            role="status"
            className={`rounded-xl px-4 py-3 border text-sm flex items-start gap-2.5 ${
              statusPesan.tipe === 'error'
                ? 'bg-[#FFF5F5] border-[#FEB2B2] text-[#9B2C2C]'
                : statusPesan.tipe === 'success'
                  ? 'bg-[#F0FDF4] border-[#88D4AB] text-[#1E3A5F]'
                  : 'bg-[#F0F6FC] border-[#B5C2D0] text-[#243B53]'
            }`}
          >
            {statusPesan.tipe === 'error' ? (
              <WarningCircle
                size={19}
                weight="fill"
                className="text-[#E53E3E] shrink-0 mt-0.5"
              />
            ) : (
              <CheckCircle
                size={19}
                weight="fill"
                className="text-[#2F855A] shrink-0 mt-0.5"
              />
            )}
            <span className="leading-relaxed">{statusPesan.teks}</span>
          </div>
        )}

        {/* Baris Aksi Pengiriman / Penyimpanan Refleksi */}
        <div className="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-[#627D98] font-[var(--font-nav)]">
            {dalamModeBaca ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[#1E3A5F] font-semibold">
                  Jawaban refleksi telah tersimpan
                </span>
                {savedAtText && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{savedAtText}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>
                  {syncedCloud
                    ? 'Tersinkronisasi ke Cloud Firestore'
                    : 'Tersimpan pada akun perangkat'}
                </span>
              </div>
            ) : (
              <span>
                Draf ketikanmu tersimpan otomatis sebelum kamu menekan tombol
                kirim.
              </span>
            )}
          </div>

          {!dalamModeBaca && (
            <div className="flex flex-wrap items-center gap-3">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleBatalEdit}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#334E68] text-sm font-[var(--font-nav)] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  Batal Edit
                </button>
              ) : adaIsiDraf ? (
                confirmClearDraft ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetDraf}
                      className="px-3.5 py-2 rounded-lg bg-[#E57373] hover:opacity-90 text-white text-xs font-[var(--font-nav)] font-bold transition-opacity cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Ya, Kosongkan
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearDraft(false)}
                      className="px-3.5 py-2 rounded-lg border border-[#CBD5E1] bg-white text-[#334E68] text-xs font-[var(--font-nav)] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearDraft(true)}
                    className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#486581] text-sm font-[var(--font-nav)] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Kosongkan Draf
                  </button>
                )
              ) : null}

              <button
                type="button"
                onClick={handleKirimRefleksi}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#152C5B] text-white text-sm font-[var(--font-nav)] font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F]"
              >
                {isSaving ? (
                  <>
                    <SpinnerGap size={18} weight="bold" className="animate-spin" />
                    Menyimpan Refleksi...
                  </>
                ) : isEditing ? (
                  <>
                    <FloppyDisk size={18} weight="bold" />
                    Simpan Perubahan Refleksi
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} weight="bold" className="text-[#88D4AB]" />
                    Selesai dan Kirim Refleksi
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. KARTU APRESIASI INTERAKTIF 3D FLIP & MOTIVASI KONTEKSTUAL */}
      {isSubmitted && (
        <div ref={appreciationRef} className="flex flex-col gap-5">
          <div className="asl-perspective">
            <div
              className={`asl-flip-inner ${isCardFlipped ? 'is-flipped' : ''}`}
            >
              {/* SISI DEPAN: SAPAAN NAMA PENGGUNA DINAMIS & KALIMAT MOTIVASI TOPIK */}
              <div className="asl-flip-face asl-flip-front relative overflow-hidden rounded-2xl bg-[#1E3A5F] border-2 border-[#88D4AB] p-6 sm:p-8 shadow-lg text-white flex flex-col justify-between gap-6">
                <div
                  key={`sheen-front-${shimmerRunId}`}
                  aria-hidden="true"
                  className="asl-shimmer-sheen pointer-events-none absolute inset-0"
                />

                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-[var(--font-nav)] text-[#88D4AB]">
                      <Sparkle
                        size={16}
                        weight="fill"
                        className="asl-twinkle-icon text-[#D8BD7B] shrink-0"
                      />
                      <span>Apresiasi Refleksi Pertemuan</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums text-[#DCEAF5]">
                        Ketuntasan 100%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCardFlipped(true)}
                      aria-pressed={isCardFlipped}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#152C5B] hover:bg-[#23436b] border border-[#88D4AB]/70 text-[#88D4AB] text-xs font-[var(--font-nav)] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#88D4AB]"
                    >
                      <ArrowsClockwise size={16} weight="bold" />
                      Balik Kartu: Pantun Edukatif
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#88D4AB] [text-wrap:balance]">
                      {sapaanPengguna}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm font-[var(--font-nav)] text-[#D8BD7B]">
                      Topik Refleksi: {apresiasi.topikSingkat}
                    </p>
                  </div>

                  <p className="text-sm sm:text-base text-white/95 leading-relaxed max-w-3xl">
                    {apresiasi.kalimatMotivasi}
                  </p>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-[#DCEAF5] leading-relaxed">
                    <strong className="text-[#88D4AB] font-semibold">
                      Langkah Kecil Hari Ini:
                    </strong>{' '}
                    {apresiasi.pesanPenerapan}
                  </p>

                  <span className="text-xs font-[var(--font-nav)] text-[#B5C2D0] whitespace-nowrap shrink-0 tabular-nums">
                    Sisi 1 / 2 · Pesan Motivasi
                  </span>
                </div>
              </div>

              {/* SISI BELAKANG: PANTUN EDUKATIF 4 BARIS SESUAI TOPIK PERTEMUAN */}
              <div className="asl-flip-face asl-flip-back relative overflow-hidden rounded-2xl bg-[#243B53] border-2 border-[#D8BD7B] p-6 sm:p-8 shadow-lg text-white flex flex-col justify-between gap-6">
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-[var(--font-nav)] text-[#D8BD7B]">
                      <Sparkle
                        size={16}
                        weight="fill"
                        className="asl-twinkle-icon text-[#88D4AB] shrink-0"
                      />
                      <span>Pantun Edukatif Informatika</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#DCEAF5]">
                        {apresiasi.topikSingkat}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCardFlipped(false)}
                      aria-pressed={isCardFlipped}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#152C5B] hover:bg-[#1E3A5F] border border-[#D8BD7B]/80 text-[#D8BD7B] text-xs font-[var(--font-nav)] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8BD7B]"
                    >
                      <ArrowsClockwise size={16} weight="bold" />
                      Balik ke Pesan Motivasi
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white [text-wrap:balance]">
                      Pantun Semangat untuk {session.nama.trim() || 'Sobat Informatika'}
                    </h3>
                  </div>

                  <div className="rounded-xl bg-[#152C5B]/85 border border-white/15 px-5 py-4 sm:px-6 sm:py-5 max-w-2xl">
                    <div className="grid grid-cols-1 gap-1.5 text-sm sm:text-base leading-relaxed">
                      {apresiasi.pantun.map((baris, idxBaris) => (
                        <p
                          key={idxBaris}
                          className={
                            idxBaris < 2
                              ? 'text-[#DCEAF5] italic'
                              : 'text-[#88D4AB] font-semibold'
                          }
                        >
                          {baris}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-[#DCEAF5]">
                    Teruslah bertumbuh menjadi pelajar Informatika yang kritis,
                    kreatif, dan bijak berteknologi!
                  </p>

                  <span className="text-xs font-[var(--font-nav)] text-[#D8BD7B] whitespace-nowrap shrink-0 tabular-nums">
                    Sisi 2 / 2 · Pantun Topik
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. NAVIGASI PENUTUP PERTEMUAN: PERTEMUAN BERIKUTNYA & DAFTAR MATERI */}
          <div className="bg-white rounded-2xl border border-[#DCEAF5] p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-[#1E3A5F]">
                  Langkah Belajar Selanjutnya
                </h4>
                <p className="text-xs sm:text-sm text-[#486581] mt-0.5">
                  {infoPertemuanBerikutnya
                    ? `Berikutnya: ${infoPertemuanBerikutnya.judulBab} — ${infoPertemuanBerikutnya.judulPertemuan}`
                    : 'Selamat! Kamu berada di pertemuan puncak kurikulum Kelas 9. Jelajahi daftar materi untuk meninjau bab mana saja.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDaftarMateri((prev) => !prev)}
                  aria-expanded={showDaftarMateri}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#527DA8] bg-white hover:bg-[#F0F6FC] text-[#1E3A5F] text-sm font-[var(--font-nav)] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Books size={18} weight="bold" className="text-[#527DA8]" />
                  {showDaftarMateri ? 'Tutup Daftar Materi' : 'Daftar Materi'}
                </button>

                {infoPertemuanBerikutnya && (
                  <button
                    type="button"
                    onClick={() => onSelectMeeting(infoPertemuanBerikutnya.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#88D4AB] hover:bg-[#76c79b] text-[#1E3A5F] text-sm font-[var(--font-nav)] font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Pertemuan Berikutnya
                    <ArrowRight size={18} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            {/* PANEL INTERAKTIF DAFTAR MATERI SELURUH KELAS & PERTEMUAN */}
            {showDaftarMateri && (
              <div className="pt-4 border-t border-[#E2E8F0] flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Tab Filter Kelas Interaktif */}
                  <div
                    role="tablist"
                    aria-label="Pilih Kelas pada Daftar Materi"
                    className="inline-flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-xl"
                  >
                    {(
                      [
                        { id: 'kelas7', label: 'Kelas 7' },
                        { id: 'kelas8', label: 'Kelas 8' },
                        { id: 'kelas9', label: 'Kelas 9' },
                      ] as const
                    ).map((tab) => {
                      const active = selectedDaftarKelas === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setSelectedDaftarKelas(tab.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-[var(--font-nav)] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-[#1E3A5F] text-white shadow-xs'
                              : 'text-[#486581] hover:text-[#1E3A5F]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onOpenBacaMateri}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] hover:bg-[#F8FAFC] text-xs font-[var(--font-nav)] font-semibold text-[#243B53] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <BookOpenText size={16} weight="bold" />
                      Ringkasan Pertemuan Ini
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDaftarMateri(false)}
                      aria-label="Tutup panel daftar materi"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#486581] cursor-pointer"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto pr-1 flex flex-col gap-4">
                  {daftarBabTerfilter.map((grup) => (
                    <div
                      key={grup.namaBab}
                      className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col gap-2.5"
                    >
                      <h5 className="text-sm font-bold text-[#1E3A5F]">
                        {grup.namaBab}
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {grup.daftarPertemuan.map((ptm) => {
                          const sedangAktif = ptm.id === meetingId;
                          const selesaiPenuh =
                            ptm.completedCount === ptm.totalMenus;

                          return (
                            <button
                              key={ptm.id}
                              type="button"
                              onClick={() => {
                                setShowDaftarMateri(false);
                                onSelectMeeting(ptm.id);
                              }}
                              className={`text-left rounded-lg border px-3.5 py-2.5 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                                sedangAktif
                                  ? 'bg-[#1E3A5F] border-[#1E3A5F] text-white'
                                  : 'bg-white border-[#E2E8F0] hover:border-[#527DA8] text-[#243B53]'
                              }`}
                            >
                              <span className="text-xs font-[var(--font-nav)] font-semibold leading-snug line-clamp-2">
                                {ptm.judulPertemuan}
                              </span>

                              <span
                                className={`text-[11px] font-[var(--font-nav)] tabular-nums whitespace-nowrap shrink-0 ${
                                  sedangAktif
                                    ? 'text-[#88D4AB] font-bold'
                                    : selesaiPenuh
                                      ? 'text-[#2F855A] font-bold'
                                      : 'text-[#627D98]'
                                }`}
                              >
                                {ptm.completedCount}/{ptm.totalMenus}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
