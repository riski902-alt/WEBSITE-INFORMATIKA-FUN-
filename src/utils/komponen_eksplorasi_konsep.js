import { jsPDF } from 'jspdf';
import { parseJsonTolerant } from './komponen-asesmenawal';

let cachedEksplorasiMap = null;

/**
 * Menormalkan ID pertemuan agar konsisten dengan katalog materi.json
 * (termasuk pemetaan Kelas9-sem2-bab1-* -> kelas9-sem2-bab3-*).
 */
export function normalisasiIdPertemuanEksplorasi(rawId) {
  if (!rawId) return '';
  const lower = String(rawId).trim().toLowerCase();
  if (lower.startsWith('kelas9-sem2-bab1-')) {
    return lower.replace('kelas9-sem2-bab1-', 'kelas9-sem2-bab3-');
  }
  return lower;
}

/**
 * Menghapus penanda teknis seperti " | SLIDE 1 — ", "SLIDE 2 — ", "SLIDE 10"
 * tanpa mengubah isi atau redaksi materi pembelajaran.
 */
export function bersihkanPenandaSlide(rawText) {
  if (!rawText) return '';
  return String(rawText)
    .replace(/^\s*\|\s*/g, '')
    .replace(/^SLIDE\s*\d+\s*(?:[—–\-:]\s*)?/i, '')
    .trim();
}

/**
 * Memisahkan judul materi dan isi materi pada satu tampilan tanpa mengubah
 * redaksi kalimat asli sumber.
 */
