import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { firebaseDb } from './firebaseClient';
import { parseJsonTolerant } from './komponen-asesmenawal';

const KOLEKSI_PENERAPAN_KONSEP = 'penerapan_konsep_jawaban';
let cachedPenerapanMap = null;

/**
 * Menormalkan ID pertemuan agar selaras dengan katalog materi.json
 * (termasuk kapitalisasi Kelas -> kelas dan pemetaan Kelas9-sem2-bab1-* -> kelas9-sem2-bab3-*).
 */
export function normalisasiIdPertemuanPenerapan(rawId) {
  if (!rawId) return '';
  const lower = String(rawId).trim().toLowerCase();
  if (lower.startsWith('kelas9-sem2-bab1-')) {
    return lower.replace('kelas9-sem2-bab1-', 'kelas9-sem2-bab3-');
  }
  return lower;
}

/**
 * Menentukan daftar format file yang diterima berdasarkan properti sumber
 * tanpa mengubah isi data asli dari penerapan_konsep.json.
 */
function tentukanFormatDiterima(komponen) {
  if (Array.isArray(komponen.format_diterima) && komponen.format_diterima.length > 0) {
    const setFormat = new Set(
      komponen.format_diterima.map((ext) => String(ext).trim().toLowerCase())
    );
    if (setFormat.has('.jpg')) {
      setFormat.add('.jpeg');
    }
    return Array.from(setFormat);
  }

  const tipe = String(komponen.tipe || '').toLowerCase();
  const label = String(komponen.label || '').toLowerCase();

  if (tipe === 'unggah_gambar') {
    return ['.jpg', '.jpeg', '.png', '.webp'];
  }
  if (label.includes('.sb3')) {
    return ['.sb3', '.zip'];
  }
  if (label.includes('gambar/pdf')) {
    return ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  }
  if (tipe === 'unggah_file_atau_teks') {
    return ['.xls', '.xlsx', '.csv', '.pdf', '.jpg', '.jpeg', '.png'];
  }
  if (tipe === 'teks_dan_unggah') {
    return ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  }
  return ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx', '.pptx', '.zip'];
}

/**
 * Mengelompokkan 21 varian tipe komponen_jawaban menjadi mode interaksi antarmuka yang presisi.
 */
function tentukanModeInteraksi(tipe) {
  switch (tipe) {
    case 'tabel':
      return 'tabel_statis';
    case 'tabel_dinamis':
      return 'tabel_dinamis';
    case 'tabel_ceklis':
      return 'tabel_ceklis';
    case 'isian_evaluasi':
      return 'form_evaluasi';
    case 'pengelompokan':
      return 'pengelompokan';
    case 'teks_kode':
    case 'teks_kode_panjang':
      return 'editor_kode';
    case 'ceklis':
    case 'ceklis_praktik':
      return 'ceklis_praktik';
    case 'unggah_file_atau_teks':
      return 'unggah_atau_teks';
    case 'teks_dan_unggah':
      return 'teks_dan_unggah';
    case 'praktik':
    case 'praktik_observasi':
    case 'proyek':
    case 'proyek_terpadu':
    case 'unggah_gambar':
    case 'unggah_file':
      return 'unggah_berkas';
    case 'isian':
    case 'observasi':
    case 'teks_area':
    case 'teks_panjang':
    default:
      return 'editor_teks';
  }
}

/**
 * Memberikan label ramah siswa untuk jenis aktivitas sesuai tipe sumber.
 */
function buatLabelJenisAktivitas(tipe) {
  const kamus = {
    tabel: 'Tabel Analisis Terstruktur',
    tabel_dinamis: 'Perancangan Tabel Mandiri',
    tabel_ceklis: 'Matriks Ceklis Evaluasi',
    isian_evaluasi: 'Lembar Evaluasi Terpandu',
    pengelompokan: 'Klasifikasi Dua Kategori',
    teks_kode: 'Penyusunan Pseudocode',
    teks_kode_panjang: 'Dokumen Pseudocode Lengkap',
    isian: 'Isian Analisis Konsep',
    observasi: 'Refleksi Simulasi & Observasi',
    teks_area: 'Analisis Kasus & Uraian',
    teks_panjang: 'Laporan Investigasi Mandiri',
    ceklis: 'Verifikasi Praktik Mandiri',
    ceklis_praktik: 'Ceklis Pengamanan Sistem',
    praktik: 'Praktik Aplikasi & Unggah Karya',
    praktik_observasi: 'Praktik Presentasi & Observasi',
    proyek: 'Proyek Kreatif Digital',
    proyek_terpadu: 'Proyek Integrasi Terpadu',
    unggah_gambar: 'Visualisasi & Dokumentasi Gambar',
    unggah_file: 'Pengumpulan Berkas Proyek',
    unggah_file_atau_teks: 'Pemodelan Data (Teks / Berkas)',
    teks_dan_unggah: 'Rangkaian Teks & Bukti Visual',
  };
  return kamus[tipe] || 'Aktivitas Penerapan Konsep';
}

