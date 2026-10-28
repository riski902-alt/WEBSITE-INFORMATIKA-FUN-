import {
  saveNonDbMenuRecord,
  subscribeNonDbMenuRecord,
} from './firebaseSync';
import { parseJsonTolerant } from './komponen-asesmenawal';

const BOBOT_PER_SOAL = 12.5;

let cachedForLearningCatalog = null;

/**
 * Menormalkan ID pertemuan agar cocok dengan materi.json
 * (termasuk Kelas9-sem2-bab1-* -> kelas9-sem2-bab3-*).
 */
export function normalisasiIdPertemuanForLearning(rawId) {
  if (!rawId) return '';
  const lower = String(rawId).trim().toLowerCase();
  if (lower.startsWith('kelas9-sem2-bab1-')) {
    return lower.replace('kelas9-sem2-bab1-', 'kelas9-sem2-bab3-');
  }
  return lower;
}

function deterministicShuffle(items, seedStr) {
  const copy = [...items];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/**
 * Mengurai format daftar_pertanyaan string apabila terdapat entri mentah.
 */
function uraiDaftarPertanyaanMentah(daftar, idPertemuan) {
  if (!Array.isArray(daftar) || daftar.length < 4) return null;

  function parseMC(str, num) {
    const cleaned = str.replace(new RegExp(`^${num}\\.\\s*`), '').trim();
    const m = cleaned.match(
      /^(.*?)\s+A\.\s+(.*?)\s+B\.\s+(.*?)\s+C\.\s+(.*?)\s+D\.\s+(.*?)\s+Kunci Jawaban:\s*([A-D,\s]+)$/is
    );
    if (!m) return null;
    return {
      nomor: num,
      pertanyaan: m[1].trim(),
      pilihan: {
        A: m[2].trim(),
        B: m[3].trim(),
        C: m[4].trim(),
        D: m[5].trim(),
      },
      kunciJawaban: m[6].replace(/\s+/g, ' ').trim(),
    };
  }

  const pgRaw = String(daftar[0] || '').replace(/^A\.\s*Pilihan Ganda\s*/i, '');
  const pgSplit = pgRaw.match(/^(1\..*?Kunci Jawaban:\s*[A-D])\s*(2\.\s.*)$/is);
  const pgkRaw = String(daftar[1] || '').replace(
    /^B\.\s*Pilihan Ganda Kompleks\s*/i,
    ''
  );
  const pgkSplit = pgkRaw.match(
    /^(1\..*?Kunci Jawaban:\s*[A-D,\s]+?)\s*(2\.\s.*)$/is
  );
  const mjRaw = String(daftar[2] || '').replace(/^C\.\s*Menjodohkan\s*/i, '');
  const mjMatch = mjRaw.match(
    /^1\.\s*Pernyataan:\s*(.*?)\s+Jawaban:\s*(.*?)2\.\s*Pernyataan:\s*(.*?)\s+Jawaban:\s*(.*)$/is
  );
  const isRaw = String(daftar[3] || '').replace(/^D\.\s*Isian\s*/i, '');
  const isMatch = isRaw.match(
    /^1\.\s*Pertanyaan:\s*(.*?)\s+Jawaban:\s*(.*?)2\.\s*Pertanyaan:\s*(.*?)\s+Jawaban:\s*(.*)$/is
  );

  if (!pgSplit || !pgkSplit || !mjMatch || !isMatch) {
    console.warn('Format daftar_pertanyaan tidak lengkap pada:', idPertemuan);
    return null;
  }

  return {
    pilihanGanda: [parseMC(pgSplit[1], 1), parseMC(pgSplit[2], 2)].filter(
      Boolean
    ),
    pilihanGandaKompleks: [
      parseMC(pgkSplit[1], 1),
      parseMC(pgkSplit[2], 2),
    ].filter(Boolean),
    menjodohkan: [
      { nomor: 1, pernyataan: mjMatch[1].trim(), jawaban: mjMatch[2].trim() },
      { nomor: 2, pernyataan: mjMatch[3].trim(), jawaban: mjMatch[4].trim() },
    ],
    isian: [
      { nomor: 1, pertanyaan: isMatch[1].trim(), jawaban: isMatch[2].trim() },
      { nomor: 2, pertanyaan: isMatch[3].trim(), jawaban: isMatch[4].trim() },
    ],
  };
}

/**
 * Mengubah 1 objek pertemuan mentah menjadi 8 objek soal standar yang konsisten.
 */
function normalisasiPertemuanSoal(rawEntry, canonicalMeetingId) {
  if (!rawEntry || typeof rawEntry !== 'object') return [];

  const pgList = Array.isArray(rawEntry.pilihanGanda)
    ? rawEntry.pilihanGanda
    : [];
  const pgkList = Array.isArray(rawEntry.pilihanGandaKompleks)
    ? rawEntry.pilihanGandaKompleks
    : [];
  const mjList = Array.isArray(rawEntry.menjodohkan)
    ? rawEntry.menjodohkan
    : [];
  const isianList = Array.isArray(rawEntry.isian) ? rawEntry.isian : [];

  const hasil = [];
  let nomorUrut = 1;

  // Kumpulan istilah dalam pertemuan yang sama untuk opsi menjodohkan yang bermakna
  const kumpulanPasangan = Array.from(
    new Set(
      [
        ...mjList.map((m) => String(m?.jawaban || '').trim()),
        ...isianList.map((s) => String(s?.jawaban || '').trim()),
      ].filter(Boolean)
    )
  );

  // 1. Pilihan Ganda
  pgList.forEach((item, idx) => {
    const nomorBagian = Number(item?.nomor) || idx + 1;
    const pilihanObj = item?.pilihan || {};
    const pilihanArr = ['A', 'B', 'C', 'D']
      .filter((k) => pilihanObj[k] !== undefined)
      .map((k) => ({
        key: k,
        label: String(pilihanObj[k]).trim(),
      }));
    const kunci = String(item?.kunciJawaban || '')
      .trim()
      .toUpperCase();
    const opsiBenar = pilihanArr.find((o) => o.key === kunci);

    hasil.push({
      id: `${canonicalMeetingId}__pg_${nomorBagian}`,
      nomorUrut: nomorUrut++,
      nomorBagian,
      type: 'pg',
      pertanyaan: String(item?.pertanyaan || '').trim(),
      pilihan: pilihanArr,
      kunciJawaban: kunci,
      jawabanBenarTeks: opsiBenar
        ? `${kunci}. ${opsiBenar.label}`
        : kunci,
      bobot: BOBOT_PER_SOAL,
      pembahasanSumber: item?.pembahasan ? String(item.pembahasan).trim() : '',
    });
  });

  // 2. Pilihan Ganda Kompleks
  pgkList.forEach((item, idx) => {
    const nomorBagian = Number(item?.nomor) || idx + 1;
    const pilihanObj = item?.pilihan || {};
    const pilihanArr = ['A', 'B', 'C', 'D']
      .filter((k) => pilihanObj[k] !== undefined)
      .map((k) => ({
        key: k,
        label: String(pilihanObj[k]).trim(),
      }));
    const kunciList = String(item?.kunciJawaban || '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const labelBenar = kunciList
      .map((k) => {
        const found = pilihanArr.find((o) => o.key === k);
        return found ? `${k} (${found.label})` : k;
      })
      .join(' dan ');

    hasil.push({
      id: `${canonicalMeetingId}__pgk_${nomorBagian}`,
      nomorUrut: nomorUrut++,
      nomorBagian,
      type: 'pg_kompleks',
      pertanyaan: String(item?.pertanyaan || '').trim(),
      pilihan: pilihanArr,
      kunciJawabanList: kunciList,
      jawabanBenarTeks: labelBenar || kunciList.join(', '),
      bobot: BOBOT_PER_SOAL,
      pembahasanSumber: item?.pembahasan ? String(item.pembahasan).trim() : '',
    });
  });

  // 3. Menjodohkan
  mjList.forEach((item, idx) => {
    const nomorBagian = Number(item?.nomor) || idx + 1;
    const jawabanBenar = String(item?.jawaban || '').trim();
    const opsiUnik = Array.from(
      new Set([jawabanBenar, ...kumpulanPasangan].filter(Boolean))
    );
    const opsiTeracak = deterministicShuffle(
      opsiUnik,
      `${canonicalMeetingId}_mj_${nomorBagian}`
    );

    hasil.push({
      id: `${canonicalMeetingId}__jodoh_${nomorBagian}`,
      nomorUrut: nomorUrut++,
      nomorBagian,
      type: 'menjodohkan',
      pertanyaan: String(item?.pernyataan || '').trim(),
      jawabanBenarTeks: jawabanBenar,
      opsiMenjodohkan: opsiTeracak,
      bobot: BOBOT_PER_SOAL,
      pembahasanSumber: item?.pembahasan ? String(item.pembahasan).trim() : '',
    });
  });

  // 4. Isian Singkat
  isianList.forEach((item, idx) => {
    const nomorBagian = Number(item?.nomor) || idx + 1;
    const jawabanBenar = String(item?.jawaban || '').trim();

    hasil.push({
      id: `${canonicalMeetingId}__isian_${nomorBagian}`,
      nomorUrut: nomorUrut++,
      nomorBagian,
      type: 'isian',
      pertanyaan: String(item?.pertanyaan || '').trim(),
      jawabanBenarTeks: jawabanBenar,
      bobot: BOBOT_PER_SOAL,
      pembahasanSumber: item?.pembahasan ? String(item.pembahasan).trim() : '',
    });
  });

  return hasil;
}

/**
 * Memuat dan menormalkan seluruh 81 pertemuan dari for_learning.json.
 */
export async function muatKatalogForLearning() {
  if (cachedForLearningCatalog) {
    return cachedForLearningCatalog;
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const response = await fetch(`${baseUrl}for_learning.json`);
  if (!response.ok) {
    throw new Error(
      `Gagal memuat for_learning.json (Status ${response.status})`
    );
  }

  const rawText = await response.text();
  const parsed = parseJsonTolerant(rawText);
  const catalog = {};

  if (parsed && typeof parsed === 'object') {
    // Dukungan apabila dibungkus array maupun objek langsung per pertemuan
    if (Array.isArray(parsed.pertanyaan_esensial)) {
      parsed.pertanyaan_esensial.forEach((entry) => {
        const rawId = String(entry?.id_pertemuan || '').trim();
        if (!rawId) return;
        const canonical = normalisasiIdPertemuanForLearning(rawId);
        const structured = uraiDaftarPertanyaanMentah(
          entry.daftar_pertanyaan,
          rawId
        );
        if (structured) {
          const normalized = normalisasiPertemuanSoal(structured, canonical);
          catalog[canonical] = normalized;
          catalog[rawId.toLowerCase()] = normalized;
        }
      });
    } else {
      Object.entries(parsed).forEach(([rawKey, val]) => {
        const canonical = normalisasiIdPertemuanForLearning(rawKey);
        const normalized = normalisasiPertemuanSoal(val, canonical);
        if (normalized.length > 0) {
          catalog[canonical] = normalized;
          catalog[rawKey.trim().toLowerCase()] = normalized;
        }
      });
    }
  }

  cachedForLearningCatalog = catalog;
  return catalog;
}

/**
 * Mengambil 8 butir soal For Learning sesuai pertemuan aktif.
 */
export async function ambilSoalForLearning(meetingId) {
  if (!meetingId) return [];
  const catalog = await muatKatalogForLearning();
  const canonical = normalisasiIdPertemuanForLearning(meetingId);
  return catalog[canonical] || catalog[meetingId.trim().toLowerCase()] || [];
}

function normalisasiTeksLonggar(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function bersihkanTeksAlfanumerik(str) {
  return normalisasiTeksLonggar(str)
    .replace(/[.,!?;:'"()[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pemeriksaan fleksibel & adil untuk soal Isian Singkat sesuai kunci jawaban sumber.
 */
export function periksaJawabanIsian(jawabanSiswa, kunciSumber) {
  const inputRaw = normalisasiTeksLonggar(jawabanSiswa);
  if (!inputRaw) return false;

  const kunciRaw = normalisasiTeksLonggar(kunciSumber);
  if (inputRaw === kunciRaw) return true;

  // Kasus khusus operator dan simbol rumus
  if (kunciRaw.includes('garis miring') && (inputRaw === '/' || inputRaw.includes('slash'))) {
    return true;
  }
  if (kunciRaw.includes('tanda kutip') && (inputRaw === '"' || inputRaw === '""')) {
    return true;
  }
  if (kunciRaw.includes('tanda minus') && inputRaw === '-') {
    return true;
  }
  if (kunciRaw.includes('sama dengan (=)') && (inputRaw === '=' || inputRaw === 'sama dengan')) {
    return true;
  }
  if (kunciRaw === '==' && inputRaw === '==') {
    return true;
  }
  if (kunciRaw.includes('!=') && (inputRaw === '!=' || inputRaw === '<>')) {
    return true;
  }
  if (kunciRaw === '=b3-c3' && (inputRaw === '=b3-c3' || inputRaw === 'b3-c3')) {
    return true;
  }
  if (kunciRaw === 'site:' && (inputRaw === 'site:' || inputRaw === 'site')) {
    return true;
  }
  if (kunciRaw === '#div/0!' && (inputRaw === '#div/0!' || inputRaw === 'div/0' || inputRaw === '#div/0')) {
    return true;
  }
  if (kunciRaw.includes('ask ... and wait')) {
    const cleanIn = bersihkanTeksAlfanumerik(inputRaw.replace(/\.\.\./g, ' '));
    if (cleanIn === 'ask and wait' || cleanIn.startsWith('ask ') && cleanIn.endsWith('and wait')) {
      return true;
    }
  }
  if (kunciRaw.includes('change [variabel] by 1')) {
    if (/^change\b.*\bby\s*1$/.test(inputRaw.replace(/[\[\]]/g, ''))) {
      return true;
    }
  }

  // Kumpulkan semua alternatif jawaban yang sah dari kunci sumber (dipisah "/" atau "atau" atau dalam kurung)
  const kandidatSet = new Set();
  kandidatSet.add(bersihkanTeksAlfanumerik(kunciRaw));

  // Tanpa bagian dalam kurung: misal "Perangkat Keras (Hardware)" -> "perangkat keras"
  const tanpaKurung = kunciRaw.replace(/\([^)]*\)/g, '').trim();
  if (tanpaKurung) {
    kandidatSet.add(bersihkanTeksAlfanumerik(tanpaKurung));
    tanpaKurung.split(/\s*(?:\/|\batau\b)\s*/i).forEach((bag) => {
      const bersih = bersihkanTeksAlfanumerik(bag);
      if (bersih) kandidatSet.add(bersih);
      // Jika diawali "Menu " atau "Fitur " seperti pada bab perkantoran, terima juga inti fiturnya
      const tanpaAwalanMenu = bersih.replace(/^(?:menu|fitur|penerapan)\s+/i, '').trim();
      if (tanpaAwalanMenu.length >= 3) kandidatSet.add(tanpaAwalanMenu);
    });
  }

  // Isi di dalam kurung: misal "(Hardware)" atau "(Header/Field)" -> "hardware", "header", "field"
  const dalamKurungMatches = kunciRaw.match(/\(([^)]+)\)/g) || [];
  dalamKurungMatches.forEach((grup) => {
    const isi = grup.slice(1, -1);
    isi.split(/\s*(?:\/|\batau\b)\s*/i).forEach((sub) => {
      const bersih = bersihkanTeksAlfanumerik(sub);
      if (bersih && bersih.length >= 2 && !bersih.startsWith('warna ')) {
        kandidatSet.add(bersih);
      }
    });
  });

  // Pecahan langsung berdasarkan "/" atau "atau"
  kunciRaw.split(/\s*(?:\/|\batau\b)\s*/i).forEach((bag) => {
    const bersih = bersihkanTeksAlfanumerik(bag.replace(/\([^)]*\)/g, ''));
    if (bersih) kandidatSet.add(bersih);
  });

  const inputBersih = bersihkanTeksAlfanumerik(inputRaw);
  if (!inputBersih) return false;

  return kandidatSet.has(inputBersih);
}

/**
 * Filter pengaman mutlak: memastikan frasa terlarang tidak pernah muncul
 * di dalam penjelasan siswa.
 */
function saringFrasaTerlarang(teks) {
  return String(teks || '')
    .replace(/mis\s*komunikasi/gi, 'kesalahpahaman pesan')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Menyusun Penjelasan Inti secara ringkas, jelas, sesuai konsep soal SMP,
 * menguatkan jawaban benar atau meluruskan letak kekeliruan jawaban siswa.
 */
function susunPenjelasanIntiSoal(soal, benar, jawabanSiswa, semuaSoalPertemuan) {
  if (soal.pembahasanSumber) {
    return saringFrasaTerlarang(soal.pembahasanSumber);
  }

  const stemRingkas = String(soal.pertanyaan || '')
    .replace(/\s*\(Pilih[^)]*\)/gi, '')
    .replace(/\.{2,}\s*$/, '')
    .replace(/\?\s*$/, '')
    .trim();

  if (soal.type === 'pg') {
    const opsiBenar = (soal.pilihan || []).find(
      (o) => o.key === soal.kunciJawaban
    );
    const teksBenar = opsiBenar ? opsiBenar.label.replace(/\.$/, '') : soal.jawabanBenarTeks;

    if (benar) {
      return saringFrasaTerlarang(
        `Konsep yang tepat untuk "${stemRingkas}" adalah ${teksBenar} (Pilihan ${soal.kunciJawaban}), karena sesuai langsung dengan fungsi dan prinsip utama pada materi pertemuan ini.`
      );
    }

    const opsiSiswa = (soal.pilihan || []).find((o) => o.key === jawabanSiswa);
    const ketKekeliruan = opsiSiswa
      ? `Pilihan ${jawabanSiswa} (${opsiSiswa.label.replace(/\.$/, '')}) kurang tepat karena tidak menjawab kebutuhan utama pada soal. `
      : ' Soal ini belum dijawab dengan pilihan yang sesuai. ';

    return saringFrasaTerlarang(
      `${ketKekeliruan.trim()} Konsep yang benar adalah Pilihan ${soal.kunciJawaban}, yaitu ${teksBenar}.`
    );
  }

  if (soal.type === 'pg_kompleks') {
    const kunciSet = soal.kunciJawabanList || [];
    const rincianBenar = kunciSet
      .map((k) => {
        const op = (soal.pilihan || []).find((o) => o.key === k);
        return op ? `${k} (${op.label.replace(/\.$/, '')})` : k;
      })
      .join(' serta ');

    if (benar) {
      return saringFrasaTerlarang(
        `Kedua pernyataan yang tepat adalah ${rincianBenar}. Pilihan lainnya merupakan pengecoh yang bertentangan dengan cara kerja atau karakteristik konsep sebenarnya.`
      );
    }

    const dipilihArr = Array.isArray(jawabanSiswa) ? jawabanSiswa : [];
    const salahPilih = dipilihArr.filter((k) => !kunciSet.includes(k));
    const kurangPilih = kunciSet.filter((k) => !dipilihArr.includes(k));

    let koreksi = '';
    if (dipilihArr.length === 0) {
      koreksi = 'Kamu belum memilih pernyataan yang benar.';
    } else if (salahPilih.length > 0 && kurangPilih.length > 0) {
      koreksi = `Pilihan ${salahPilih.join(', ')} tidak sesuai konsep, dan kamu masih melewatkan pilihan ${kurangPilih.join(', ')}.`;
    } else if (salahPilih.length > 0) {
      koreksi = `Pilihan ${salahPilih.join(', ')} kurang tepat karena bukan karakteristik konsep yang ditanyakan.`;
    } else {
      koreksi = `Jawaban belum lengkap karena soal pilihan ganda kompleks mengharuskan memilih seluruh pernyataan yang benar (kurang pilihan ${kurangPilih.join(', ')}).`;
    }

    return saringFrasaTerlarang(
      `${koreksi} Kombinasi konsep yang benar secara utuh adalah ${rincianBenar}.`
    );
  }

  if (soal.type === 'menjodohkan') {
    // Cari pasangan menjodohkan lain di pertemuan yang sama untuk menjelaskan perbedaan konsep penting
    const pasanganLain = (semuaSoalPertemuan || []).find(
      (q) => q.type === 'menjodohkan' && q.id !== soal.id
    );
    const pembanding = pasanganLain
      ? ` Sementara itu, "${pasanganLain.jawabanBenarTeks}" merujuk pada: ${pasanganLain.pertanyaan.replace(/\.$/, '').toLowerCase()}.`
      : '';

    if (benar) {
      return saringFrasaTerlarang(
        `"${soal.jawabanBenarTeks}" merupakan istilah yang tepat untuk pernyataan "${stemRingkas}".${pembanding}`
      );
    }

    const ketSalah = jawabanSiswa
      ? `Pasangan "${jawabanSiswa}" kurang sesuai untuk pernyataan ini. `
      : '';

    return saringFrasaTerlarang(
      `${ketSalah}Pernyataan "${stemRingkas}" secara tepat berpasangan dengan konsep "${soal.jawabanBenarTeks}".${pembanding}`
    );
  }

  // Tipe Isian Singkat
  if (benar) {
    return saringFrasaTerlarang(
      `Istilah yang tepat adalah "${soal.jawabanBenarTeks}", yaitu konsep inti yang merujuk pada: ${stemRingkas}.`
    );
  }

  const infoIsianSiswa =
    typeof jawabanSiswa === 'string' && jawabanSiswa.trim()
      ? `Isian "${jawabanSiswa.trim()}" belum sesuai dengan istilah konsep yang dimaksud. `
      : '';

  return saringFrasaTerlarang(
    `${infoIsianSiswa}Untuk pernyataan "${stemRingkas}", istilah atau jawaban konsep yang benar adalah "${soal.jawabanBenarTeks}".`
  );
}

/**
 * Mengevaluasi seluruh 8 soal pertemuan secara konsisten (12,5 poin per soal = maks 100).
 */
export function evaluasiJawabanForLearning(daftarSoal, jawabanMap) {
  const hasilPerSoal = {};
  let jumlahBenar = 0;
  let poinDiperoleh = 0;

  daftarSoal.forEach((soal) => {
    const rawAns = jawabanMap ? jawabanMap[soal.id] : undefined;
    let benar = false;
    let jawabanSiswaTeks = 'Belum dijawab';

    if (soal.type === 'pg') {
      const val = typeof rawAns === 'string' ? rawAns.trim().toUpperCase() : '';
      benar = Boolean(val && val === soal.kunciJawaban);
      if (val) {
        const opt = (soal.pilihan || []).find((o) => o.key === val);
        jawabanSiswaTeks = opt ? `${val}. ${opt.label}` : val;
      }
    } else if (soal.type === 'pg_kompleks') {
      const selected = Array.isArray(rawAns)
        ? [...new Set(rawAns.map((x) => String(x).trim().toUpperCase()))].sort()
        : [];
      const expected = [...(soal.kunciJawabanList || [])].sort();
      benar =
        expected.length > 0 &&
        selected.length === expected.length &&
        selected.every((v, idx) => v === expected[idx]);
      if (selected.length > 0) {
        jawabanSiswaTeks = selected.join(', ');
      }
    } else if (soal.type === 'menjodohkan') {
      const val = typeof rawAns === 'string' ? rawAns.trim() : '';
      benar =
        val.length > 0 &&
        normalisasiTeksLonggar(val) ===
          normalisasiTeksLonggar(soal.jawabanBenarTeks);
      if (val) jawabanSiswaTeks = val;
    } else {
      const val = typeof rawAns === 'string' ? rawAns.trim() : '';
      benar = periksaJawabanIsian(val, soal.jawabanBenarTeks);
      if (val) jawabanSiswaTeks = val;
    }

    const poin = benar ? soal.bobot : 0;
    if (benar) {
      jumlahBenar += 1;
      poinDiperoleh += poin;
    }

    const penjelasanInti = susunPenjelasanIntiSoal(
      soal,
      benar,
      rawAns,
      daftarSoal
    );

    hasilPerSoal[soal.id] = {
      idSoal: soal.id,
      benar,
      poinDiperoleh: poin,
      bobotMaksimal: soal.bobot,
      jawabanSiswaTeks,
      kunciTeks: soal.jawabanBenarTeks,
      penjelasanInti,
    };
  });

  // Pembulatan presisi 1 desimal agar bebas floating-point drift
  const poinBulat = Math.round(poinDiperoleh * 10) / 10;

  return {
    hasilPerSoal,
    jumlahBenar,
    totalSoal: daftarSoal.length,
    poinDiperoleh: poinBulat,
    skorMaksimal: Math.round(daftarSoal.length * BOBOT_PER_SOAL),
  };
}

export function formatAngkaPoin(nilai) {
  const rounded = Math.round(Number(nilai || 0) * 10) / 10;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(1).replace('.', ',');
}

function ekstrakInfoKelasBab(canonicalMeetingId) {
  const match = String(canonicalMeetingId || '').match(
    /^kelas(\d+)-sem(\d+)-bab(\d+)-pertemuan(\d+)$/i
  );
  if (!match) {
    return {
      kelas: 'SMP',
      semester: '-',
      kodeBab: '-',
    };
  }
  return {
    kelas: `Kelas ${match[1]}`,
    semester: `Semester ${match[2]}`,
    kodeBab: `Bab ${match[3]}`,
  };
}

/**
 * Menyimpan jawaban dan poin siswa secara terisolasi per UID siswa + kelas + pertemuan + menu
 * pada ruang kerja non-database Firebase (IndexedDB + localStorage + Cloud Storage object delta sync)
 * TANPA menulis ke Cloud Firestore maupun Firebase Realtime Database.
 */
export async function simpanJawabanForLearningKeDatabase({
  session,
  userKey,
  meetingId,
  judulBab,
  judulPertemuan,
  daftarSoal,
  jawabanMap,
}) {
  const canonicalMeetingId = normalisasiIdPertemuanForLearning(meetingId);
  const evaluasi = evaluasiJawabanForLearning(daftarSoal, jawabanMap);
  const savedAtIso = new Date().toISOString();
  const effectiveUid = String(session?.uid || userKey || '').trim();

  if (!session || !effectiveUid || effectiveUid === 'guest') {
    return {
      ok: false,
      evaluasi,
      savedAtIso,
      errorMessage:
        'Sesi login siswa tidak valid. Silakan keluar dan login kembali.',
    };
  }

  const jawabanBersih = {};
  const ringkasanPerSoal = {};

  daftarSoal.forEach((soal) => {
    const val = jawabanMap[soal.id];
    if (Array.isArray(val)) {
      jawabanBersih[soal.id] = val.map((v) => String(v));
    } else if (typeof val === 'string') {
      jawabanBersih[soal.id] = val;
    } else {
      jawabanBersih[soal.id] = '';
    }

    const ev = evaluasi.hasilPerSoal[soal.id];
    ringkasanPerSoal[soal.id] = {
      nomorUrut: soal.nomorUrut,
      tipe: soal.type,
      benar: Boolean(ev?.benar),
      poin: Number(ev?.poinDiperoleh || 0),
    };
  });

  const infoMeta = ekstrakInfoKelasBab(canonicalMeetingId);
  const recordPayload = {
    uid: effectiveUid,
    studentKey: effectiveUid,
    kelas: infoMeta.kelas,
    semester: infoMeta.semester,
    bab: String(judulBab || infoMeta.kodeBab).slice(0, 200),
    pertemuanId: canonicalMeetingId,
    judulPertemuan: String(judulPertemuan || '').slice(0, 200),
    menu: 'for-learning',
    jawaban: jawabanBersih,
    ringkasanPerSoal,
    poinDiperoleh: evaluasi.poinDiperoleh,
    skorMaksimal: evaluasi.skorMaksimal,
    jumlahBenar: evaluasi.jumlahBenar,
    totalSoal: evaluasi.totalSoal,
    submitted: true,
    savedAtIso,
  };

  try {
    await saveNonDbMenuRecord({
      uid: effectiveUid,
      meetingId: canonicalMeetingId,
      menu: 'for-learning',
      data: recordPayload,
      updatedAtIso: savedAtIso,
    });

    return {
      ok: true,
      evaluasi,
      savedAtIso,
    };
  } catch (err) {
    console.error('Gagal menyimpan jawaban For Learning:', err);
    return {
      ok: false,
      evaluasi,
      savedAtIso,
      errorMessage: 'Gagal menyimpan, silakan coba kembali.',
    };
  }
}

/**
 * Memulihkan serta berlangganan pembaruan jawaban For Learning per UID siswa
 * dari ruang kerja non-database (localStorage + IndexedDB + Cloud Storage object sync)
 * dengan resolusi konflik otomatis (timestamp terbaru selalu menang).
 */
export function langgananJawabanForLearning(userKey, meetingId, onData) {
  const canonicalMeetingId = normalisasiIdPertemuanForLearning(meetingId);
  if (!userKey || userKey === 'guest' || !canonicalMeetingId) {
    onData(null);
    return () => {};
  }

  return subscribeNonDbMenuRecord(
    userKey,
    canonicalMeetingId,
    'for-learning',
    (envelope) => {
      const data = envelope?.data;
      if (!data || typeof data !== 'object' || !data.submitted) {
        onData(null);
        return;
      }

      onData({
        jawaban: data.jawaban || {},
        poinDiperoleh: Number(data.poinDiperoleh || 0),
        skorMaksimal: Number(data.skorMaksimal || 100),
        jumlahBenar: Number(data.jumlahBenar || 0),
        totalSoal: Number(data.totalSoal || 8),
        submitted: Boolean(data.submitted),
        savedAtIso: String(data.savedAtIso || envelope.updatedAtIso || ''),
      });
    }
  );
}