function pisahkanJudulDanIsi(rawKonten) {
  const clean = bersihkanPenandaSlide(rawKonten);

  // 1. Tampilan Pembuka
  if (/^PEMBUKA/i.test(clean)) {
    let judul = clean.replace(/^PEMBUKA\s*(?:[—–\-:]\s*)?/i, '').trim();
    let subjudul = 'Informatika SMP';
    if (/INFORMATIKA\s*SMP\s*$/i.test(judul)) {
      subjudul = 'INFORMATIKA SMP';
      judul = judul.replace(/INFORMATIKA\s*SMP\s*$/i, '').trim();
    }
    return {
      kind: 'pembuka',
      judul: judul || 'Eksplorasi Konsep',
      subjudul,
      isiMentahBersih: '',
    };
  }

  // 2. Tampilan Penutup
  if (/^PENUTUP/i.test(clean)) {
    let sisa = clean.replace(/^PENUTUP\s*(?:[—–\-:]\s*)?/i, '').trim();
    let judul = ' Rangkuman & Refleksi'.trim();
    if (/^TERIMA\s*KASIH/i.test(sisa)) {
      judul = 'Terima Kasih';
      sisa = sisa.replace(/^TERIMA\s*KASIH\s*(?:[—–\-:!]?\s*)?/i, '').trim();
    }
    return {
      kind: 'penutup',
      judul,
      subjudul: 'Refleksi Konsep Inti',
      isiMentahBersih: sisa,
    };
  }

  // 3. Tampilan Materi Inti: deteksi batas judul & isi secara presisi
  const boundaryPatterns = [
    // Tanda tanya atau tanda seru di akhir judul diikuti kalimat isi
    /^([^?!]{3,98}[?!])(?=[A-Z0-9"'\(\[\-\*])/,
    // Tanda titik dua di akhir judul diikuti kata "Fungsi:"
    /^([^:]{3,55}:)(?=Fungsi:)/,
    // Kurung tutup diikuti huruf besar / singkatan / tanda kurung / angka
    /^(.{4,98}?\))(?=[A-Z0-9\*\-\[])/,
    // Huruf kecil / angka / tanda petik diikuti kata berawalan Kapital + huruf kecil
    /^(.{4,98}?[a-z0-9\]'"])(?=[A-Z][a-z])/,
    // Huruf kecil / angka / kurung tutup diikuti daftar atau pseudocode
    /^(.{4,98}?[a-z0-9\)\]'"])(?=-\s|\*\(|\[\w|[1-9]\.\s|ALGORITMA\b|DEKLARASI\b|IP\s+Address\b)/,
    // Judul berakhiran singkatan teknis diikuti awal kalimat isi
    /^(.{4,98}?\b(?:CPU|RAM|OS|LAN|DNS|IP|HTTP|HTTPS|UTP|NIC|ITE|PDP|OLE|IF|IF-THEN|IF-THEN-ELSE|FOR|WHILE|SUM|AVERAGE|MIN|MAX|COUNT|VLOOKUP|HLOOKUP|2FA|OTP|CC|T&C|CTA|AI|QR|USB|SSD|HDD|ISP))(?=(?:Di|Dalam|Digunakan|Gunakan|DEKLARASI|ALGORITMA|Saat|Jika|Ketika|Untuk|Setiap|Pada|Ini|Setelah|Sebelum|Berbeda|Sama|Banyak|Ada|Cara|Format|Fungsi|Komponen|Langkah|Masalah|Solusi|Skenario|Tujuan|Hasil|Data|Kumpulan|Proses|Sistem|Program|Aplikasi|Perangkat|Jaringan|Teknologi|Keamanan|Tindakan|Pernyataan|Topologi|Agar|Kode|-|\*|\())/,
  ];

  for (const pattern of boundaryPatterns) {
    const match = clean.match(pattern);
    if (match) {
      const judul = match[1].trim();
      const isi = clean.slice(match[1].length).trim();
      return {
        kind: 'inti',
        judul,
        subjudul: '',
        isiMentahBersih: isi,
      };
    }
  }

  return {
    kind: 'inti',
    judul: 'Konsep Materi',
    subjudul: '',
    isiMentahBersih: clean,
  };
}

/**
 * Mengurai teks isi menjadi blok struktur visual (paragraf, daftar poin,
 * tabel data, atau blok kode/algoritma) tanpa mengubah kata asli.
 */
function uraiBlokKonten(isi) {
  if (!isi) return [];
  const blocks = [];

  // Cek apakah memuat tabel pipa seperti | No | Nama Barang | ... || 1 | Meja | ... |
  if (isi.includes('|') && /\|\s*[^|]+\s*\|/.test(isi)) {
    const firstPipeIdx = isi.indexOf('|');
    const intro = isi.slice(0, firstPipeIdx).trim();
    if (intro) {
      blocks.push({ type: 'paragraph', text: intro });
    }

    const tableSegment = isi.slice(firstPipeIdx).trim();
    const rawRows = tableSegment
      .split('||')
      .map((r) => r.trim())
      .filter(Boolean);

    if (rawRows.length >= 2) {
      const parsedRows = rawRows.map((rowStr) =>
        rowStr
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell) => cell.length > 0)
      );

      if (parsedRows.length >= 2 && parsedRows[0].length >= 2) {
        blocks.push({
          type: 'table',
          headers: parsedRows[0],
          rows: parsedRows.slice(1),
        });
        return blocks;
      }
    }
  }

  // Cek apakah memuat blok Pseudocode formal (ALGORITMA / DEKLARASI / DESKRIPSI)
  if (/\b(?:ALGORITMA|DEKLARASI|DESKRIPSI)\b/.test(isi)) {
    const codeStartMatch = isi.match(/\b(ALGORITMA|DEKLARASI|Pseudocode:)\b/);
    if (codeStartMatch && codeStartMatch.index !== undefined) {
      const idx = codeStartMatch.index;
      const before = isi.slice(0, idx).trim();
      if (before) {
        blocks.push({ type: 'paragraph', text: before });
      }
      const codeBody = isi.slice(idx).trim();
      // Pisahkan kata kunci utama pseudocode agar mudah dibaca per baris tanpa mengubah kata
      const formattedLines = codeBody
        .replace(
          /\s*(DEKLARASI|DESKRIPSI|END IF|ENDIF|END FOR|END WHILE|ELSE IF|ELSE)\b/g,
          '\n$1'
        )
        .replace(/\s+(READ|PRINT|IF|FOR|WHILE)\b/g, '\n  $1')
        .split('\n')
        .map((l) => l.trimEnd())
        .filter((l) => l.trim().length > 0);

      blocks.push({ type: 'code', lines: formattedLines });
      return blocks;
    }
  }

  // Cek apakah terdapat daftar bernomor "1. ... 2. ... 3. ..."
  if (/(?:^|[:.!?)])\s*1\.\s+/.test(isi) && /\s*2\.\s+/.test(isi)) {
    const firstOneMatch = isi.match(/(?:^|([:.!?)]))\s*(1\.\s+)/);
    if (firstOneMatch && firstOneMatch.index !== undefined) {
      const splitPos =
        firstOneMatch.index + (firstOneMatch[1] ? firstOneMatch[1].length : 0);
      const intro = isi.slice(0, splitPos).trim();
      if (intro) {
        blocks.push({ type: 'paragraph', text: intro });
      }
      const listPart = isi.slice(splitPos).trim();
      const rawItems = listPart
        .split(/(?=(?:^|\s)[1-9]\.\s+)/)
        .map((item) => item.replace(/^\s*[1-9]\.\s+/, '').trim())
        .filter(Boolean);

      if (rawItems.length >= 2) {
        blocks.push({ type: 'list', ordered: true, items: rawItems });
        return blocks;
      }
    }
  }

  // Cek apakah terdapat daftar strip "- ... - ..."
  if (/(?:^|[:.!?])\s*-\s+/.test(isi)) {
    const firstDashMatch = isi.match(/(?:^|([:.!?]))\s*(-\s+)/);
    if (firstDashMatch && firstDashMatch.index !== undefined) {
      const splitPos =
        firstDashMatch.index + (firstDashMatch[1] ? firstDashMatch[1].length : 0);
      const intro = isi.slice(0, splitPos).trim();
      if (intro) {
        blocks.push({ type: 'paragraph', text: intro });
      }
      const listPart = isi.slice(splitPos).trim();
      const rawItems = listPart
        .split(/(?:^|(?<=[.!?)"']))\s*-\s+/)
        .map((item) => item.replace(/^-\s+/, '').trim())
        .filter(Boolean);

      if (rawItems.length >= 2) {
        blocks.push({ type: 'list', ordered: false, items: rawItems });
        return blocks;
      }
    }
  }

  // Cek pola akronim THINK atau label bertingkat (Contoh:, Cara penulisan:, Hasil:, Rumus:)
  const labeledParts = isi
    .replace(
      /(?<=[.!?)"'])\s*(?=(?:Contoh(?:\s+\w+)*|Cara(?:\s+\w+)*|Hasil|Rumus|Masalah|Solusi|Diagnosis(?:\s+\w+)*|Penyebab(?:\s+\w+)*|Penjelasan|Catatan|Sumbu\s+[XY]|Baris\s+\d+|Logika):)/g,
      '\n'
    )
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  if (labeledParts.length > 1) {
    labeledParts.forEach((part) => {
      blocks.push({ type: 'paragraph', text: part });
    });
    return blocks;
  }

  blocks.push({ type: 'paragraph', text: isi });
  return blocks;
}

/**
 * Memilih kategori ilustrasi visual kontekstual yang berbeda berdasarkan topik
 * spesifik masing-masing tampilan materi.
 */
function tentukanVisualKategori(judul, isi, idPertemuan) {
  const gabungan = `${judul} ${isi}`.toLowerCase();

  if (
    /\b(scratch|sprite|stage|block palette|green flag|motion|looks|sensing|forever|repeat|c-block)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'scratch_visual',
      tagline: 'Pemrograman Visual Blok & Interaksi Karakter',
    };
  }

  if (
    /\b(malware|virus|trojan|ransomware|spyware|antivirus|firewall|password|sandi|passphrase|2fa|otp|authenticator|phishing|enkripsi|https|kredensial|backup|vpn|security|keamanan)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'keamanan_siber',
      tagline: 'Pertahanan Perangkat, Kredensial & Keamanan Siber',
    };
  }

  if (
    /\b(jaringan|lan\b|wan\b|utp|rj-45|fiber optik|switch|hub\b|wi-fi|wifi|bluetooth|seluler|4g|5g|ip address|dns|router|topologi|nirkabel)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'jaringan_internet',
      tagline: 'Arsitektur Konektivitas Jaringan & Rute Data',
    };
  }

  if (
    /\b(hardware|perangkat keras|cpu|alu\b|control unit|ram\b|hard disk|hdd|ssd|flashdisk|input|output|monitor|keyboard|mouse|printer|sistem operasi|software|fetch|decode|execute|bus data|motherboard)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'perangkat_keras',
      tagline: 'Komponen Sistem Komputer & Siklus Pemrosesan CPU',
    };
  }

  if (
    /\b(pseudocode|if-then|if-then-else|percabangan|kondisional|while|for\b|infinite loop|sequential|runtutan|integer|boolean|variabel|flowchart)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'algoritma_pseudocode',
      tagline: 'Alur Logika Algoritma, Variabel & Struktur Kontrol',
    };
  }

  if (
    /\b(dekomposisi|pengenalan pola|abstraksi|berpikir komputasional|linear search|binary search|bubble sort|pencarian|pengurutan)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'berpikir_komputasional',
      tagline: 'Empat Pilar Berpikir Komputasional & Strategi Solusi',
    };
  }

  if (
    /\b(spreadsheet|excel|google sheets|vlookup|hlookup|average|sum\b|min\b|max\b|count\b|conditional formatting|chart|grafik|pie chart|bar chart|formula|sel\b|range)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'spreadsheet_formula',
      tagline: 'Lembar Kerja Pengolah Angka, Rumus & Grafik Visual',
    };
  }

  if (
    /\b(word processor|pengolah dokumen|pengolah kata|margin|header|footer|justify|daftar isi|table of contents|mail merge|wrap text|slide master|presenter view|transisi|animasi|ole\b|linking|embedding|presentasi)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'dokumen_presentasi',
      tagline: 'Tata Letak Dokumen, Presentasi Efektif & Integrasi',
    };
  }

  if (
    /\b(crawling|crawler|indexing|ranking|mesin pencari|search engine|search operators|filetype:|site:)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'mesin_pencari',
      tagline: 'Mekanisme Mesin Pencari & Operator Kueri Presisi',
    };
  }

  if (
    /\b(hoaks|hoax|fakta|opini|disinformasi|misinformasi|fact-checking|cek fakta|dewan pers|jurnalistik|kredibilitas|verifikasi silang|domain\b)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'literasi_fakta',
      tagline: 'Evaluasi Fakta, Kredibilitas Sumber & Cek Fakta',
    };
  }

  if (
    /\b(cyberbullying|perundungan|doxxing|doxing|jejak digital|digital footprint|netiquette|netiket|hate speech|ujaran kebencian|kewargaan digital|ruang publik virtual|hak cipta|creative commons|diseminasi|infografis|analytics|reach|engagement|privasi|oversharing)\b/.test(
      gabungan
    )
  ) {
    return {
      kategori: 'kewargaan_digital',
      tagline: 'Etika Ruang Digital, Rekam Jejak & Karya Positif',
    };
  }

  if (
    /\b(data terstruktur|data tidak terstruktur|tabel|baris|kolom|atribut|list|senarai|data)\b/.test(
      gabungan
    ) ||
    idPertemuan.startsWith('kelas7-sem1-bab1')
  ) {
    return {
      kategori: 'data_tabel',
      tagline: 'Pemodelan Struktur Data, Tabel & Pengorganisasian',
    };
  }

  return {
    kategori: 'berpikir_komputasional',
    tagline: 'Eksplorasi Konsep Inti Informatika SMP',
  };
}