/**
 * Menyusun langkah petunjuk pengerjaan berbentuk kalimat perintah yang komunikatif
 * bagi siswa SMP berdasarkan spesifikasi komponen_jawaban pertemuan.
 */
function susunLangkahPengerjaan(petunjukSumber, komponen, modeInteraksi, formatDiterima) {
  const langkah = [
    'Bacalah permasalahan dan konteks aktivitas pada bagian Soal & Permasalahan secara cermat.',
  ];

  if (modeInteraksi === 'tabel_statis') {
    const daftarKolom = (komponen.kolom || []).join(', ');
    langkah.push(
      `Isilah setiap baris pada tabel kerja sesuai kolom yang tersedia (${daftarKolom}). Gunakan tombol Tambah Baris jika ingin menambahkan contoh atau temuan lainnya.`
    );
  } else if (modeInteraksi === 'tabel_dinamis') {
    langkah.push(
      komponen.instruksi_antarmuka ||
        'Susun judul atribut kolom pada bagian kepala tabel, lalu tambahkan baris dan kolom sesuai struktur data yang dibutuhkan.'
    );
  } else if (modeInteraksi === 'tabel_ceklis') {
    langkah.push(
      'Berikan tanda centang pada artikel yang memenuhi setiap indikator, tuliskan alasan penilaianmu, lalu pilih kesimpulan akhir.'
    );
  } else if (modeInteraksi === 'form_evaluasi') {
    const daftarIsian = (komponen.kolom_isian || []).join(', ');
    langkah.push(
      `Lengkapi seluruh kolom evaluasi (${daftarIsian}) berdasarkan hasil penelusuran dan pemeriksaanmu.`
    );
  } else if (modeInteraksi === 'pengelompokan') {
    const daftarKat = (komponen.kategori || []).join(' atau ');
    langkah.push(
      `Masukkan kutipan pernyataan yang kamu temukan, pilih kategorinya (${daftarKat}), lalu tambahkan ke papan pengelompokan.`
    );
  } else if (modeInteraksi === 'editor_kode') {
    langkah.push(
      'Susun algoritma dalam bentuk baris-baris pseudocode yang runtut dan jelas. Kamu dapat memakai tombol kata kunci cepat di atas editor.'
    );
  } else if (modeInteraksi === 'ceklis_praktik') {
    langkah.push(
      'Lakukan tahapan praktik sesuai instruksi aktivitas, tandai daftar pemeriksaan setelah selesai dipraktikkan, lalu tuliskan ringkasan singkat hasil praktikmu.'
    );
  } else if (modeInteraksi === 'unggah_atau_teks') {
    langkah.push(
      `Ketikkan struktur tabel dan daftar pada kolom kerja ATAU unggah berkas lembar kerjamu (${formatDiterima.join(', ')}).`
    );
  } else if (modeInteraksi === 'teks_dan_unggah') {
    langkah.push(
      `Tuliskan uraian yang diminta pada kolom teks sekaligus unggah berkas bukti karyamu (${formatDiterima.join(', ')}).`
    );
  } else if (modeInteraksi === 'unggah_berkas') {
    langkah.push(
      `Kerjakan praktik sesuai permasalahan pertemuan ini, simpan hasilnya, lalu pilih dan unggah berkas karyamu dalam format ${formatDiterima.join(', ')}.`
    );
  } else {
    langkah.push(
      'Tuliskan hasil pengamatan, perbandingan, atau analisis kasusmu menggunakan kalimat yang jelas dan sistematis pada area jawaban.'
    );
  }

  langkah.push(
    'Klik Periksa Jawaban untuk memastikan seluruh bagian sudah lengkap, kemudian klik Simpan Jawaban untuk merekam hasil kerjamu.'
  );

  // Ekstrak butir praktik spesifik dari kalimat petunjuk untuk tipe ceklis
  const butirPraktik = [];
  if (modeInteraksi === 'ceklis_praktik') {
    const potongan = String(petunjukSumber || '')
      .replace(/^Siswa\s+/i, '')
      .split(/,\s*(?:lalu|serta|kemudian|dan)\s+|\s+(?:lalu|serta|kemudian)\s+/i)
      .map((s) => s.trim().replace(/\.$/, ''))
      .filter((s) => s.length > 8);
    potongan.forEach((p) => {
      const kalimat = p.charAt(0).toUpperCase() + p.slice(1) + '.';
      butirPraktik.push(kalimat);
    });
  }

  return { langkah, butirPraktik };
}

/**
 * Membuat struktur state jawaban kosong yang sesuai dengan karakteristik aktivitas pertemuan.
 */
export function buatJawabanAwalPenerapan(aktivitasItem) {
  const kj = aktivitasItem?.komponenJawaban || {};
  const mode = aktivitasItem?.modeInteraksi || 'editor_teks';

  const kolomStatis = Array.isArray(kj.kolom) && kj.kolom.length > 0 ? kj.kolom : ['Item', 'Keterangan'];
  const kolomDinamisAwal = ['Nama', 'Umur', 'Hobi'];
  const barisIndikator = Array.isArray(kj.baris) && kj.baris.length > 0 ? kj.baris : ['Akurasi', 'Relevansi', 'Keaktualan'];
  const kolomIsian = Array.isArray(kj.kolom_isian) ? kj.kolom_isian : [];

  const isianEvaluasi = {};
  kolomIsian.forEach((nama) => {
    isianEvaluasi[nama] = '';
  });

  return {
    kolomDinamis: mode === 'tabel_dinamis' ? [...kolomDinamisAwal] : [...kolomStatis],
    barisTabel:
      mode === 'tabel_dinamis'
        ? [
            { sel: ['', '', ''] },
            { sel: ['', '', ''] },
            { sel: ['', '', ''] },
          ]
        : [
            { sel: kolomStatis.map(() => '') },
            { sel: kolomStatis.map(() => '') },
            { sel: kolomStatis.map(() => '') },
          ],
    barisCeklis: barisIndikator.map((ind) => ({
      indikator: ind,
      opsi1: false,
      opsi2: false,
      alasan: '',
    })),
    pilihanKesimpulan: '',
    isianEvaluasi,
    itemPengelompokan: [],
    teksJawaban: '',
    ceklisUtama: false,
    langkahTercentang: [],
    catatanPendukung: '',
    berkas: null,
  };
}

/**
 * Menggabungkan data tersimpan/draf ke struktur jawaban standar agar aman dari field undefined.
 */
export function gabungkanJawabanPenerapan(aktivitasItem, tersimpan) {
  const dasar = buatJawabanAwalPenerapan(aktivitasItem);
  if (!tersimpan || typeof tersimpan !== 'object') {
    return dasar;
  }

  const hasil = { ...dasar };

  if (Array.isArray(tersimpan.kolomDinamis) && tersimpan.kolomDinamis.length > 0) {
    hasil.kolomDinamis = tersimpan.kolomDinamis.map((k) => String(k ?? ''));
  }

  const targetJumlahKolom =
    aktivitasItem?.modeInteraksi === 'tabel_dinamis'
      ? hasil.kolomDinamis.length
      : (aktivitasItem?.komponenJawaban?.kolom || hasil.kolomDinamis).length;

  if (Array.isArray(tersimpan.barisTabel) && tersimpan.barisTabel.length > 0) {
    hasil.barisTabel = tersimpan.barisTabel.map((row) => {
      const rawCells = Array.isArray(row?.sel)
        ? row.sel
        : Array.isArray(row)
          ? row
          : [];
      const sel = Array.from({ length: targetJumlahKolom }, (_, idx) =>
        String(rawCells[idx] ?? '')
      );
      return { sel };
    });
  }

  if (Array.isArray(tersimpan.barisCeklis) && tersimpan.barisCeklis.length > 0) {
    hasil.barisCeklis = dasar.barisCeklis.map((defRow, idx) => {
      const match =
        tersimpan.barisCeklis.find((r) => r?.indikator === defRow.indikator) ||
        tersimpan.barisCeklis[idx];
      if (!match) return defRow;
      return {
        indikator: defRow.indikator,
        opsi1: Boolean(match.opsi1),
        opsi2: Boolean(match.opsi2),
        alasan: String(match.alasan ?? ''),
      };
    });
  }

  if (typeof tersimpan.pilihanKesimpulan === 'string') {
    hasil.pilihanKesimpulan = tersimpan.pilihanKesimpulan;
  }

  if (tersimpan.isianEvaluasi && typeof tersimpan.isianEvaluasi === 'object') {
    const mergedEval = { ...dasar.isianEvaluasi };
    Object.keys(mergedEval).forEach((k) => {
      if (typeof tersimpan.isianEvaluasi[k] === 'string') {
        mergedEval[k] = tersimpan.isianEvaluasi[k];
      }
    });
    hasil.isianEvaluasi = mergedEval;
  }

  if (Array.isArray(tersimpan.itemPengelompokan)) {
    hasil.itemPengelompokan = tersimpan.itemPengelompokan
      .filter((it) => it && typeof it.teks === 'string' && it.teks.trim())
      .map((it, idx) => ({
        id: String(it.id || `item-${idx + 1}`),
        teks: String(it.teks),
        kategori: String(it.kategori || ''),
      }));
  }

  if (typeof tersimpan.teksJawaban === 'string') {
    hasil.teksJawaban = tersimpan.teksJawaban;
  }
  if (typeof tersimpan.ceklisUtama === 'boolean') {
    hasil.ceklisUtama = tersimpan.ceklisUtama;
  }
  if (Array.isArray(tersimpan.langkahTercentang)) {
    hasil.langkahTercentang = tersimpan.langkahTercentang
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n));
  }
  if (typeof tersimpan.catatanPendukung === 'string') {
    hasil.catatanPendukung = tersimpan.catatanPendukung;
  }
  if (tersimpan.berkas && typeof tersimpan.berkas === 'object' && tersimpan.berkas.namaFile) {
    hasil.berkas = {
      namaFile: String(tersimpan.berkas.namaFile),
      ukuranBytes: Number(tersimpan.berkas.ukuranBytes || 0),
      tipeMime: String(tersimpan.berkas.tipeMime || 'application/octet-stream'),
      ekstensi: String(tersimpan.berkas.ekstensi || ''),
      pratinjauDataUrl: String(tersimpan.berkas.pratinjauDataUrl || ''),
      diunggahPada: String(tersimpan.berkas.diunggahPada || ''),
    };
  }

  return hasil;
}