/**
 * Memuat dan menormalkan seluruh 81 pertemuan dari eksplorasi_konsep.json.
 */
export async function muatKatalogEksplorasiKonsep() {
  if (cachedEksplorasiMap) {
    return cachedEksplorasiMap;
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const response = await fetch(`${baseUrl}eksplorasi_konsep.json`);
  if (!response.ok) {
    throw new Error(
      `Gagal memuat eksplorasi_konsep.json (Status ${response.status})`
    );
  }

  const rawText = await response.text();
  const parsed = parseJsonTolerant(rawText);

  const rawList = Array.isArray(parsed?.eksplorasi_konsep)
    ? parsed.eksplorasi_konsep
    : Array.isArray(parsed?.data)
      ? parsed.data
      : [];

  const catalogMap = {};

  rawList.forEach((entry) => {
    const rawMeetingId = String(entry?.pertemuan || entry?.id_pertemuan || '').trim();
    if (!rawMeetingId) return;

    const canonicalId = normalisasiIdPertemuanEksplorasi(rawMeetingId);
    const rawSlides = Array.isArray(entry?.slides)
      ? entry.slides
      : Array.isArray(entry?.materi)
        ? entry.materi
        : [];

    const normalizedSlides = rawSlides.map((slideItem, idx) => {
      const rawContent =
        typeof slideItem === 'string'
          ? slideItem
          : String(slideItem?.konten || '');

      const { kind, judul, subjudul, isiMentahBersih } =
        pisahkanJudulDanIsi(rawContent);
      const blocks = uraiBlokKonten(isiMentahBersih);
      const { kategori, tagline } = tentukanVisualKategori(
        judul,
        isiMentahBersih,
        canonicalId
      );

      return {
        index: idx,
        kind,
        judul,
        subjudul,
        isiMentahBersih,
        blocks,
        visualKategori: kategori,
        visualTagline: tagline,
      };
    });

    const meetingObj = {
      idPertemuanAsli: rawMeetingId,
      idPertemuanKanonik: canonicalId,
      totalMateri: normalizedSlides.length,
      slides: normalizedSlides,
    };

    catalogMap[canonicalId] = meetingObj;
    catalogMap[rawMeetingId.toLowerCase()] = meetingObj;
  });

  cachedEksplorasiMap = catalogMap;
  return catalogMap;
}

/**
 * Mengambil data Eksplorasi Konsep sesuai pertemuan yang sedang dipilih siswa.
 */
export async function ambilMateriEksplorasiKonsep(meetingId) {
  if (!meetingId) return null;
  const catalog = await muatKatalogEksplorasiKonsep();
  const canonical = normalisasiIdPertemuanEksplorasi(meetingId);
  return catalog[canonical] || catalog[meetingId.trim().toLowerCase()] || null;
}

/**
 * Menyimpan & memulihkan posisi materi Eksplorasi Konsep per akun siswa.
 */
export function muatPosisiEksplorasi(userKey, meetingId, maxIndex) {
  const canonical = normalisasiIdPertemuanEksplorasi(meetingId);
  const key = `infoFun_Eksplorasi_${userKey}_${canonical}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { currentIndex: 0, visitedIndices: [0] };
    const parsed = JSON.parse(raw);
    const safeIdx = Math.min(
      Math.max(0, Number(parsed?.currentIndex) || 0),
      Math.max(0, maxIndex)
    );
    const visited = Array.isArray(parsed?.visitedIndices)
      ? parsed.visitedIndices.filter(
          (n) => typeof n === 'number' && n >= 0 && n <= maxIndex
        )
      : [0];
    if (!visited.includes(safeIdx)) visited.push(safeIdx);
    return { currentIndex: safeIdx, visitedIndices: visited };
  } catch {
    return { currentIndex: 0, visitedIndices: [0] };
  }
}

export function simpanPosisiEksplorasi(
  userKey,
  meetingId,
  currentIndex,
  visitedIndices
) {
  const canonical = normalisasiIdPertemuanEksplorasi(meetingId);
  const key = `infoFun_Eksplorasi_${userKey}_${canonical}`;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        currentIndex,
        visitedIndices: Array.from(new Set(visitedIndices)),
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    // Abaikan jika kuota penyimpanan penuh
  }
}

/**
 * Menggambar ilustrasi vektor sesuai topik pada halaman PDF 16:9.
 */
function gambarIlustrasiVektorPdf(doc, kategori, x, y, w, h, tagline) {
  // Panel latar visual lembut
  doc.setFillColor(240, 246, 252);
  doc.setDrawColor(136, 212, 171);
  doc.setLineWidth(1.5);
  doc.roundedRect(x, y, w, h, 14, 14, 'FD');

  const cx = x + w / 2;
  const cy = y + h / 2 - 14;

  // Header pita kecil di dalam kartu ilustrasi
  doc.setFillColor(30, 58, 95);
  doc.roundedRect(x + 16, y + 16, w - 32, 26, 7, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(136, 212, 171);
  doc.text('VISUALISASI KONSEP', cx, y + 33, { align: 'center' });

  // Gambar diagram vektor sesuai kategori materi
  if (kategori === 'data_tabel' || kategori === 'spreadsheet_formula') {
    const gx = x + 28;
    const gy = cy - 48;
    const gw = w - 56;
    const gh = 108;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(82, 125, 168);
    doc.setLineWidth(1.2);
    doc.roundedRect(gx, gy, gw, gh, 6, 6, 'FD');
    doc.setFillColor(30, 58, 95);
    doc.rect(gx, gy, gw, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    const cols =
      kategori === 'spreadsheet_formula'
        ? ['A', 'B', 'C', '=SUM']
        : ['No', 'Atribut', 'Nilai', 'Status'];
    const cw = gw / 4;
    cols.forEach((c, idx) => {
      doc.text(c, gx + cw * idx + cw / 2, gy + 15, { align: 'center' });
    });
    doc.setDrawColor(210, 224, 238);
    for (let r = 1; r <= 3; r++) {
      doc.line(gx, gy + 24 + r * 21, gx + gw, gy + 24 + r * 21);
    }
    for (let c = 1; c < 4; c++) {
      doc.line(gx + cw * c, gy, gx + cw * c, gy + gh);
    }
    doc.setFillColor(136, 212, 171);
    doc.roundedRect(gx + gw - cw + 6, gy + gh - 19, cw - 12, 13, 3, 3, 'F');
  } else if (
    kategori === 'algoritma_pseudocode' ||
    kategori === 'berpikir_komputasional' ||
    kategori === 'scratch_visual'
  ) {
    const labels =
      kategori === 'scratch_visual'
        ? ['Event: Mulai', 'Motion / Loop', 'If Kondisi', 'Variabel Skor']
        : kategori === 'berpikir_komputasional'
          ? ['1. Dekomposisi', '2. Pola Data', '3. Abstraksi', '4. Algoritma']
          : ['INPUT Data', 'PROSES Logika', 'IF / LOOP', 'OUTPUT Hasil'];
    const colors = [
      [30, 58, 95],
      [82, 125, 168],
      [216, 189, 123],
      [136, 212, 171],
    ];
    labels.forEach((lbl, idx) => {
      const by = cy - 62 + idx * 36;
      const [r, g, b] = colors[idx];
      doc.setFillColor(r, g, b);
      doc.roundedRect(cx - 78, by, 156, 24, 6, 6, 'F');
      doc.setTextColor(idx >= 2 ? 30 : 255, idx >= 2 ? 58 : 255, idx >= 2 ? 95 : 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(lbl, cx, by + 15, { align: 'center' });
      if (idx < 3) {
        doc.setDrawColor(30, 58, 95);
        doc.setLineWidth(1.5);
        doc.line(cx, by + 24, cx, by + 36);
      }
    });
  } else if (kategori === 'perangkat_keras' || kategori === 'jaringan_internet') {
    const centerLabel = kategori === 'perangkat_keras' ? 'CPU & RAM' : 'ROUTER / LAN';
    const nodes =
      kategori === 'perangkat_keras'
        ? ['Input', 'Output', 'ALU/CU', 'Storage']
        : ['PC Klien', 'Server', 'Wi-Fi', 'DNS / IP'];
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(cx - 48, cy - 22, 96, 44, 8, 8, 'F');
    doc.setTextColor(136, 212, 171);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(centerLabel, cx, cy + 3, { align: 'center' });

    const offsets = [
      [-74, -52],
      [74, -52],
      [-74, 52],
      [74, 52],
    ];
    offsets.forEach(([ox, oy], idx) => {
      doc.setDrawColor(82, 125, 168);
      doc.setLineWidth(1.4);
      doc.line(cx, cy, cx + ox, cy + oy);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cx + ox - 36, cy + oy - 13, 72, 26, 6, 6, 'FD');
      doc.setTextColor(30, 58, 95);
      doc.setFontSize(8.5);
      doc.text(nodes[idx], cx + ox, cy + oy + 3, { align: 'center' });
    });
  } else if (kategori === 'keamanan_siber') {
    doc.setFillColor(30, 58, 95);
    doc.circle(cx, cy - 8, 46, 'F');
    doc.setFillColor(136, 212, 171);
    doc.circle(cx, cy - 8, 32, 'F');
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(cx - 14, cy - 12, 28, 22, 4, 4, 'F');
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(3);
    doc.circle(cx, cy - 16, 9, 'S');
    doc.setTextColor(136, 212, 171);
    doc.setFontSize(8);
    doc.text('2FA', cx, cy + 2, { align: 'center' });
  } else {
    // Mesin pencari / Literasi Fakta / Dokumen / Kewargaan Digital
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(82, 125, 168);
    doc.setLineWidth(1.5);
    doc.roundedRect(cx - 82, cy - 52, 164, 104, 10, 10, 'FD');
    doc.setFillColor(82, 125, 168);
    doc.roundedRect(cx - 68, cy - 36, 136, 18, 4, 4, 'F');
    doc.setFillColor(220, 234, 245);
    doc.roundedRect(cx - 68, cy - 10, 136, 14, 4, 4, 'F');
    doc.setFillColor(225, 239, 229);
    doc.roundedRect(cx - 68, cy + 12, 98, 14, 4, 4, 'F');
    doc.setFillColor(216, 189, 123);
    doc.circle(cx + 52, cy + 22, 14, 'F');
  }

  // Keterangan bawah visual
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(36, 59, 83);
  const wrappedTag = doc.splitTextToSize(tagline || 'Konsep Informatika SMP', w - 32);
  doc.text(wrappedTag, cx, y + h - 24, { align: 'center' });
}

/**
 * Menghasilkan dan mengunduh file PDF lanskap rasio 16:9 khusus untuk materi
 * yang sedang ditampilkan (tanpa kata SLIDE dan tanpa tangkapan tombol web).
 */
export async function unduhSlideEksplorasiPdf({
  slide,
  posisiSekarang,
  totalMateri,
  judulBab,
  judulPertemuan,
  meetingId,
}) {
  if (!slide) {
    throw new Error('Data materi tidak tersedia untuk diunduh.');
  }

  const pageWidth = 960;
  const pageHeight = 540;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [pageWidth, pageHeight],
  });

  // Latar belakang utama putih bersih dengan bingkai aksen Informatika Fun
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Pita atas Navy & Mint
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageWidth, 64, 'F');
  doc.setFillColor(136, 212, 171);
  doc.rect(0, 64, pageWidth, 4, 'F');

  // Teks identitas di pita atas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(136, 212, 171);
  doc.text('INFORMATIKA FUN! — EKSPLORASI KONSEP', 40, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(220, 234, 245);
  const subHeader = `${judulBab || 'Informatika SMP'}  •  ${judulPertemuan || meetingId}`;
  const cleanSubHeader = doc.splitTextToSize(subHeader, 680)[0] || '';
  doc.text(cleanSubHeader, 40, 47);

  // Indikator posisi (tanpa kata SLIDE)
  doc.setFillColor(216, 189, 123);
  doc.roundedRect(pageWidth - 150, 18, 110, 28, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 58, 95);
  doc.text(
    `Bagian ${posisiSekarang} dari ${totalMateri}`,
    pageWidth - 95,
    36,
    { align: 'center' }
  );

  // Area konten utama (kiri) dan area visual topik (kanan)
  const leftX = 44;
  const leftW = 548;
  const rightX = 616;
  const rightW = 304;
  const contentTopY = 96;
  const contentHeight = 388;

  if (slide.kind === 'pembuka') {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(82, 125, 168);
    doc.setLineWidth(1.2);
    doc.roundedRect(leftX, contentTopY, leftW, contentHeight, 14, 14, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(82, 125, 168);
    doc.text(slide.subjudul || 'INFORMATIKA SMP', leftX + 28, contentTopY + 52);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(25);
    doc.setTextColor(30, 58, 95);
    const titleLines = doc.splitTextToSize(slide.judul, leftW - 56);
    doc.text(titleLines, leftX + 28, contentTopY + 96);

    const afterTitleY = contentTopY + 96 + titleLines.length * 32 + 18;
    doc.setFillColor(136, 212, 171);
    doc.rect(leftX + 28, Math.min(afterTitleY, 390), 96, 5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text(
      judulPertemuan || 'Materi Pembelajaran Inti',
      leftX + 28,
      Math.min(afterTitleY + 32, 430)
    );
  } else if (slide.kind === 'penutup') {
    doc.setFillColor(244, 251, 247);
    doc.setDrawColor(136, 212, 171);
    doc.setLineWidth(1.5);
    doc.roundedRect(leftX, contentTopY, leftW, contentHeight, 14, 14, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(30, 58, 95);
    doc.text(slide.judul || 'Terima Kasih', leftX + 28, contentTopY + 86);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(16);
    doc.setTextColor(36, 59, 83);
    const quoteLines = doc.splitTextToSize(
      `"${slide.isiMentahBersih}"`,
      leftW - 56
    );
    doc.text(quoteLines, leftX + 28, contentTopY + 140);
  } else {
    // Judul Materi Inti
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(21);
    doc.setTextColor(30, 58, 95);
    const titleLines = doc.splitTextToSize(slide.judul, leftW);
    doc.text(titleLines, leftX, contentTopY + 24);

    let cursorY = contentTopY + 24 + titleLines.length * 26 + 8;
    doc.setFillColor(82, 125, 168);
    doc.rect(leftX, cursorY - 10, 68, 3.5, 'F');
    cursorY += 14;

    // Hitung kepadatan teks agar ukuran huruf otomatis pas dan tidak terpotong
    const totalCharLen = (slide.isiMentahBersih || '').length;
    const bodyFontSize = totalCharLen > 340 ? 11.5 : totalCharLen > 230 ? 13 : 14.5;
    const lineStep = bodyFontSize * 1.48;

    slide.blocks.forEach((block) => {
      if (cursorY > pageHeight - 68) return;

      if (block.type === 'paragraph') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(bodyFontSize);
        doc.setTextColor(36, 52, 71);
        const lines = doc.splitTextToSize(block.text, leftW - 8);
        doc.text(lines, leftX, cursorY);
        cursorY += lines.length * lineStep + 10;
      } else if (block.type === 'list') {
        block.items.forEach((item, i) => {
          if (cursorY > pageHeight - 62) return;
          const prefix = block.ordered ? `${i + 1}. ` : '• ';
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(bodyFontSize);
          doc.setTextColor(30, 58, 95);
          doc.text(prefix, leftX + 4, cursorY);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(36, 52, 71);
          const itemLines = doc.splitTextToSize(item, leftW - 28);
          doc.text(itemLines, leftX + 24, cursorY);
          cursorY += itemLines.length * lineStep + 7;
        });
      } else if (block.type === 'table') {
        const colCount = Math.max(1, block.headers.length);
        const colW = (leftW - 8) / colCount;
        doc.setFillColor(30, 58, 95);
        doc.rect(leftX, cursorY - 12, leftW - 8, 22, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        block.headers.forEach((h, ci) => {
          doc.text(String(h), leftX + ci * colW + 8, cursorY + 3);
        });
        cursorY += 22;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(36, 52, 71);
        block.rows.forEach((row, ri) => {
          if (cursorY > pageHeight - 62) return;
          if (ri % 2 === 0) {
            doc.setFillColor(241, 245, 249);
            doc.rect(leftX, cursorY - 12, leftW - 8, 20, 'F');
          }
          row.forEach((cell, ci) => {
            const cellText = doc.splitTextToSize(String(cell), colW - 12)[0] || '';
            doc.text(cellText, leftX + ci * colW + 8, cursorY + 2);
          });
          cursorY += 20;
        });
        cursorY += 8;
      } else if (block.type === 'code') {
        const boxHeight = Math.min(
          block.lines.length * 16 + 22,
          pageHeight - 64 - cursorY
        );
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(82, 125, 168);
        doc.roundedRect(leftX, cursorY - 12, leftW - 8, boxHeight, 8, 8, 'FD');
        doc.setFont('courier', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(30, 58, 95);
        block.lines.forEach((line) => {
          if (cursorY > pageHeight - 70) return;
          const wrapped = doc.splitTextToSize(line, leftW - 32);
          doc.text(wrapped, leftX + 14, cursorY + 4);
          cursorY += wrapped.length * 15;
        });
        cursorY += 14;
      }
    });
  }

  // Gambar panel ilustrasi di sisi kanan halaman 16:9
  gambarIlustrasiVektorPdf(
    doc,
    slide.visualKategori,
    rightX,
    contentTopY,
    rightW,
    contentHeight,
    slide.visualTagline
  );

  // Catatan kaki bersih di bagian bawah halaman 16:9
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, pageHeight - 36, pageWidth - 40, pageHeight - 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'INFORMATIKA FUN! — Materi Eksplorasi Konsep SMP',
    40,
    pageHeight - 18
  );
  doc.text(
    cleanNamaFileJudul(slide.judul),
    pageWidth - 40,
    pageHeight - 18,
    { align: 'right' }
  );

  const safeSlug = cleanNamaFileSlug(`${meetingId}_Bagian_${posisiSekarang}`);
  doc.save(`Eksplorasi_Konsep_${safeSlug}.pdf`);
}

function cleanNamaFileJudul(judul) {
  return String(judul || '').slice(0, 65);
}

function cleanNamaFileSlug(input) {
  return String(input || 'materi')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