/**
 * Memuat seluruh katalog penerapan_konsep.json satu kali dan menyimpannya di memori.
 */
export async function muatKatalogPenerapanKonsep() {
  if (cachedPenerapanMap) {
    return cachedPenerapanMap;
  }

  const baseUrl =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
      ? import.meta.env.BASE_URL
      : './';

  const res = await fetch(`${baseUrl}penerapan_konsep.json`);
  if (!res.ok) {
    throw new Error(`Gagal memuat penerapan_konsep.json (Status ${res.status})`);
  }

  const rawText = await res.text();
  const parsed = parseJsonTolerant(rawText);
  const daftarMentah = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.penerapan_konsep)
      ? parsed.penerapan_konsep
      : [];

  const peta = {};

  daftarMentah.forEach((entry) => {
    const idAsli = String(entry?.id_aktivitas || '').trim();
    if (!idAsli || !entry?.aktivitas) return;

    const idKanonik = normalisasiIdPertemuanPenerapan(idAsli);
    const petunjuk = String(entry.aktivitas.petunjuk || '').trim();
    const komponenJawaban = entry.aktivitas.komponen_jawaban || { tipe: 'teks_area' };
    const tipe = String(komponenJawaban.tipe || 'teks_area').trim();
    const modeInteraksi = tentukanModeInteraksi(tipe);
    const formatDiterima = tentukanFormatDiterima(komponenJawaban);
    const { langkah, butirPraktik } = susunLangkahPengerjaan(
      petunjuk,
      komponenJawaban,
      modeInteraksi,
      formatDiterima
    );

    peta[idKanonik] = {
      idKanonik,
      idSumberAsli: idAsli,
      petunjuk,
      komponenJawaban,
      tipe,
      labelJenisAktivitas: buatLabelJenisAktivitas(tipe),
      modeInteraksi,
      formatDiterima,
      langkahPengerjaan: langkah,
      butirPraktik,
    };
  });

  cachedPenerapanMap = peta;
  return peta;
}

/**
 * Mengambil aktivitas Penerapan Konsep yang tepat sesuai ID pertemuan aktif.
 */
export async function ambilAktivitasPenerapanKonsep(meetingId) {
  if (!meetingId) return null;
  const peta = await muatKatalogPenerapanKonsep();
  const idKanonik = normalisasiIdPertemuanPenerapan(meetingId);
  return peta[idKanonik] || peta[String(meetingId).trim().toLowerCase()] || null;
}

/**
 * Memeriksa kelengkapan dan kesesuaian jawaban siswa sebelum/saat disimpan.
 */
export function periksaKelengkapanPenerapan(aktivitas, jawaban) {
  if (!aktivitas || !jawaban) {
    return {
      valid: false,
      pesan: 'Data aktivitas belum siap diperiksa.',
      rincian: [],
    };
  }

  const mode = aktivitas.modeInteraksi;
  const rincian = [];

  if (mode === 'tabel_statis') {
    const barisTerisiPenuh = (jawaban.barisTabel || []).filter((r) =>
      Array.isArray(r.sel) && r.sel.length > 0 && r.sel.every((c) => String(c).trim().length > 0)
    );
    const adaSelSebagian = (jawaban.barisTabel || []).some(
      (r) =>
        Array.isArray(r.sel) &&
        r.sel.some((c) => String(c).trim().length > 0) &&
        !r.sel.every((c) => String(c).trim().length > 0)
    );

    if (barisTerisiPenuh.length === 0) {
      rincian.push('Isi minimal satu baris tabel secara lengkap pada seluruh kolom yang tersedia.');
    }
    if (adaSelSebagian) {
      rincian.push('Masih terdapat baris tabel yang sebagian kolomnya belum terisi.');
    }

    return {
      valid: rincian.length === 0,
      pesan:
        rincian.length === 0
          ? `Tabel kerja sudah terisi rapi (${barisTerisiPenuh.length} baris lengkap) dan siap disimpan.`
          : rincian[0],
      rincian,
    };
  }

  if (mode === 'tabel_dinamis') {
    const kolomValid =
      Array.isArray(jawaban.kolomDinamis) &&
      jawaban.kolomDinamis.length >= 2 &&
      jawaban.kolomDinamis.every((k) => String(k).trim().length > 0);
    const barisLengkap = (jawaban.barisTabel || []).filter(
      (r) =>
        Array.isArray(r.sel) &&
        r.sel.length === jawaban.kolomDinamis.length &&
        r.sel.every((c) => String(c).trim().length > 0)
    );

    if (!kolomValid) {
      rincian.push('Pastikan minimal terdapat 2 judul atribut kolom dan seluruh nama kolom telah diisi.');
    }
    if (barisLengkap.length === 0) {
      rincian.push('Isi minimal satu baris data siswa secara lengkap sesuai atribut kolom yang kamu buat.');
    }

    return {
      valid: rincian.length === 0,
      pesan:
        rincian.length === 0
          ? `Struktur tabel mandiri (${jawaban.kolomDinamis.length} kolom, ${barisLengkap.length} baris data) sudah lengkap.`
          : rincian[0],
      rincian,
    };
  }

  if (mode === 'tabel_ceklis') {
    const semuaTerisi = (jawaban.barisCeklis || []).every(
      (r) => (r.opsi1 || r.opsi2) && String(r.alasan || '').trim().length >= 3
    );
    if (!semuaTerisi) {
      rincian.push(
        'Centang minimal salah satu artikel dan tuliskan alasan pada setiap baris indikator (Akurasi, Relevansi, Keaktualan).'
      );
    }
    return {
      valid: rincian.length === 0,
      pesan:
        rincian.length === 0
          ? 'Seluruh indikator ceklis dan alasan analisis sudah terisi lengkap.'
          : rincian[0],
      rincian,
    };
  }

  if (mode === 'form_evaluasi') {
    const kolomIsian = aktivitas.komponenJawaban?.kolom_isian || [];
    const kosong = kolomIsian.filter(
      (k) => !String(jawaban.isianEvaluasi?.[k] || '').trim()
    );
    if (kosong.length > 0) {
      rincian.push(`Lengkapi bagian berikut: ${kosong.join(', ')}.`);
    }
    return {
      valid: rincian.length === 0,
      pesan:
        rincian.length === 0
          ? 'Seluruh bagian evaluasi kredibilitas situs web sudah terisi lengkap.'
          : rincian[0],
      rincian,
    };
  }

  if (mode === 'pengelompokan') {
    const kategoriList = aktivitas.komponenJawaban?.kategori || ['Fakta', 'Opini'];
    const items = jawaban.itemPengelompokan || [];
    if (items.length < 2) {
      rincian.push('Tambahkan minimal 2 kutipan pernyataan untuk dikelompokkan.');
    } else {
      kategoriList.forEach((kat) => {
        const ada = items.some((it) => it.kategori === kat);
        if (!ada) {
          rincian.push(`Tambahkan minimal satu contoh pernyataan pada kategori "${kat}".`);
        }
      });
    }
    return {
      valid: rincian.length === 0,
      pesan:
        rincian.length === 0
          ? `Pengelompokan sudah memuat ${items.length} pernyataan pada kategori Fakta dan Opini.`
          : rincian[0],
      rincian,
    };
  }

  if (mode === 'editor_kode') {
    const kode = String(jawaban.teksJawaban || '').trim();
    const jumlahBaris = kode ? kode.split(/\r?\n/).filter((b) => b.trim()).length : 0;
    if (kode.length < 12 || jumlahBaris < 2) {
      rincian.push('Tuliskan minimal 2 baris instruksi pseudocode yang runtut pada editor kode.');
    }
    return {
      valid: rincian.length === 0,
      pesan:
        rincian.length === 0
          ? `Pseudocode terdiri dari ${jumlahBaris} baris instruksi aktif dan siap disimpan.`
          : rincian[0],
      rincian,
    };
  }

  if (mode === 'ceklis_praktik') {
    if (!jawaban.ceklisUtama) {
      rincian.push('Centang pernyataan konfirmasi bahwa kamu telah mempraktikkan langkah-langkah pada aktivitas ini.');
    }
    if (
      aktivitas.butirPraktik.length > 0 &&
      (jawaban.langkahTercentang || []).length < aktivitas.butirPraktik.length
    ) {
      rincian.push('Tandai seluruh tahapan praktik yang telah kamu selesaikan.');
    }
    return {
      valid: rincian.length === 0,
      pesan:
        rincian.length === 0
          ? 'Seluruh daftar verifikasi praktik telah ditandai lengkap.'
          : rincian[0],
      rincian,
    };
  }

  if (mode === 'unggah_berkas') {
    if (!jawaban.berkas || !jawaban.berkas.namaFile) {
      rincian.push(
        `Pilih berkas hasil kerjamu terlebih dahulu (${aktivitas.formatDiterima.join(', ')}).`
      );
    }
    return {
      valid: rincian.length === 0,
      pesan:
        rincian.length === 0
          ? `Berkas "${jawaban.berkas.namaFile}" siap disimpan.`
          : rincian[0],
      rincian,
    };
  }

  if (mode === 'unggah_atau_teks') {
    const adaTeks = String(jawaban.teksJawaban || '').trim().length >= 10;
    const adaBerkas = Boolean(jawaban.berkas && jawaban.berkas.namaFile);
    if (!adaTeks && !adaBerkas) {
      rincian.push('Ketikkan struktur tabel dan list pada kolom teks, atau unggah berkas lembar kerjamu.');
    }
    return {
      valid: rincian.length === 0,
      pesan:
        rincian.length === 0
          ? 'Hasil pemodelan data telah terisi dan siap disimpan.'
          : rincian[0],
      rincian,
    };
  }

  if (mode === 'teks_dan_unggah') {
    const adaTeks = String(jawaban.teksJawaban || '').trim().length >= 10;
    const adaBerkas = Boolean(jawaban.berkas && jawaban.berkas.namaFile);
    if (!adaTeks) {
      rincian.push('Tuliskan penjelasan/uraian teks pada kolom yang disediakan.');
    }
    if (!adaBerkas) {
      rincian.push(`Unggah berkas atau tangkapan layar pendukung (${aktivitas.formatDiterima.join(', ')}).`);
    }
    return {
      valid: rincian.length === 0,
      pesan:
        rincian.length === 0
          ? 'Uraian teks dan berkas pendukung sudah lengkap.'
          : rincian[0],
      rincian,
    };
  }

  // Default: editor_teks
  const teks = String(jawaban.teksJawaban || '').trim();
  if (teks.length < 15) {
    rincian.push('Tuliskan jawaban atau analisis yang lebih lengkap (minimal satu kalimat utuh).');
  }
  return {
    valid: rincian.length === 0,
    pesan:
      rincian.length === 0
        ? 'Uraian jawaban sudah terisi dengan baik dan siap disimpan.'
        : rincian[0],
    rincian,
  };
}

/**
 * Mengompres pratinjau gambar agar ringan (< 150 KB) sehingga aman disimpan ke Firestore & localStorage.
 */
function buatPratinjauGambarRingan(file) {
  return new Promise((resolve) => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrlAsli = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrlAsli) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const batasSisi = 800;
          let width = img.width || 600;
          let height = img.height || 400;
          if (width > batasSisi || height > batasSisi) {
            if (width >= height) {
              height = Math.round((height * batasSisi) / width);
              width = batasSisi;
            } else {
              width = Math.round((width * batasSisi) / height);
              height = batasSisi;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrlAsli.length <= 180000 ? dataUrlAsli : '');
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const hasilJpeg = canvas.toDataURL('image/jpeg', 0.72);
          resolve(hasilJpeg.length <= 220000 ? hasilJpeg : '');
        } catch {
          resolve(dataUrlAsli.length <= 180000 ? dataUrlAsli : '');
        }
      };
      img.onerror = () => resolve('');
      img.src = dataUrlAsli;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Memvalidasi ekstensi dan memproses berkas yang dipilih siswa.
 */
export async function prosesBerkasPenerapan(file, formatDiterima) {
  if (!file) {
    throw new Error('Tidak ada berkas yang dipilih.');
  }

  const namaFile = String(file.name || '').trim();
  const titikTerakhir = namaFile.lastIndexOf('.');
  const ekstensi = titikTerakhir >= 0 ? namaFile.slice(titikTerakhir).toLowerCase() : '';

  const daftarValid = Array.isArray(formatDiterima) && formatDiterima.length > 0
    ? formatDiterima.map((f) => f.toLowerCase())
    : [];

  if (daftarValid.length > 0 && !daftarValid.includes(ekstensi)) {
    throw new Error(
      `Format berkas "${ekstensi || 'tanpa ekstensi'}" tidak sesuai. Gunakan format: ${daftarValid.join(', ')}.`
    );
  }

  const maksUkuran = 25 * 1024 * 1024; // 25 MB
  if (file.size > maksUkuran) {
    throw new Error('Ukuran berkas melebihi batas maksimal 25 MB.');
  }

  const pratinjauDataUrl = await buatPratinjauGambarRingan(file);

  return {
    namaFile,
    ukuranBytes: Number(file.size || 0),
    tipeMime: String(file.type || 'application/octet-stream'),
    ekstensi,
    pratinjauDataUrl,
    diunggahPada: new Date().toISOString(),
  };
}

export function formatUkuranBerkas(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function buatIdDokumenSiswa(userKey, canonicalMeetingId) {
  const safeUser = String(userKey || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeMeeting = String(canonicalMeetingId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeUser}__${safeMeeting}`;
}

function buatKunciTersimpanLokal(userKey, canonicalMeetingId) {
  return `infoFun_PK_${userKey}_${canonicalMeetingId}`;
}

function buatKunciDrafLokal(userKey, canonicalMeetingId) {
  return `infoFun_DraftPK_${userKey}_${canonicalMeetingId}`;
}

/**
 * Menyimpan draf sementara secara otomatis agar jawaban tidak hilang saat siswa berpindah bagian.
 */
export function simpanDrafLokalPenerapan(userKey, meetingId, jawaban) {
  const canonical = normalisasiIdPertemuanPenerapan(meetingId);
  if (!userKey || !canonical || !jawaban) return;
  try {
    localStorage.setItem(
      buatKunciDrafLokal(userKey, canonical),
      JSON.stringify({
        jawaban,
        updatedAtIso: new Date().toISOString(),
      })
    );
  } catch {
    // Abaikan jika penyimpanan lokal penuh
  }
}

export function muatDrafLokalPenerapan(userKey, meetingId) {
  const canonical = normalisasiIdPertemuanPenerapan(meetingId);
  if (!userKey || !canonical) return null;
  try {
    const raw = localStorage.getItem(buatKunciDrafLokal(userKey, canonical));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.jawaban || null;
  } catch {
    return null;
  }
}

function hapusDrafLokalPenerapan(userKey, canonical) {
  try {
    localStorage.removeItem(buatKunciDrafLokal(userKey, canonical));
  } catch {
    // Abaikan
  }
}

/**
 * Menyimpan jawaban akhir Penerapan Konsep ke Firebase Firestore & penyimpanan lokal akun siswa.
 */
export async function simpanJawabanPenerapanKeDatabase({
  session,
  userKey,
  meetingId,
  judulBab,
  judulPertemuan,
  aktivitas,
  jawaban,
}) {
  const canonicalMeetingId = normalisasiIdPertemuanPenerapan(meetingId);
  const savedAtIso = new Date().toISOString();

  // Pastikan bebas dari nested array murni agar 100% kompatibel dengan Firestore
  const jawabanAman = gabungkanJawabanPenerapan(aktivitas, jawaban);

  const localRecord = {
    jawaban: jawabanAman,
    tipeAktivitas: aktivitas.tipe,
    modeInteraksi: aktivitas.modeInteraksi,
    submitted: true,
    savedAtIso,
  };

  try {
    localStorage.setItem(
      buatKunciTersimpanLokal(userKey, canonicalMeetingId),
      JSON.stringify(localRecord)
    );
    hapusDrafLokalPenerapan(userKey, canonicalMeetingId);
  } catch {
    // Abaikan jika kuota penyimpanan lokal penuh
  }

  if (!userKey || userKey === 'guest') {
    return {
      ok: true,
      syncedToCloud: false,
      savedAtIso,
    };
  }

  const docId = buatIdDokumenSiswa(userKey, canonicalMeetingId);
  const docRef = doc(firebaseDb, KOLEKSI_PENERAPAN_KONSEP, docId);

  const firestorePayload = {
    studentKey: String(userKey),
    nama: String(session?.nama || '').slice(0, 120),
    nisn: String(session?.nisn || '').slice(0, 40),
    email: String(session?.email || '').slice(0, 120),
    role: String(session?.role || 'siswa'),
    pertemuanId: canonicalMeetingId,
    idSumberAktivitas: String(aktivitas.idSumberAsli || canonicalMeetingId),
    bab: String(judulBab || '').slice(0, 200),
    judulPertemuan: String(judulPertemuan || '').slice(0, 200),
    tipeAktivitas: String(aktivitas.tipe || ''),
    modeInteraksi: String(aktivitas.modeInteraksi || ''),
    jawaban: jawabanAman,
    submitted: true,
    savedAtIso,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, firestorePayload);
    return {
      ok: true,
      syncedToCloud: true,
      savedAtIso,
    };
  } catch (err) {
    console.warn('Penyimpanan cloud Penerapan Konsep beralih ke cadangan lokal:', err);
    return {
      ok: true,
      syncedToCloud: false,
      savedAtIso,
      warningMessage:
        'Jawaban tersimpan pada perangkat ini. Sinkronisasi ke server akan diperbarui saat jaringan tersedia.',
    };
  }
}

/**
 * Memulihkan dan berlangganan status jawaban Penerapan Konsep milik siswa aktif.
 */
export function langgananJawabanPenerapan(userKey, meetingId, aktivitas, onData) {
  const canonicalMeetingId = normalisasiIdPertemuanPenerapan(meetingId);
  if (!canonicalMeetingId || !aktivitas) {
    onData(null);
    return () => {};
  }

  const localKey = buatKunciTersimpanLokal(userKey, canonicalMeetingId);
  let resolvedFromServer = false;

  try {
    const rawLocal = localStorage.getItem(localKey);
    if (rawLocal) {
      const parsedLocal = JSON.parse(rawLocal);
      if (parsedLocal && parsedLocal.submitted && parsedLocal.jawaban) {
        onData({
          jawaban: gabungkanJawabanPenerapan(aktivitas, parsedLocal.jawaban),
          submitted: true,
          savedAtIso: String(parsedLocal.savedAtIso || ''),
        });
      }
    }
  } catch {
    // Abaikan cache lokal yang rusak
  }

  if (!userKey || userKey === 'guest') {
    return () => {};
  }

  const docId = buatIdDokumenSiswa(userKey, canonicalMeetingId);
  const docRef = doc(firebaseDb, KOLEKSI_PENERAPAN_KONSEP, docId);

  const unsubscribe = onSnapshot(
    docRef,
    (snap) => {
      resolvedFromServer = true;
      if (!snap.exists()) {
        const hasLocal = Boolean(localStorage.getItem(localKey));
        if (!hasLocal) {
          onData(null);
        }
        return;
      }

      const data = snap.data();
      if (data.studentKey && data.studentKey !== userKey) {
        return;
      }

      const record = {
        jawaban: gabungkanJawabanPenerapan(aktivitas, data.jawaban),
        submitted: Boolean(data.submitted),
        savedAtIso: String(data.savedAtIso || ''),
      };

      try {
        localStorage.setItem(localKey, JSON.stringify(record));
      } catch {
        // Abaikan jika penyimpanan lokal penuh
      }

      onData(record);
    },
    () => {
      if (!resolvedFromServer) {
        getDoc(docRef)
          .then((snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (!data.studentKey || data.studentKey === userKey) {
                onData({
                  jawaban: gabungkanJawabanPenerapan(aktivitas, data.jawaban),
                  submitted: Boolean(data.submitted),
                  savedAtIso: String(data.savedAtIso || ''),
                });
              }
            }
          })
          .catch(() => {
            // Gunakan salinan lokal bila offline
          });
      }
    }
  );

  return unsubscribe;
}
