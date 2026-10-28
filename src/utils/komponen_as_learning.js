import {
  saveNonDbMenuRecord,
  subscribeNonDbMenuRecord,
} from './firebaseSync';
import { parseJsonTolerant } from './komponen-asesmenawal';

let cachedAsLearningMap = null;

/**
 * Menormalkan ID pertemuan pada as_learning.json agar selaras 1-ke-1
 * dengan kunci katalog materi.json (termasuk kapitalisasi Kelas -> kelas
 * serta pemetaan Kelas9-sem2-bab1-* -> kelas9-sem2-bab3-*).
 */
export function normalisasiIdPertemuanAsLearning(rawId) {
  if (!rawId) return '';
  const lower = String(rawId).trim().toLowerCase();
  if (lower.startsWith('kelas9-sem2-bab1-')) {
    return lower.replace('kelas9-sem2-bab1-', 'kelas9-sem2-bab3-');
  }
  return lower;
}

/**
 * Mengekstrak informasi kelas dan semester dari ID pertemuan untuk metadata.
 */
export function ekstrakInfoKelasSemester(meetingId) {
  const canonical = normalisasiIdPertemuanAsLearning(meetingId);
  const matchKelas = canonical.match(/^kelas(\d+)/);
  const matchSem = canonical.match(/-sem(\d+)-/);
  const matchPertemuan = canonical.match(/-pertemuan(\d+)$/);

  return {
    kelas: matchKelas ? `Kelas ${matchKelas[1]}` : 'SMP',
    semester: matchSem ? `Semester ${matchSem[1]}` : 'Semester Aktif',
    nomorPertemuan: matchPertemuan ? Number(matchPertemuan[1]) : 1,
  };
}

/**
 * Membentuk sapaan huruf kapital dinamis sesuai nama pengguna yang sedang login.
 * Tidak pernah menggunakan nama statis (hardcoded).
 */
export function formatSapaanPenggunaAsLearning(session) {
  const namaMentah = String(session?.nama || '').trim();
  const namaBersih = namaMentah.length > 0 ? namaMentah.toUpperCase() : 'SOBAT INFORMATIKA';
  return `TERIMA KASIH, ${namaBersih}!`;
}

/**
 * Katalog 81 pesan apresiasi, kalimat motivasi, dan pantun edukatif 4 baris
 * yang disusun spesifik mengikuti topik pembelajaran setiap pertemuan.
 */
const KATALOG_APRESIASI_KONTEKSTUAL = {
  // ================= KELAS 7 SEMESTER 1 — BAB 1 (5 PERTEMUAN) =================
  'kelas7-sem1-bab1-pertemuan1': {
    topikSingkat: 'Data Terstruktur dan Tidak Terstruktur',
    kalimatMotivasi:
      'Keberanianmu mengamati contoh data di sekitar dan memilah mana yang terstruktur serta tidak terstruktur adalah langkah awal seorang ilmuwan data muda. Terus latih kepekaanmu melihat keteraturan di balik informasi sehari-hari!',
    pantun: [
      'Pagi cerah menyiram melati,',
      'Bunga mekar harum baunya.',
      'Data dipilah dengan teliti,',
      'Informasi rapi mudah dibaca.',
    ],
    pesanPenerapan:
      'Biasakan mengelompokkan catatan tugas dan jadwal harianmu secara terstruktur agar mudah dicari kapan saja.',
  },
  'kelas7-sem1-bab1-pertemuan2': {
    topikSingkat: 'Transformasi Cerita ke Tabel Baris dan Kolom',
    kalimatMotivasi:
      'Mengubah paragraf cerita menjadi baris dan kolom membuktikan kamu mampu menyederhanakan informasi yang panjang menjadi ringkas. Keterampilan menyusun tabel ini akan sangat membantumu di semua mata pelajaran!',
    pantun: [
      'Pergi ke pasar membeli duku,',
      'Singgah sebentar membeli pita.',
      'Baris dan kolom tersusun padu,',
      'Cerita panjang jadi bermakna.',
    ],
    pesanPenerapan:
      'Saat menemukan informasi panjang di buku pelajaran, cobalah merangkumnya ke dalam tabel perbandingan sederhana.',
  },
  'kelas7-sem1-bab1-pertemuan3': {
    topikSingkat: 'Mengenal Cell, Row, dan Column di Spreadsheet',
    kalimatMotivasi:
      'Pengalaman pertamamu mengisi jadwal pelajaran langsung ke dalam cell, row, dan column adalah fondasi penting penguasaan lembar kerja digital. Jangan ragu bereksperimen agar jarimu semakin lincah mengelola tabel!',
    pantun: [
      'Burung nuri terbang ke taman,',
      'Hinggap tenang di dahan jati.',
      'Kenali sel baris dan halaman,',
      'Jadwal tersusun rapi sekali.',
    ],
    pesanPenerapan:
      'Cobalah membuat jadwal belajar mingguanmu sendiri di lembar kerja digital agar waktumu lebih teratur.',
  },
  'kelas7-sem1-bab1-pertemuan4': {
    topikSingkat: 'Fitur Sorting, Filtering, dan Formula Dasar',
    kalimatMotivasi:
      'Berhasil mengurutkan, menyaring data, dan menjalankan rumus pertama kali menunjukkan bahwa kamu mulai menguasai cara berpikir otomatis ala komputer. Ketelitian kecil pada tanda sama dengan (=) membawa kemudahan besar!',
    pantun: [
      'Air jernih mengalir di kali,',
      'Sejuk terasa di waktu pagi.',
      'Data disaring rumus pun jadi,',
      'Hitung cepat akurat sekali.',
    ],
    pesanPenerapan:
      'Gunakan fitur pengurutan dan rumus otomatis setiap kali kamu perlu merekap data kelompok di kelas.',
  },
  'kelas7-sem1-bab1-pertemuan5': {
    topikSingkat: 'Pengelolaan Uang Kas Kelas Mandiri',
    kalimatMotivasi:
      'Menghitung pemasukan, pengeluaran, hingga saldo akhir uang kas secara mandiri membuktikan bahwa ilmu spreadsheet benar-benar bermanfaat nyata. Kejujuran dan ketelitianmu dalam mencatat angka adalah karakter yang membanggakan!',
    pantun: [
      'Menabung koin di celengan bambu,',
      'Dibuka rapi di akhir pekan.',
      'Catat uang kas dengan ilmumu,',
      'Saldo terpantau jujur dan aman.',
    ],
    pesanPenerapan:
      'Terapkan pencatatan pemasukan dan pengeluaran sederhana ini untuk mengelola uang saku mingguanmu sendiri.',
  },

  // ================= KELAS 7 SEMESTER 1 — BAB 2 (5 PERTEMUAN) =================
  'kelas7-sem1-bab2-pertemuan1': {
    topikSingkat: 'Cara Kerja Mesin Pencari Informasi',
    kalimatMotivasi:
      'Melalui aktivitas bermain peran hari ini, kamu tidak hanya memakai mesin pencari, tetapi memahami cara kerjanya menelusuri indeks informasi di balik layar. Rasa ingin tahumu membuat belajar terasa hidup dan menyenangkan!',
    pantun: [
      'Kapal berlayar menuju pulau,',
      'Kompas dijaga oleh nakhoda.',
      'Mesin pencari bijak dijangkau,',
      'Ilmu didapat tepat sasaran.',
    ],
    pesanPenerapan:
      'Pilihlah kata kunci yang spesifik setiap kali mencari referensi belajar agar hasilnya langsung tepat guna.',
  },
  'kelas7-sem1-bab2-pertemuan2': {
    topikSingkat: 'Teknik Pencarian Khusus dengan Tanda Kutip',
    kalimatMotivasi:
      'Mempraktikkan tanda kutip dan simbol pencarian khusus menjadikanmu pencari informasi yang cerdas dan efisien. Sedikit kesulitan di awal adalah tanda bahwa kamu sedang naik level dalam literasi digital!',
    pantun: [
      'Petik mangga menggunakan galah,',
      'Buah manis disimpan di peti.',
      'Tanda kutip cegah salah arah,',
      'Cari sumber cepat dan pasti.',
    ],
    pesanPenerapan:
      'Gunakan tanda kutip ("...") saat mencari istilah ilmiah atau kalimat persis di mesin pencari.',
  },
  'kelas7-sem1-bab2-pertemuan3': {
    topikSingkat: 'Analisis Akurasi dan Kebaruan Berita Digital',
    kalimatMotivasi:
      'Kebiasaan memeriksa tanggal terbit dan kelengkapan isi berita menunjukkan sikap kritis yang sangat dibutuhkan di era informasi cepat. Kamu telah belajar tidak mudah percaya hanya dari judul semata!',
    pantun: [
      'Membeli buku di kota tua,',
      'Sampul dibaca hingga halaman.',
      'Cek tanggalnya dan isi berita,',
      'Info akurat beri ketenangan.',
    ],
    pesanPenerapan:
      'Selalu periksa tanggal publikasi artikel sebelum mengutipnya untuk tugas sekolah atau membagikannya.',
  },
  'kelas7-sem1-bab2-pertemuan4': {
    topikSingkat: 'Verifikasi Penulis dan Kredibilitas Domain Situs',
    kalimatMotivasi:
      'Layaknya detektif informasi, kamu sudah mampu mengenali kredibilitas situs resmi seperti .go.id atau .ac.id serta melacak kejelasan penulisnya. Ketelitian ini adalah perisai terbaik dari informasi menyesatkan!',
    pantun: [
      'Lampu mercusuar terang berpijar,',
      'Penunjuk arah kapal berlabuh.',
      'Periksa domain sumber belajar,',
      'Rujukan sahih ilmu bertumbuh.',
    ],
    pesanPenerapan:
      'Utamakan situs lembaga resmi (.go.id, .ac.id, .sch.id) saat mencari data ilmiah dan pendidikan.',
  },
  'kelas7-sem1-bab2-pertemuan5': {
    topikSingkat: 'Investigasi Mandiri Kebenaran Informasi Viral',
    kalimatMotivasi:
      'Menyusun laporan investigasi atas berita viral membuktikan kamu tidak mudah terbawa arus kabar yang belum jelas. Kemampuan menguji bukti sebelum percaya adalah ciri pelajar berintegritas tinggi!',
    pantun: [
      'Angin berembus menggoyang dahan,',
      'Pohon kukuh berakar dalam.',
      'Kabar yang viral uji kebenaran,',
      'Warganet cerdas hati pun tenteram.',
    ],
    pesanPenerapan:
      'Tahan jempolmu sejenak saat menerima kabar heboh, lalu verifikasi kebenarannya di minimal dua sumber tepercaya.',
  },

  // ================= KELAS 7 SEMESTER 1 — BAB 3 (5 PERTEMUAN) =================
  'kelas7-sem1-bab3-pertemuan1': {
    topikSingkat: 'Membedakan Fakta dan Opini di Media Sosial',
    kalimatMotivasi:
      'Wajar sekali jika terkadang kalimat opini terdengar meyakinkan seperti fakta. Refleksimu hari ini melatih ketajaman logika agar kamu selalu bisa memisahkan data nyata dari pendapat pribadi!',
    pantun: [
      'Bening embun di pucuk padi,',
      'Sinar mentari hangat menyapa.',
      'Bedakan fakta dengan opini,',
      'Pikiran jernih tak mudah prasangka.',
    ],
    pesanPenerapan:
      'Tanyakan "apakah ada bukti datanya?" setiap kali membaca klaim menarik di linimasa media sosial.',
  },
  'kelas7-sem1-bab3-pertemuan2': {
    topikSingkat: 'Deteksi Pesan Hoaks dan Situs Pemeriksa Fakta',
    kalimatMotivasi:
      'Mengenali ciri pesan berantai yang provokatif dan mencoba situs pemeriksa fakta menjadikanmu agen penjaga kebenaran di lingkunganmu. Satu langkah cek fakta darimu bisa menyelamatkan banyak orang dari salah paham!',
    pantun: [
      'Awan kelabu tertutup kabut,',
      'Pelangi hadir sesudah hujan.',
      'Pesan berantai jangan disambut,',
      'Periksa fakta cegah kebohongan.',
    ],
    pesanPenerapan:
      'Gunakan kanal cek fakta resmi jika menerima pesan berantai yang mendesak untuk segera disebarkan.',
  },
  'kelas7-sem1-bab3-pertemuan3': {
    topikSingkat: 'Perbandingan Portal Berita Resmi dan Blog Pribadi',
    kalimatMotivasi:
      'Memahami perbedaan proses penyuntingan di portal berita resmi dibandingkan tulisan bebas di blog pribadi membuat wawasan literasimu semakin matang. Diskusi aktifmu hari ini membuka cara pandang yang bijak!',
    pantun: [
      'Menanam padi di sawah luas,',
      'Panen tiba hati gembira.',
      'Portal resmi teruji jelas,',
      'Baca cermat tambah wibawa.',
    ],
    pesanPenerapan:
      'Gunakan blog pribadi sebagai inspirasi pengalaman, namun tetap rujuk portal resmi untuk kepastian data berita.',
  },
  'kelas7-sem1-bab3-pertemuan4': {
    topikSingkat: 'Prinsip Etika Berkomentar di Media Sosial',
    kalimatMotivasi:
      'Memikirkan saran yang santun di tengah kolom komentar yang panas menunjukkan kematangan empati dan budi pekertimu. Di balik setiap layar gawai selalu ada hati manusia yang layak dihargai!',
    pantun: [
      'Harum cendana dari seberang,',
      'Disimpan rapi di dalam peti.',
      'Tutur yang santun disayang orang,',
      'Etika dijaga damai di hati.',
    ],
    pesanPenerapan:
      'Bacalah ulang komentarmu sebelum menekan tombol kirim dan pastikan kalimatnya tetap sopan bila diucapkan langsung.',
  },
  'kelas7-sem1-bab3-pertemuan5': {
    topikSingkat: 'Kampanye Kreatif Saring Sebelum Sharing',
    kalimatMotivasi:
      'Karya poster kampanye anti-hoaks yang kamu rancang adalah bukti nyata bahwa kreativitas visual dapat menebarkan kebaikan. Semangat "Saring Sebelum Sharing" kini resmi menjadi kebiasaan hebatmu!',
    pantun: [
      'Lukis pelangi di atas kertas,',
      'Warna indah memikat mata.',
      'Saring dahulu secara cerdas,',
      'Barulah bagikan kabar bermakna.',
    ],
    pesanPenerapan:
      'Jadilah teladan di grup obrolan teman dan keluarga dengan hanya membagikan informasi yang bermanfaat dan terverifikasi.',
  },

  // ================= KELAS 7 SEMESTER 2 — BAB 4 (15 PERTEMUAN) =================
  'kelas7-sem2-bab4-pertemuan1': {
    topikSingkat: 'Pemformatan Huruf Bold, Italic, dan Underline',
    kalimatMotivasi:
      'Mengenal fungsi penebalan, cetak miring, garis bawah, serta pemilihan huruf membuat tulisan perkenalan dirimu tampil jauh lebih ekspresif dan jelas. Detail tipografi kecil memberi kesan profesional yang kuat!',
    pantun: [
      'Menulis surat memakai pena,',
      'Kertas putih bersih berseri.',
      'Atur huruf tepat bermakna,',
      'Dokumen indah nyaman dicermati.',
    ],
    pesanPenerapan:
      'Gunakan huruf tebal pada judul poin penting dan huruf miring untuk istilah asing pada setiap tugas makalahmu.',
  },
  'kelas7-sem2-bab4-pertemuan2': {
    topikSingkat: 'Pengaturan Margin, Spasi, Header, dan Nomor Halaman',
    kalimatMotivasi:
      'Kerapian margin, jarak spasi, serta kelengkapan nomor halaman dan header mencerminkan ketertiban cara berpikirmu. Dokumen yang tertata rapi membuat pembaca langsung menghargai karya tulis yang kamu susun!',
    pantun: [
      'Susun buku di atas meja,',
      'Rapi sejajar sedap dipandang.',
      'Margin dan spasi tertata terjaga,',
      'Halaman bernomor takkan hilang.',
    ],
    pesanPenerapan:
      'Selalu atur ukuran kertas, batas tepi (margin), dan nomor halaman sebelum mulai mengetik laporan panjang.',
  },
  'kelas7-sem2-bab4-pertemuan3': {
    topikSingkat: 'Penyisipan Gambar, Shape, dan Text Wrapping',
    kalimatMotivasi:
      'Kemampuan memadukan teks dengan ilustrasi gambar dan bentuk melalui fitur text wrapping menunjukkan sentuhan desain dokumen yang kreatif. Tata letak yang harmonis membuat pesan tulisanmu lebih hidup!',
    pantun: [
      'Taman sekolah penuh kenanga,',
      'Kupu-kupu terbang menari.',
      'Gambar dan teks selaras tertata,',
      'Dokumen menarik enak dipelajari.',
    ],
    pesanPenerapan:
      'Pilih mode perataan gambar (text wrapping) yang pas agar paragraf di sekeliling ilustrasi tetap mudah dibaca.',
  },
  'kelas7-sem2-bab4-pertemuan4': {
    topikSingkat: 'Daftar Isi Otomatis dan Surat Massal Mail Merge',
    kalimatMotivasi:
      'Menguasai daftar isi otomatis dan Mail Merge berarti kamu telah mempelajari cara menghemat waktu kerja berjam-jam hanya dalam beberapa klik cerdas. Inilah kekuatan sejati otomasi perkantoran!',
    pantun: [
      'Kirim undangan ke penjuru desa,',
      'Amplop tersusun rapi di nampan.',
      'Daftar otomatis hemat tenaga,',
      'Mail Merge cerdas kerja ringan.',
    ],
    pesanPenerapan:
      'Terapkan gaya Heading pada setiap judul bab agar daftar isi laporanmu dapat diperbarui otomatis kapan saja.',
  },
  'kelas7-sem2-bab4-pertemuan5': {
    topikSingkat: 'Penyusunan Dokumen Laporan Kegiatan Resmi',
    kalimatMotivasi:
      'Menyelesaikan dokumen laporan kegiatan secara utuh dari awal hingga akhir adalah pencapaian luar biasa! Ketekunanmu menyusun struktur resmi membekalimu keterampilan menulis laporan untuk jenjang pendidikan berikutnya.',
    pantun: [
      'Pohon cemara tumbuh menjulang,',
      'Teduh rindang di tepi jalan.',
      'Laporan tuntas hati pun senang,',
      'Karya rapi jadi kebanggaan.',
    ],
    pesanPenerapan:
      'Periksa kembali ejaan dan keseragaman format judul sebelum menyimpan dokumen akhir ke bentuk PDF.',
  },
  'kelas7-sem2-bab4-pertemuan6': {
    topikSingkat: 'Tipe Data Teks, Angka, dan Tanggal di Spreadsheet',
    kalimatMotivasi:
      'Ketelitianmu membedakan tipe data teks, angka, dan tanggal adalah rahasia utama agar tabel pendaftaran tidak mengalami galat saat diolah. Kamu sedang membangun kebiasaan kerja data yang presisi!',
    pantun: [
      'Beli buah di pasar pagi,',
      'Pisahkan jeruk dengan pepaya.',
      'Tipe datanya tepat dikenali,',
      'Olahan tabel bebas kendala.',
    ],
    pesanPenerapan:
      'Pastikan kolom angka tidak bercampur huruf seperti "Rp" manual agar tetap bisa dihitung memakai rumus.',
  },
  'kelas7-sem2-bab4-pertemuan7': {
    topikSingkat: 'Fungsi Statistik SUM, AVERAGE, MIN, dan MAX',
    kalimatMotivasi:
      'Melihat komputer menghitung jumlah, rata-rata, nilai tertinggi, dan terendah dalam sekejap adalah bukti betapa hebatnya rumus statistik yang kamu ketikkan. Logika matematikamu dan kecanggihan teknologi kini berpadu!',
    pantun: [
      'Berhitung bintang di langit malam,',
      'Bulan purnama tampak bersinar.',
      'Rumus statistik kita genggam,',
      'Rekap nilai tuntas sebentar.',
    ],
    pesanPenerapan:
      'Manfaatkan AVERAGE, MIN, dan MAX untuk memantau perkembangan nilai ulanganmu sendiri sepanjang semester.',
  },
  'kelas7-sem2-bab4-pertemuan8': {
    topikSingkat: 'Fungsi Logika IF dan Pewarnaan Sel Bersyarat',
    kalimatMotivasi:
      'Mengajarkan komputer mengambil keputusan otomatis seperti status Lulus atau Remedial lewat fungsi IF dan pewarnaan bersyarat adalah gerbang menuju pemrograman sesungguhnya. Hebat sekali ketelitian logikamu!',
    pantun: [
      'Lampu lalu lintas memberi tanda,',
      'Hijau melaju merah berhenti.',
      'Fungsi logika tepat bekerja,',
      'Batas nilai jelas terdeteksi.',
    ],
    pesanPenerapan:
      'Gunakan Conditional Formatting untuk memberi penanda warna otomatis pada target belajar yang perlu ditingkatkan.',
  },
  'kelas7-sem2-bab4-pertemuan9': {
    topikSingkat: 'Pencarian Referensi Tabel dengan Fungsi VLOOKUP',
    kalimatMotivasi:
      'Menaklukkan fungsi VLOOKUP untuk menarik harga barang dari tabel referensi lain membuktikan ketangguhanmu menghadapi tantangan rumus tingkat lanjut. Kamu tidak mudah menyerah pada argumen rumus yang detail!',
    pantun: [
      'Mencari kamus di rak perpustakaan,',
      'Kode dibaca berurut rapi.',
      'Tabel rujukan mudah ditemukan,',
      'VLOOKUP cerdas hemat energi.',
    ],
    pesanPenerapan:
      'Kunci rentang tabel referensi secara konsisten agar pencarian VLOOKUP selalu menghasilkan nilai yang akurat.',
  },
  'kelas7-sem2-bab4-pertemuan10': {
    topikSingkat: 'Visualisasi Data dengan Grafik Batang dan Lingkaran',
    kalimatMotivasi:
      'Mengubah deretan angka pemilihan ketua OSIS menjadi grafik batang dan lingkaran membuat data mampu bercerita secara visual dalam sekali pandang. Kamu berhasil menggabungkan ketepatan angka dan keindahan tampilan!',
    pantun: [
      'Pelukis muda menggores kuas,',
      'Pemandangan gunung tampak nyata.',
      'Grafik tersaji terang dan jelas,',
      'Data bicara mudah dicerna.',
    ],
    pesanPenerapan:
      'Gunakan grafik batang untuk membandingkan jumlah dan grafik lingkaran untuk menunjukkan persentase bagian.',
  },
  'kelas7-sem2-bab4-pertemuan11': {
    topikSingkat: 'Desain Slide Presentasi dan Prinsip Kontras Warna',
    kalimatMotivasi:
      'Merancang slide tentang cita-citamu dengan memperhatikan kontras warna antara teks dan latar menunjukkan kepekaan desain komunikasi visual yang baik. Teruslah berani bermimpi besar dan menyampaikannya dengan jelas!',
    pantun: [
      'Langit biru berawan putih,',
      'Terang dipandang dari beranda.',
      'Kontras warna dipilih bersih,',
      'Pesan cita-cita sampai ke pembaca.',
    ],
    pesanPenerapan:
      'Padukan teks gelap di atas latar terang (atau sebaliknya) dan batasi jumlah kalimat di tiap slide agar audiens fokus.',
  },
  'kelas7-sem2-bab4-pertemuan12': {
    topikSingkat: 'Penyisipan Multimedia dan Transisi Slide Proporsional',
    kalimatMotivasi:
      'Kesadaranmu bahwa efek transisi sebaiknya digunakan secukupnya agar tidak mengalihkan fokus audiens adalah tanda komunikator yang matang. Gambar dan video yang tepat membuat presentasimu jauh lebih berkesan!',
    pantun: [
      'Irama musik mengalun lembut,',
      'Mengiring langkah tari daerah.',
      'Transisi halus perhatian tersambut,',
      'Presentasi fokus gagasan cerah.',
    ],
    pesanPenerapan:
      'Pilih satu gaya transisi yang konsisten di seluruh slide agar presentasimu terlihat rapi dan berkelas.',
  },
  'kelas7-sem2-bab4-pertemuan13': {
    topikSingkat: ' Konsistensi Slide Master dan Keberanian Presentasi',
    kalimatMotivasi:
      'Selain cerdas memakai Slide Master untuk menyeragamkan logo di banyak halaman, keberanianmu tampil berbicara di depan kelas patut diacungi jempol! Rasa gugup adalah hal wajar yang akan berubah menjadi percaya diri.',
    pantun: [
      'Berdiri tegak di atas panggung,',
      'Senyum ramah menyapa kawan.',
      'Slide Master rapi tak lagi bingung,',
      'Tampil berani penuh keyakinan.',
    ],
    pesanPenerapan:
      'Tarik napas tenang sebelum presentasi dan jadikan poin-poin di slide sebagai pemandu, bukan teks yang dibaca seluruhnya.',
  },
  'kelas7-sem2-bab4-pertemuan14': {
    topikSingkat: 'Integrasi Linking Grafik Spreadsheet ke Presentasi',
    kalimatMotivasi:
      'Menghubungkan grafik antaraplikasi sehingga perubahan angka otomatis memperbarui tampilan slide adalah keterampilan integrasi tingkat mahir. Ketekunanmu mencoba hingga berhasil sangat menginspirasi!',
    pantun: [
      'Dua jembatan saling bertaut,',
      'Menghubung kota seberang lautan.',
      'Data dan slide saling terkait,',
      'Angka berubah grafik terbarukan.',
    ],
    pesanPenerapan:
      'Simpan berkas tabel sumber dan berkas presentasi di dalam satu folder proyek yang sama agar tautannya terjaga.',
  },
  'kelas7-sem2-bab4-pertemuan15': {
    topikSingkat: 'Proyek Terpadu Pengolah Kata, Spreadsheet, dan Presentasi',
    kalimatMotivasi:
      'Selamat telah menuntaskan proyek akhir terpadu Kelas 7! Kamu berhasil membuktikan bagaimana pengolahan angka, laporan tertulis, dan tayangan presentasi saling melengkapi menjadi satu karya utuh yang membanggakan.',
    pantun: [
      'Tiga serangkai bunga melati,',
      'Dirangkai indah menjadi mahkota.',
      'Tiga aplikasi terpadu serasi,',
      'Proyek tuntas karya pun nyata.',
    ],
    pesanPenerapan:
      'Gunakan kolaborasi tiga aplikasi perkantoran ini untuk setiap tugas proyek penelitian lintas mata pelajaranmu.',
  },

  // ================= KELAS 8 SEMESTER 1 — BAB 1 (9 PERTEMUAN) =================
  'kelas8-sem1-bab1-pertemuan1': {
    topikSingkat: 'Empat Pilar Berpikir Komputasional pada Jadwal Piket',
    kalimatMotivasi:
      'Memetakan persoalan nyata seperti jadwal piket kelas ke dalam dekomposisi, pengenalan pola, abstraksi, dan algoritma membuktikan bahwa berpikir komputasional dekat sekali dengan keseharian kita!',
    pantun: [
      'Gotong royong membersihkan kelas,',
      'Meja tersusun lantai pun mengilap.',
      'Empat pilar dipahami jelas,',
      'Masalah rumit selesai bertahap.',
    ],
    pesanPenerapan:
      'Saat menghadapi tugas besar, biasakan memecahnya terlebih dahulu menjadi langkah-langkah kecil yang jelas urutannya.',
  },
  'kelas8-sem1-bab1-pertemuan2': {
    topikSingkat: 'Pengorganisasian Data Acak ke Tabel Terstruktur',
    kalimatMotivasi:
      'Dari mendata makanan favorit teman-teman hingga menyusunnya rapi ke tabel, kamu telah membuktikan betapa mudahnya mengambil kesimpulan saat data tertata baik. Kerja sama dan ketelitianmu luar biasa!',
    pantun: [
      'Makan siang bersama sahabat,',
      'Berbagi bekal penuh cerita.',
      'Data acak disusun cermat,',
      'Pola terlihat jelas terbaca.',
    ],
    pesanPenerapan:
      'Kumpulkan data jajak pendapat kelas dalam tabel terstruktur sebelum menentukan pilihan bersama.',
  },
  'kelas8-sem1-bab1-pertemuan3': {
    topikSingkat: 'Dekomposisi dan Pola Kepanitiaan Acara Sekolah',
    kalimatMotivasi:
      'Merancang kepanitiaan acara sekolah dengan memecah seksi tugas dan mengenali kemiripan pola kerja menunjukkan bakat kepemimpinan sekaligus logika sistematis yang hebat dalam dirimu!',
    pantun: [
      'Pentas seni meriah digelar,',
      'Semua panitia kompak bekerja.',
      'Tugas dipecah pola tergambar,',
      'Acara besar lancar terlaksana.',
    ],
    pesanPenerapan:
      'Gunakan teknik dekomposisi saat membagi tugas kerja kelompok agar setiap anggota tahu perannya dengan jelas.',
  },
  'kelas8-sem1-bab1-pertemuan4': {
    topikSingkat: 'Abstraksi dan Algoritma Pengurutan Kartu Angka',
    kalimatMotivasi:
      'Menemukan strategi tercepat untuk menyaring angka ganjil-genap dan mengurutkan kartu melatih otakmu fokus pada hal inti (abstraksi). Semangat kompetitif dan ketangkasan logikamu patut diapresiasi!',
    pantun: [
      'Kartu disusun di atas tikar,',
      'Angka kecil hingga terbesar.',
      'Fokus yang inti langkahnya benar,',
      'Algoritma cepat pikiran segar.',
    ],
    pesanPenerapan:
      'Abaikan detail yang tidak relevan (abstraksi) saat sedang mencari solusi tercepat atas suatu persoalan.',
  },
  'kelas8-sem1-bab1-pertemuan5': {
    topikSingkat: 'Pengenalan Notasi Pseudocode dari Instruksi Harian',
    kalimatMotivasi:
      'Mengubah langkah menanak nasi menjadi notasi pseudocode adalah jembatan pertamamu berbicara dalam struktur logika pemrograman. Rasa penasaranmu hari ini adalah modal berharga seorang calon programmer!',
    pantun: [
      'Beras dicuci dimasak hangat,',
      'Harum pandan menggugah selera.',
      'Urutan langkah ditulis tepat,',
      'Pseudocode jelas mudah dibaca.',
    ],
    pesanPenerapan:
      'Biasakan menuliskan alur rencana program dalam pseudocode singkat sebelum mulai menyusun kode di komputer.',
  },
  'kelas8-sem1-bab1-pertemuan6': {
    topikSingkat: 'Pseudocode Runtutan (Sequential) dan Variabel Luas',
    kalimatMotivasi:
      'Keberhasilanmu menyiapkan variabel input hingga rumus output luas bangun datar secara berurutan membuktikan logika sekuensialmu sudah mantap. Rasa bangga setelah melewati kebingungan itu sangat layak kamu rayakan!',
    pantun: [
      'Mengukur taman memakai mistar,',
      'Panjang dan lebar dicatat rapi.',
      'Variabel siap rumus digelar,',
      'Alur beruntun hasil pun pasti.',
    ],
    pesanPenerapan:
      'Pastikan setiap variabel yang dipakai dalam rumus perhitungan sudah dideklarasikan dan diberi nilai masukan terlebih dahulu.',
  },
  'kelas8-sem1-bab1-pertemuan7': {
    topikSingkat: 'Struktur Percabangan Kondisional IF-THEN-ELSE',
    kalimatMotivasi:
      'Merancang aturan syarat naik wahana bermain dengan IF-THEN-ELSE melatihmu mengantisipasi berbagai kemungkinan secara adil dan presisi. Kamu telah menguasai cara komputer mengambil keputusan!',
    pantun: [
      'Pergi tamasya ke taman ria,',
      'Antre tertib di pintu depan.',
      'Jika memenuhi syaratnya tiba,',
      'Cabang logika beri keputusan.',
    ],
    pesanPenerapan:
      'Periksa selalu kedua cabang kondisi (benar maupun salah) agar algoritmamu tidak menyisakan celah kasus.',
  },
  'kelas8-sem1-bab1-pertemuan8': {
    topikSingkat: 'Struktur Perulangan Looping FOR dan WHILE',
    kalimatMotivasi:
      'Rasa takjubmu melihat puluhan baris perintah berulang diringkas menjadi beberapa baris FOR atau WHILE menunjukkan kamu telah menangkap esensi efisiensi pemrograman. Kerja cerdas, bukan sekadar kerja berulang!',
    pantun: [
      'Kincir angin berputar tenang,',
      'Menggerak pompa di tepi sawah.',
      'Perintah panjang ringkas berulang,',
      'Looping bekerja cepat dan mudah.',
    ],
    pesanPenerapan:
      'Pastikan setiap perulangan memiliki batas berhenti yang jelas agar program tidak berputar tanpa henti.',
  },
  'kelas8-sem1-bab1-pertemuan9': {
    topikSingkat: 'Pemecahan Masalah Diskon Kantin dengan Pseudocode',
    kalimatMotivasi:
      'Menyelesaikan studi kasus perhitungan diskon kantin secara mandiri menggabungkan variabel, runtutan, dan percabangan sekaligus. Kamu berhasil menutup bab berpikir komputasional dengan pemahaman yang utuh!',
    pantun: [
      'Beli roti di kantin sekolah,',
      'Hitung kembalian dengan teliti.',
      'Variabel dan syarat disusun terarah,',
      'Kasus terpecah tuntas mandiri.',
    ],
    pesanPenerapan:
      'Ujilah algoritmamu menggunakan minimal dua contoh angka (yang mendapat diskon dan yang tidak) untuk memastikan kebenarannya.',
  },

  // ================= KELAS 8 SEMESTER 1 — BAB 2 (4 PERTEMUAN) =================
  'kelas8-sem1-bab2-pertemuan1': {
    topikSingkat: 'Perangkat Keras Input, Process, Output, dan Storage',
    kalimatMotivasi:
      'Mengenali peran masing-masing perangkat keras dari papan ketik hingga monitor membuatmu paham bagaimana komputer berinteraksi dengan dunia luar. Pengetahuan dasar perangkat keras ini sangat berguna sepanjang waktu!',
    pantun: [
      'Roda berputar menggerak kereta,',
      'Melaju kencang menuju kota.',
      'Input proses output bekerja,',
      'Perangkat keras saling menata.',
    ],
    pesanPenerapan:
      'Rawat kebersihan perangkat input dan output di lab maupun di rumah agar masa pakainya tetap awet.',
  },
  'kelas8-sem1-bab2-pertemuan2': {
    topikSingkat: 'Sistem Operasi dan Perangkat Lunak Aplikasi',
    kalimatMotivasi:
      'Menjelajahi langsung gawai atau komputermu sendiri membuat perbedaan antara sistem operasi sebagai pengelola utama dan aplikasi sebagai alat bantu kerja menjadi sangat nyata. Eksplorasi yang cerdas!',
    pantun: [
      'Rumah berdiri di atas fondasi,',
      'Ruangan tertata indah sekali.',
      'Sistem operasi menjadi inti,',
      'Aplikasi jalan lancar terkendali.',
    ],
    pesanPenerapan:
      'Hapus aplikasi yang sudah tidak terpakai di perangkatmu agar ruang penyimpanan dan kinerja sistem operasi tetap lega.',
  },
  'kelas8-sem1-bab2-pertemuan3': {
    topikSingkat: 'Siklus Kerja CPU Fetch, Decode, dan Execute',
    kalimatMotivasi:
      'Bermain peran menjadi bagian dari CPU menyadarkan kita betapa cepat dan kompaknya unit kendali, ALU, serta memori menerjemahkan perintah setiap detik. Kerja sama timmu hari ini seru dan bermakna!',
    pantun: [
      'Detak arloji beriring rapi,',
      'Menunjuk waktu sepanjang hari.',
      'Ambil terjemah lalu eksekusi,',
      'Otak komputer sigap beraksi.',
    ],
    pesanPenerapan:
      'Hindari membuka terlalu banyak program berat bersamaan agar memori utama (RAM) dan CPU bekerja optimal.',
  },
  'kelas8-sem1-bab2-pertemuan4': {
    topikSingkat: 'Analisis dan Investigasi Kendala Perangkat Komputer',
    kalimatMotivasi:
      'Menyelidiki mengapa printer menyala tetapi gagal mencetak dokumen melatih pola pikir diagnostik layaknya teknisi andal: memeriksa kabel, driver, hingga antrean cetak secara tenang tanpa panik!',
    pantun: [
      'Lampu menyala kertas tersedia,',
      'Namun cetakan belum keluar.',
      'Cek penghubungnya dengan seksama,',
      'Masalah tuntas pikiran sabar.',
    ],
    pesanPenerapan:
      'Saat perangkat mengalami kendala, periksa sambungan fisik dan pengaturan perangkat lunak secara bertahap sebelum menyimpulkan rusak.',
  },

  // ================= KELAS 8 SEMESTER 2 — BAB 3 (6 PERTEMUAN) =================
  'kelas8-sem2-bab3-pertemuan1': {
    topikSingkat: 'Konsep Jaringan Lokal (LAN) di Laboratorium',
    kalimatMotivasi:
      'Menggambar skema jaringan lokal lab komputer membantumu melihat bagaimana perangkat saling berbagi berkas dan sumber daya dengan efisien. Langkah awal yang hebat menuju dunia rekayasa jaringan!',
    pantun: [
      'Jembatan kayu menghubung desa,',
      'Warga melintas saling menyapa.',
      'Jaringan lokal terhubung mesra,',
      'Kirim dokumen cepat bersama.',
    ],
    pesanPenerapan:
      'Manfaatkan fitur berbagi berkas jaringan lokal yang aman saat mengerjakan proyek bersama di laboratorium sekolah.',
  },
  'kelas8-sem2-bab3-pertemuan2': {
    topikSingkat: 'Kabel UTP, Fiber Optik, dan Perangkat Switch',
    kalimatMotivasi:
      'Mengamati langsung serat kaca fiber optik, pilinan kabel UTP, serta peran switch membuat konsep transmisi data terasa nyata di tanganmu. Rasa ingin tahumu yang terjawab hari ini akan terus melekat di ingatan!',
    pantun: [
      'Cahaya kilat menembus kaca,',
      'Terang benderang sampai tujuan.',
      'Switch membagi jalur datanya,',
      'Kabel tersambung cepat hantaran.',
    ],
    pesanPenerapan:
      'Jangan menekuk kabel jaringan terlalu tajam agar serat penghantar di dalamnya tidak patah atau menurunkan sinyal.',
  },
  'kelas8-sem2-bab3-pertemuan3': {
    topikSingkat: 'Perbandingan Konektivitas Nirkabel Wi-Fi dan Bluetooth',
    kalimatMotivasi:
      'Melalui percobaan pengiriman foto secara langsung, kamu kini tahu kapan sebaiknya mengandalkan kecepatan dan jangkauan Wi-Fi atau kepraktisan jarak dekat Bluetooth. Belajar lewat eksperimen selalu seru!',
    pantun: [
      'Burung merpati terbang melayang,',
      'Membawa pesan lintas samudra.',
      'Gelombang nirkabel tak tampak pandang,',
      'Foto terkirim dalam sekejap mata.',
    ],
    pesanPenerapan:
      'Matikan fitur Bluetooth dan Wi-Fi saat sedang tidak digunakan di perjalanan untuk menghemat baterai sekaligus menjaga keamanan.',
  },
  'kelas8-sem2-bab3-pertemuan4': {
    topikSingkat: 'Pengalamatan IP Address, DNS, dan Router',
    kalimatMotivasi:
      'Memahami peran DNS sebagai "buku telepon internet" yang menerjemahkan nama situs ke alamat IP membuat cara kerja internet tidak lagi terasa misterius bagimu. Penjelajahan teknologimu makin mendalam!',
    pantun: [
      'Cari alamat melihat peta,',
      'Nomor rumahnya jelas tertera.',
      'DNS sigap menerjemah nama,',
      'Alamat IP tepat mengarah.',
    ],
    pesanPenerapan:
      'Periksa ejaan nama domain situs dengan teliti di bilah alamat agar DNS mengarahkanmu ke situs yang benar.',
  },
  'kelas8-sem2-bab3-pertemuan5': {
    topikSingkat: 'Keamanan Jaringan Wi-Fi Publik dan Enkripsi HTTPS',
    kalimatMotivasi:
      'Sikap waspada setelah memahami risiko Wi-Fi umum dan situs tanpa gembok HTTPS adalah bentuk perlindungan diri yang sangat cerdas. Waspada bukan berarti takut, melainkan bijak menjaga privasi!',
    pantun: [
      'Kunci gerbang sebelum tidur,',
      'Rumah terjaga sepanjang malam.',
      'Hindari login di jalur kabur,',
      'Gembok HTTPS buatmu aman.',
    ],
    pesanPenerapan:
      'Hindari memasukkan kata sandi akun penting ketika sedang terhubung ke jaringan Wi-Fi terbuka di tempat umum.',
  },
  'kelas8-sem2-bab3-pertemuan6': {
    topikSingkat: 'Perancangan Topologi Jaringan Sekolah',
    kalimatMotivasi:
      'Merancang tata letak router dan switch untuk menghubungkan lab dengan perpustakaan sekolah menempatkanmu sebagai arsitek jaringan muda. Tantangan menarik garis jalur hari ini mengasah perencanaan spasial dan teknis!',
    pantun: [
      'Gambar denah di kertas lebar,',
      'Ruang pustaka dekat halaman.',
      'Router dan switch tepat disebar,',
      'Internet sekolah lancar nyaman.',
    ],
    pesanPenerapan:
      'Tempatkan pemancar jaringan di posisi strategis yang minim halangan tembok tebal agar sinyal merata.',
  },

  // ================= KELAS 8 SEMESTER 2 — BAB 4 (9 PERTEMUAN) =================
  'kelas8-sem2-bab4-pertemuan1': {
    topikSingkat: 'Mengenali Bentuk Perundungan Siber (Cyberbullying)',
    kalimatMotivasi:
      'Rasa sedih atau prihatin saat membaca contoh komentar menyakitkan membuktikan bahwa hatimu memiliki empati yang sehat. Mengenali batas antara candaan dan perundungan adalah langkah awal menciptakan ruang digital ramah!',
    pantun: [
      'Air sejuk di dalam kendi,',
      'Hilangkan dahaga di siang hari.',
      'Jaga tulisan jaga kendali,',
      'Tolak rundungan mulai dari diri.',
    ],
    pesanPenerapan:
      'Jangan pernah ikut menyukai atau meneruskan unggahan yang merendahkan martabat teman di dunia maya.',
  },
  'kelas8-sem2-bab4-pertemuan2': {
    topikSingkat: 'Dampak Psikologis dan Konsekuensi Hukum Cyberbullying',
    kalimatMotivasi:
      'Menyadari betapa beratnya luka batin korban sekaligus tegasnya aturan hukum atas perundungan digital membuat kita semakin berhati-hati dalam bertindak. Jadilah teman yang menguatkan, bukan menjatuhkan!',
    pantun: [
      'Pohon bambu tumbuh berjajar,',
      'Rukun bersama menahan angin.',
      'Hukum berlaku adil dan benar,',
      'Saling menghormati hidup pun tentram.',
    ],
    pesanPenerapan:
      'Rangkul dan dengarkan teman yang tampak murung akibat perlakuan tidak menyenangkan di media sosial, lalu ajak melapor ke guru BK.',
  },
  'kelas8-sem2-bab4-pertemuan3': {
    topikSingkat: 'Bukti Tangkapan Layar dan Pelaporan Cyberbullying',
    kalimatMotivasi:
      'Mengetahui langkah menyimpan bukti screenshot, memblokir, dan melaporkan akun perundung memberimu keberanian nyata untuk melindungi diri maupun sesama. Kamu kini jauh lebih siap dan berdaya di ruang siber!',
    pantun: [
      'Payung dibuka saat gerimis,',
      'Langkah terjaga sampai ke rumah.',
      'Simpan buktinya secara taktis,',
      'Lapor berani cegah masalah.',
    ],
    pesanPenerapan:
      'Simpan bukti tangkapan layar utuh beserta waktu kejadian sebelum memblokir atau melaporkan tindakan perundungan.',
  },
  'kelas8-sem2-bab4-pertemuan4': {
    topikSingkat: 'Rekam Jejak Digital Aktif dan Pasif',
    kalimatMotivasi:
      'Mencari namamu sendiri di mesin pencari memberi kesadaran berharga bahwa setiap unggahan meninggalkan jejak. Mulai hari ini, kamu memegang kendali penuh untuk mengukir jejak digital yang positif!',
    pantun: [
      'Melangkah kaki di pasir pantai,',
      'Tapak terlihat di tepi lautan.',
      'Jejak digital janganlah lalai,',
      'Ukir prestasi jadi kenangan.',
    ],
    pesanPenerapan:
      'Isilah jejak digital aktifmu dengan karya kreatif, catatan belajar, dan aktivitas positif yang membanggakan.',
  },
  'kelas8-sem2-bab4-pertemuan5': {
    topikSingkat: 'Dampak Rekam Jejak Digital bagi Masa Depan',
    kalimatMotivasi:
      'Belajar dari kisah nyata betapa unggahan iseng dapat memengaruhi masa depan membuat pemikiranmu jauh lebih dewasa. Berpikir panjang sebelum mengunggah adalah investasi terbaik bagi reputasi dirimu kelak!',
    pantun: [
      'Menanam bibit pohon mangga,',
      'Kelak berbuah manis rasanya.',
      'Unggahan bijak selalu dijaga,',
      'Masa depan cerah menanti kita.',
    ],
    pesanPenerapan:
      'Terapkan aturan emas: jangan unggah apa pun hari ini yang akan membuatmu malu bila dibaca lima tahun mendatang.',
  },
  'kelas8-sem2-bab4-pertemuan6': {
    topikSingkat: 'Manajemen Privasi Akun dan Kebersihan Digital',
    kalimatMotivasi:
      'Mempraktikkan pengaturan akun privat dan membersihkan riwayat peramban menunjukkan tanggung jawab mandiri atas keamanan datamu. Sedikit waktu untuk merapikan setelan privasi memberi ketenangan jangka panjang!',
    pantun: [
      'Menyapu halaman di pagi hari,',
      'Udara segar sehat terasa.',
      'Atur privasi bersihkan histori,',
      'Akun terlindung aman sentosa.',
    ],
    pesanPenerapan:
      'Tinjau ulang pengaturan privasi akun media sosialmu secara berkala dan keluarkan sesi login dari perangkat umum.',
  },
  'kelas8-sem2-bab4-pertemuan7': {
    topikSingkat: 'Etika Komunikasi Santun (Netiquette) kepada Guru',
    kalimatMotivasi:
      'Usahamu merangkai ulang kalimat pesan/email agar memiliki salam, identitas diri, dan bahasa yang menghormati guru adalah keterampilan komunikasi seumur hidup. Kesantunan selalu membuka pintu apresiasi!',
    pantun: [
      'Mengetuk pintu ucapkan salam,',
      'Tuan rumah menyambut hangat.',
      'Pesan tertulis santun mendalam,',
      'Komunikasi baik penuh hormat.',
    ],
    pesanPenerapan:
      'Awali pesan resmi kepada guru dengan salam, sebutkan nama lengkap serta kelasmu, dan akhiri dengan ucapan terima kasih.',
  },
  'kelas8-sem2-bab4-pertemuan8': {
    topikSingkat: 'Menghargai Perbedaan Pandangan di Forum Online',
    kalimatMotivasi:
      'Mampu menahan emosi dan membalas perbedaan pendapat secara ramah di ruang diskusi adalah bukti kecerdasan emosional yang luar biasa. Berbeda pandangan itu biasa, tetap santun itu baru juara!',
    pantun: [
      'Taman indah aneka warna,',
      'Mawar melati tumbuh berdamping.',
      'Beda pendapat tetap saudara,',
      'Bahasa ramah cegah berselisih.',
    ],
    pesanPenerapan:
      'Tanggapi gagasan atau argumennya dengan alasan yang sopan tanpa pernah menyerang pribadi lawan bicara.',
  },
  'kelas8-sem2-bab4-pertemuan9': {
    topikSingkat: 'Kampanye Kewargaan Digital dan Internet Sehat',
    kalimatMotivasi:
      'Poster kampanye internet sehat buatanmu menutup perjalanan Kelas 8 dengan pesan kebaikan yang menginspirasi seluruh kelas. Jadilah pelopor warganet muda yang cerdas, berempati, dan bertanggung jawab!',
    pantun: [
      'Layar terkembang perahu melaju,',
      'Menuju pulau harapan baru.',
      'Internet sehat kita bersatu,',
      'Warganet bijak Indonesia maju.',
    ],
    pesanPenerapan:
      'Sebarkan semangat internet sehat tidak hanya lewat poster, tetapi juga lewat teladan sikap ramahmu setiap hari.',
  },

  // ================= KELAS 9 SEMESTER 1 — BAB 1 (8 PERTEMUAN) =================
  'kelas9-sem1-bab1-pertemuan1': {
    topikSingkat: 'Eksplorasi Antarmuka Scratch: Stage, Sprite, dan Blok Kode',
    kalimatMotivasi:
      'Mengenal panggung (stage), karakter (sprite), dan palet blok kode di Scratch membuka ruang kanvas tak terbatas bagi imajinasimu. Langkah pertamamu di Kelas 9 dimulai dengan rasa ingin tahu yang hebat!',
    pantun: [
      'Buka jendela melihat taman,',
      'Panggung luas terang bercahaya.',
      'Sprite dan blok siap disandingkan,',
      'Awal berkarya penuh gembira.',
    ],
    pesanPenerapan:
      'Beri nama yang jelas pada setiap sprite di proyekmu agar mudah dikenali ketika jumlah objek bertambah banyak.',
  },
  'kelas9-sem1-bab1-pertemuan2': {
    topikSingkat: 'Blok Perintah Dasar Gerak dan Sapaan di Scratch',
    kalimatMotivasi:
      'Senyum banggamu saat melihat sprite benar-benar bergerak dan menyapa sesuai susunan blok perintahmu adalah momen magis seorang pembuat program. Kamu kini bukan hanya pemain, melainkan pencipta!',
    pantun: [
      'Wayang bergerak mengikuti dalang,',
      'Cerita indah memikat hati.',
      'Blok disusun berurut terang,',
      'Sprite menyapa lincah menari.',
    ],
    pesanPenerapan:
      'Tambahkan jeda waktu singkat di antara blok gerak dan dialog agar animasi percakapan terlihat alami.',
  },
  'kelas9-sem1-bab1-pertemuan3': {
    topikSingkat: 'Kontrol Perulangan Blok Repeat dan Forever di Scratch',
    kalimatMotivasi:
      'Memahami kapan harus memakai blok Repeat yang terukur dan kapan memakai Forever yang terus berjalan membuat susunan blokmu jauh lebih ringkas dan rapi. Kebingungan yang berhasil kamu atasi hari ini membuatmu makin mahir!',
    pantun: [
      'Jarum jam terus berputar,',
      'Lonceng berbunyi tepat hitungan.',
      'Blok perulangan tepat digelar,',
      'Kode pun ringkas hemat susunan.',
    ],
    pesanPenerapan:
      'Gunakan Repeat untuk gerak dengan jumlah langkah pasti dan Forever untuk pemantauan latar selama permainan berlangsung.',
  },
  'kelas9-sem1-bab1-pertemuan4': {
    topikSingkat: 'Percabangan Blok If-Then-Else pada Simulasi Tebak Angka',
    kalimatMotivasi:
      'Merancang reaksi sprite saat tebakan benar maupun salah dengan blok If-Then-Else menghidupkan interaktivitas programmu. Tantangan merangkai kondisi logika telah berhasil kamu taklukkan dengan gemilang!',
    pantun: [
      'Main tebakan di waktu senggang,',
      'Jawab tepat dapat pujian.',
      'Jika benar sorak pun datang,',
      'Blok percabangan atur jawaban.',
    ],
    pesanPenerapan:
      'Berikan pesan petunjuk yang ramah pada bagian Else agar pemain termotivasi mencoba menebak kembali.',
  },
  'kelas9-sem1-bab1-pertemuan5': {
    topikSingkat: 'Pemanfaatan Variabel Skor pada Program Interaktif',
    kalimatMotivasi:
      'Menambahkan variabel skor yang berubah otomatis menjadikan program hitung-hitunganmu terasa seperti gim edukasi sungguhan! Kamu telah memahami bagaimana komputer menyimpan dan memperbarui nilai di memori.',
    pantun: [
      'Papan angka di tepi lapangan,',
      'Bertambah satu setiap gol tiba.',
      'Variabel skor simpan hitungan,',
      'Kuis interaktif makin menggembira.',
    ],
    pesanPenerapan:
      'Selalu pasang blok pengatur nilai awal skor ke angka nol (set score to 0) tepat di bawah bendera hijau dimulai.',
  },
  'kelas9-sem1-bab1-pertemuan6': {
    topikSingkat: 'Perancangan Storyboard dan Logika Proyek Game Edukasi',
    kalimatMotivasi:
      'Menyatukan beragam ide teman sekelompok ke dalam satu storyboard dan alur logika yang utuh melatih kolaborasi layaknya tim pengembang gim profesional. Perencanaan matang adalah separuh dari keberhasilan proyek!',
    pantun: [
      'Arsitek bijak menggambar sketsa,',
      'Gedung dibangun kokoh berdiri.',
      'Storyboard rapi satukan karsa,',
      'Rancangan gim siap dieksekusi.',
    ],
    pesanPenerapan:
      'Bagi tugas pembuatan aset visual dan penyusunan logika blok secara seimbang di dalam tim kelompokmu.',
  },
  'kelas9-sem1-bab1-pertemuan7': {
    topikSingkat: 'Pengujian dan Perbaikan Kesalahan Kode (Debugging)',
    kalimatMotivasi:
      'Setiap programmer hebat pasti bertemu bug, dan kesabaranmu menelusuri letak kesalahan hingga gim kembali berjalan mulus adalah bukti mental pantang menyerah yang luar biasa!',
    pantun: [
      'Benang kusut diurai pelan,',
      'Tenun tersambung rapi kembali.',
      'Lacak eror dengan ketelitian,',
      'Program pun lancar hati berseri.',
    ],
    pesanPenerapan:
      'Uji programmu sedikit demi sedikit setiap selesai menambah fitur baru agar sumber bug mudah dilacak.',
  },
  'kelas9-sem1-bab1-pertemuan8': {
    topikSingkat: 'Demonstrasi Karya Proyek Scratch dan Refleksi Komputasional',
    kalimatMotivasi:
      'Mempresentasikan gim edukasi hasil keringat kelompokmu di depan teman-teman adalah puncak kebanggaan Bab 1! Kamu telah membuktikan empat pilar berpikir komputasional mampu melahirkan karya nyata yang bermanfaat.',
    pantun: [
      'Layar menyala karya ditampilkan,',
      'Tepuk tangan riuh bergema.',
      'Logika teruji gim dijalankan,',
      'Karya kreatif kebanggaan bersama.',
    ],
    pesanPenerapan:
      'Catat masukan positif dari teman-teman saat demonstrasi sebagai ide pengembangan karya kodingmu berikutnya.',
  },

  // ================= KELAS 9 SEMESTER 1 — BAB 2 (7 PERTEMUAN) =================
  'kelas9-sem1-bab2-pertemuan1': {
    topikSingkat: 'Karakteristik Media Sosial dan Forum Diskusi Virtual',
    kalimatMotivasi:
      'Ketajamanmu membandingkan karakter media sosial dan forum diskusi membantumu memilih ruang publik virtual yang paling tepat untuk berbagi ide maupun berdiskusi mendalam.',
    pantun: [
      'Balai warga tempat bermufakat,',
      'Duduk melingkar bertukar pikiran.',
      'Kenali platform secara tepat,',
      'Ruang virtual kaya manfaatnya.',
    ],
    pesanPenerapan:
      'Sesuaikan gaya komunikasi dan jenis konten dengan tujuan ruang platform digital yang sedang kamu gunakan.',
  },
  'kelas9-sem1-bab2-pertemuan2': {
    topikSingkat: 'Transformasi Komentar Santun Sesuai Aturan Netiquette',
    kalimatMotivasi:
      'Kemampuan mengubah kalimat kasar menjadi tanggapan santun tanpa menghilangkan pesan intinya menunjukkan kedewasaan berkomunikasi di ruang publik virtual. Kata-kata baikmu menularkan ketenangan!',
    pantun: [
      'Air tenang menghanyutkan perahu,',
      'Angin sepoi menyejukkan dada.',
      'Ubah kalimat kasar berlalu,',
      'Netiquette santun indahkan suasana.',
    ],
    pesanPenerapan:
      'Sampaikan kritik atau masukan secara membangun dengan memilih diksi yang tetap menghargai karya orang lain.',
  },
  'kelas9-sem1-bab2-pertemuan3': {
    topikSingkat: 'Produksi Desain Visual Kartu Ucapan Digital',
    kalimatMotivasi:
      'Memadukan tipografi, palet warna, dan elemen ilustrasi pada kartu ucapan elektronik pertamamu membuktikan bahwa teknologi digital adalah medium indah untuk menyampaikan apresiasi dan kreativitas!',
    pantun: [
      'Merangkai bunga di pagi cerah,',
      'Pita diikat manis menawan.',
      'Warna dan huruf berpadu indah,',
      'Kartu digital eratkan kawan.',
    ],
    pesanPenerapan:
      'Sisakan ruang kosong (whitespace) yang cukup di sekitar teks utama agar desain visualmu tampak bersih dan lega.',
  },
  'kelas9-sem1-bab2-pertemuan4': {
    topikSingkat: 'Pembuatan Infografis dan Poster Edukatif Literasi Digital',
    kalimatMotivasi:
      'Merancang infografis anti-hoaks berarti kamu sedang mengubah ilmu yang kamu pelajari menjadi karya visual yang mudah dipahami masyarakat luas. Kreativitasmu membawa dampak edukatif yang nyata!',
    pantun: [
      'Menara tinggi tampak di ujung,',
      'Cahaya terang memandu jalan.',
      'Poster edukasi kita junjung,',
      'Literasi tumbuh hoaks pun hilang.',
    ],
    pesanPenerapan:
      'Susun informasi di dalam infografis dari atas ke bawah dengan poin singkat agar pembaca menangkap pesan dalam lima detik.',
  },
  'kelas9-sem1-bab2-pertemuan5': {
    topikSingkat: 'Hak Cipta (Copyright) dan Lisensi Terbuka Creative Commons',
    kalimatMotivasi:
      'Memahami perbedaan Copyright dan Creative Commons menjadikanmu kreator muda yang beretika dan taat hukum. Menghargai hak cipta orang lain adalah cara terbaik agar karyamu sendiri kelak juga dihormati!',
    pantun: [
      'Petik buah di kebun sendiri,',
      'Izin diminta kepada pemiliknya.',
      'Lisensi karya kita hormati,',
      'Berkarya jujur tenang hatinya.',
    ],
    pesanPenerapan:
      'Gunakan aset berlisensi Creative Commons dan cantumkan kredit penciptanya saat membuat konten publik.',
  },
  'kelas9-sem1-bab2-pertemuan6': {
    topikSingkat: 'Penulisan Takarir (Caption) dan Diseminasi Mading Virtual',
    kalimatMotivasi:
      'Keberhasilanmu menyusun caption yang informatif serta mengunggah karya ke mading virtual sekolah menunjukkan kesiapanmu tampil bertanggung jawab di ruang publik digital!',
    pantun: [
      'Mading sekolah penuh hiasan,',
      'Siswa berkumpul membaca berita.',
      'Caption santun kuatkan pesan,',
      'Unggahan positif tebarkan cita.',
    ],
    pesanPenerapan:
      'Lengkapi unggahan edukatifmu dengan kalimat pengantar yang jelas, sumber informasi, dan tagar yang relevan.',
  },
  'kelas9-sem1-bab2-pertemuan7': {
    topikSingkat: 'Pameran Karya (Gallery Walk) dan Apresiasi Teman',
    kalimatMotivasi:
      'Saling mengamati karya dan bertukar pujian tulus saat gallery walk menumbuhkan budaya kolaborasi yang hangat. Belajar dari kelebihan karya teman akan memperkaya ide kreatifmu sendiri!',
    pantun: [
      'Jalan bersama di taman seni,',
      'Lukisan indah berjajar rapi.',
      'Saling menghargai karya sendiri,',
      'Tumbuh bersama makin berprestasi.',
    ],
    pesanPenerapan:
      'Berikan umpan balik yang spesifik atas hal baik yang kamu lihat dari karya teman untuk menyemangati mereka.',
  },

  // ================= KELAS 9 SEMESTER 2 — BAB 3 (8 PERTEMUAN) =================
  'kelas9-sem2-bab3-pertemuan1': {
    topikSingkat: 'Mengenal Ancaman Malware: Ransomware dan Spyware',
    kalimatMotivasi:
      'Mengenali perbedaan cara kerja ransomware yang menyandera data dan spyware yang mengintai diam-diam tidak perlu membuatmu cemas berlebihan—pengetahuan justru memberimu tameng kewaspadaan yang kokoh!',
    pantun: [
      'Benteng batu berdiri teguh,',
      'Penjaga sigap di pintu depan.',
      'Kenali malware jangan terpengaruh,',
      'Unduh yang resmi perangkat pun aman.',
    ],
    pesanPenerapan:
      'Unduh perangkat lunak hanya dari toko aplikasi resmi dan jangan pernah membuka lampiran berkas mencurigakan.',
  },
  'kelas9-sem2-bab3-pertemuan2': {
    topikSingkat: 'Praktik Pengamanan Antivirus, Firewall, dan Update Sistem',
    kalimatMotivasi:
      'Mempraktikkan langsung pengecekan pembaruan sistem, pemindaian antivirus, dan pengaktifan firewall menjadikanmu penjaga tangguh bagi kesehatan perangkat digitalmu sendiri!',
    pantun: [
      'Rawat kebun setiap pekan,',
      'Hama disingkir tanaman subur.',
      'Firewall nyala sistem terbarukan,',
      'Perangkat sehat kerja teratur.',
    ],
    pesanPenerapan:
      'Jangan menunda pembaruan keamanan sistem operasi karena setiap pembaruan menutup celah kerentanan terbaru.',
  },
  'kelas9-sem2-bab3-pertemuan3': {
    topikSingkat: 'Penyusunan Kata Sandi Kuat dan Manajemen Kredensial',
    kalimatMotivasi:
      'Rasa percaya dirimu setelah mampu meracik kombinasi huruf besar, huruf kecil, angka, dan simbol yang unik namun mudah kamu ingat adalah langkah besar melindungi identitas digitalmu!',
    pantun: [
      'Peti pusaka berkunci baja,',
      'Disimpan rapat di ruang dalam.',
      'Sandi yang kuat unik dirangkai,',
      'Akun pribadi terlindung tenteram.',
    ],
    pesanPenerapan:
      'Gunakan kata sandi yang berbeda untuk akun utama seperti email dibandingkan akun permainan atau layanan lainnya.',
  },
  'kelas9-sem2-bab3-pertemuan4': {
    topikSingkat: 'Perlindungan Berlapis Autentikasi Dua Langkah (2FA)',
    kalimatMotivasi:
      'Menyadari betapa mudah dan ampuhnya autentikasi dua langkah (2FA) mencegah pengambilalihan akun membekalimu standar keamanan modern. Dua kunci selalu jauh lebih tangguh daripada satu!',
    pantun: [
      'Pintu utama berlapis gerbang,',
      'Tamu masuk harus dikenali.',
      'Dua langkah pengaman dipasang,',
      'Akun emailmu terjaga pasti.',
    ],
    pesanPenerapan:
      'Aktifkan fitur verifikasi dua langkah (2FA) pada akun email utama dan media sosial pribadimu hari ini.',
  },
  'kelas9-sem2-bab3-pertemuan5': {
    topikSingkat: 'Klasifikasi Informasi Privat Rahasia dan Informasi Publik',
    kalimatMotivasi:
      'Paham mengapa data sensitif seperti NIK dan nama gadis ibu kandung wajib dirahasiakan membuatmu terlindung dari penyalahgunaan identitas. Kamu kini tahu batas tegas antara ranah publik dan privat!',
    pantun: [
      'Mutiara indah di dasar lautan,',
      'Disimpan rapat di dalam kerang.',
      'Data rahasia jangan sebarkan,',
      'Privasi aman hati pun tenang.',
    ],
    pesanPenerapan:
      'Jangan pernah mengunggah foto kartu identitas, kartu pelajar ber-NISN lengkap, atau dokumen keluarga ke ruang publik.',
  },
  'kelas9-sem2-bab3-pertemuan6': {
    topikSingkat: 'Audit Izin Akses Aplikasi pada Ponsel Pintar',
    kalimatMotivasi:
      'Tindakan nyatamu memeriksa dan mematikan izin lokasi atau kontak yang berlebihan pada ponsel membuktikan bahwa ilmu keamanan digital langsung kamu praktikkan untuk melindungi diri sendiri!',
    pantun: [
      'Tamu berkunjung duduk di teras,',
      'Tak boleh masuk kamar pribadi.',
      'Izin aplikasi dicek terbatas,',
      'Kontak dan lokasi aman terkendali.',
    ],
    pesanPenerapan:
      'Berikan izin kamera, mikrofon, dan lokasi hanya kepada aplikasi yang benar-benar membutuhkannya saat sedang dipakai.',
  },
  'kelas9-sem2-bab3-pertemuan7': {
    topikSingkat: 'Identifikasi dan Mitigasi Penipuan Phishing',
    kalimatMotivasi:
      'Keberhasilanmu melingkari tanda-tanda pesan palsu seperti tautan aneh dan nada mendesak menjadikanmu perisai cerdas terhadap jebakan phishing. Ketelitian matamu bisa melindungi dirimu dan keluargamu!',
    pantun: [
      'Umpan dipasang di ujung kail,',
      'Ikan waspada tak mau mendekat.',
      'Kenali tautan palsu yang jahil,',
      'Tolak phishing data selamat.',
    ],
    pesanPenerapan:
      'Jangan pernah mengeklik tautan hadiah atau peringatan akun mencurigakan, dan jangan pernah memberikan kode OTP kepada siapa pun.',
  },
  'kelas9-sem2-bab3-pertemuan8': {
    topikSingkat: 'Audit Keamanan Mandiri dan Kampanye Keselamatan Digital',
    kalimatMotivasi:
      'Luar biasa! Kamu telah menuntaskan audit keamanan mandiri sekaligus merancang panduan keselamatan digital untuk sesama. Selamat menyelesaikan rangkaian perjalanan belajar Informatika SMP dengan bekal ilmu, etika, dan keamanan digital yang utuh!',
    pantun: [
      'Bintang kejora bersinar terang,',
      'Menuntun kapal tiba di dermaga.',
      'Audit tuntas ilmu pun matang,',
      'Duta siber siap berkarya.',
    ],
    pesanPenerapan:
      'Bagikan panduan keselamatan digital buatanmu kepada keluarga di rumah agar seluruh orang terdekatmu ikut terlindungi.',
  },
};

/**
 * Mengambil paket apresiasi, motivasi, dan pantun edukatif kontekstual
 * berdasarkan ID pertemuan aktif (dilengkapi fallback kontekstual dari judul bab/pertemuan).
 */
export function ambilApresiasiKontekstualAsLearning(
  meetingId,
  judulBab = '',
  judulPertemuan = ''
) {
  const canonical = normalisasiIdPertemuanAsLearning(meetingId);
  const dariKatalog = KATALOG_APRESIASI_KONTEKSTUAL[canonical];

  if (dariKatalog) {
    return {
      idPertemuan: canonical,
      topikSingkat: dariKatalog.topikSingkat,
      kalimatMotivasi: dariKatalog.kalimatMotivasi,
      pantun: [...dariKatalog.pantun],
      pesanPenerapan: dariKatalog.pesanPenerapan,
    };
  }

  const labelTopik =
    String(judulPertemuan || '').replace(/^Pertemuan\s*\d+\s*:\s*/i, '').trim() ||
    String(judulBab || '').trim() ||
    'Pembelajaran Informatika';

  return {
    idPertemuan: canonical,
    topikSingkat: labelTopik,
    kalimatMotivasi: `Refleksi jujurmu pada materi "${labelTopik}" menunjukkan semangat belajar yang matang. Terus pertahankan rasa ingin tahu dan keberanian mencoba hal baru dalam perjalanan belajarmu!`,
    pantun: [
      'Mentari pagi menyinari taman,',
      'Embun berkilau di ujung daun.',
      `Ilmu ${labelTopik.slice(0, 28)} kita amalkan,`,
      'Langkah belajar makin beruntun.',
    ],
    pesanPenerapan:
      'Catat satu hal baru yang paling kamu pahami hari ini dan cobalah ceritakan kembali dengan bahasamu sendiri.',
  };
}

/**
 * Memuat dan menormalkan seluruh data dari public/as_learning.json satu kali ke memori.
 * Mempertahankan 100% kalimat asli, nomor pertanyaan, dan urutan pertemuan.
 */
export async function muatKatalogAsLearning() {
  if (cachedAsLearningMap) {
    return cachedAsLearningMap;
  }

  const baseUrl =
    typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL
      : '/';

  const response = await fetch(`${baseUrl}as_learning.json`);
  if (!response.ok) {
    throw new Error(
      `Gagal memuat file as_learning.json (Status ${response.status})`
    );
  }

  const rawText = await response.text();
  const parsed = parseJsonTolerant(rawText);

  if (!Array.isArray(parsed)) {
    throw new Error(
      'Struktur data as_learning.json tidak valid (harus berupa array pertemuan).'
    );
  }

  const catalogMap = {};

  parsed.forEach((rawItem, idxPertemuan) => {
    if (!rawItem || typeof rawItem !== 'object') return;
    const rawId = String(rawItem.id_pertemuan || '').trim();
    const canonicalId = normalisasiIdPertemuanAsLearning(rawId);
    if (!canonicalId) return;

    const rawPertanyaan = Array.isArray(rawItem.pertanyaan)
      ? rawItem.pertanyaan
      : [];

    const daftarPertanyaan = rawPertanyaan.map((q, idxQ) => {
      const nomor = Number(q?.nomor) || idxQ + 1;
      return {
        id: `${canonicalId}__q${nomor}`,
        nomor,
        kunciField: `pertanyaan_${nomor}`,
        teks: String(q?.teks ?? ''),
      };
    });

    catalogMap[canonicalId] = {
      urutan: idxPertemuan + 1,
      idPertemuan: canonicalId,
      idSumberAsli: rawId,
      pertanyaan: daftarPertanyaan,
    };
  });

  cachedAsLearningMap = catalogMap;
  return catalogMap;
}

/**
 * Mengambil daftar pertanyaan refleksi AS Learning untuk pertemuan tertentu.
 */
export async function ambilPertanyaanAsLearning(meetingId) {
  const canonical = normalisasiIdPertemuanAsLearning(meetingId);
  if (!canonical) return null;
  const catalog = await muatKatalogAsLearning();
  return catalog[canonical] || null;
}

/**
 * Membuat struktur objek jawaban awal kosong sesuai daftar pertanyaan pertemuan.
 */
export function buatJawabanAwalAsLearning(dataPertemuan) {
  const map = {};
  const daftar = dataPertemuan?.pertanyaan || [];
  daftar.forEach((q) => {
    map[q.kunciField] = '';
  });
  return map;
}

/**
 * Menggabungkan jawaban tersimpan atau draf dengan skema pertanyaan pertemuan aktif.
 */
export function gabungkanJawabanAsLearning(dataPertemuan, sumberJawaban) {
  const dasar = buatJawabanAwalAsLearning(dataPertemuan);
  if (!sumberJawaban || typeof sumberJawaban !== 'object') {
    return dasar;
  }

  const daftar = dataPertemuan?.pertanyaan || [];
  daftar.forEach((q) => {
    const kandidat =
      sumberJawaban[q.kunciField] ??
      sumberJawaban[String(q.nomor)] ??
      sumberJawaban[q.id] ??
      '';
    dasar[q.kunciField] = String(kandidat || '');
  });

  return dasar;
}

/**
 * Menghitung jumlah kata dan karakter pada satu jawaban refleksi.
 */
export function hitungStatistikTeksRefleksi(teks) {
  const bersih = String(teks || '').trim();
  if (!bersih) {
    return { jumlahKata: 0, jumlahKarakter: 0 };
  }
  const kata = bersih.split(/\s+/).filter(Boolean);
  return {
    jumlahKata: kata.length,
    jumlahKarakter: bersih.length,
  };
}

/**
 * Memvalidasi kelengkapan seluruh jawaban refleksi pada pertemuan aktif sebelum dikirim.
 */
export function periksaKelengkapanAsLearning(dataPertemuan, jawabanMap) {
  if (!dataPertemuan || !Array.isArray(dataPertemuan.pertanyaan)) {
    return {
      lengkap: false,
      pesan: 'Data pertanyaan refleksi belum siap.',
      nomorBelumLengkap: [],
    };
  }

  const nomorKosong = [];
  const nomorTerlaluSingkat = [];

  dataPertemuan.pertanyaan.forEach((q) => {
    const isi = String(jawabanMap?.[q.kunciField] || '').trim();
    if (!isi) {
      nomorKosong.push(q.nomor);
    } else if (isi.length < 8) {
      nomorTerlaluSingkat.push(q.nomor);
    }
  });

  if (nomorKosong.length > 0) {
    return {
      lengkap: false,
      pesan: `Mohon isi jawaban pada Pertanyaan Refleksi nomor ${nomorKosong.join(' dan ')} terlebih dahulu sebelum mengirim.`,
      nomorBelumLengkap: nomorKosong,
    };
  }

  if (nomorTerlaluSingkat.length > 0) {
    return {
      lengkap: false,
      pesan: `Tuliskan jawaban yang sedikit lebih jelas pada Pertanyaan Refleksi nomor ${nomorTerlaluSingkat.join(' dan ')} (minimal satu kalimat singkat).`,
      nomorBelumLengkap: nomorTerlaluSingkat,
    };
  }

  return {
    lengkap: true,
    pesan: 'Seluruh jawaban refleksi sudah lengkap dan siap disimpan.',
    nomorBelumLengkap: [],
  };
}

function buatKunciDrafLokal(userKey, canonicalMeetingId) {
  return `infoFun_DraftASL_${userKey}_${canonicalMeetingId}`;
}

/**
 * Menyimpan draf refleksi secara otomatis ke localStorage per pengguna dan pertemuan
 * agar tulisan tidak hilang saat siswa berpindah menu sebelum mengirim.
 */
export function simpanDrafLokalAsLearning(userKey, meetingId, jawabanMap) {
  const canonical = normalisasiIdPertemuanAsLearning(meetingId);
  if (!userKey || !canonical || !jawabanMap) return;

  try {
    localStorage.setItem(
      buatKunciDrafLokal(userKey, canonical),
      JSON.stringify({
        jawaban: jawabanMap,
        updatedAtIso: new Date().toISOString(),
      })
    );
  } catch {
    // Abaikan apabila kuota penyimpanan peramban penuh
  }
}

/**
 * Memuat draf refleksi lokal milik siswa pada pertemuan aktif (jika ada).
 */
export function muatDrafLokalAsLearning(userKey, meetingId) {
  const canonical = normalisasiIdPertemuanAsLearning(meetingId);
  if (!userKey || !canonical) return null;

  try {
    const raw = localStorage.getItem(buatKunciDrafLokal(userKey, canonical));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.jawaban && typeof parsed.jawaban === 'object'
      ? parsed.jawaban
      : null;
  } catch {
    return null;
  }
}

/**
 * Menghapus draf lokal pada pertemuan tertentu (misalnya setelah refleksi dikirim atau direset).
 */
export function hapusDrafLokalAsLearning(userKey, meetingId) {
  const canonical = normalisasiIdPertemuanAsLearning(meetingId);
  if (!userKey || !canonical) return;
  try {
    localStorage.removeItem(buatKunciDrafLokal(userKey, canonical));
  } catch {
    // Abaikan
  }
}

/**
 * Menyimpan jawaban refleksi AS Learning secara terisolasi per UID siswa + kelas + pertemuan + menu
 * menggunakan ruang kerja non-database Firebase (IndexedDB + localStorage + Cloud Storage object delta sync)
 * TANPA menulis ke Cloud Firestore maupun Firebase Realtime Database.
 */
export async function simpanRefleksiAsLearningKeDatabase({
  session,
  userKey,
  meetingId,
  judulBab,
  judulPertemuan,
  dataPertemuan,
  jawabanMap,
}) {
  const canonicalMeetingId = normalisasiIdPertemuanAsLearning(meetingId);
  const savedAtIso = new Date().toISOString();
  const effectiveUid = String(session?.uid || userKey || '').trim();
  const jawabanRapi = gabungkanJawabanAsLearning(dataPertemuan, jawabanMap);

  const jawabanBersih = {};
  Object.keys(jawabanRapi).forEach((kunci) => {
    jawabanBersih[kunci] = String(jawabanRapi[kunci] || '').trim().slice(0, 5000);
  });

  const daftarRefleksi = (dataPertemuan?.pertanyaan || []).map((q) => ({
    idPertanyaan: q.id,
    nomor: q.nomor,
    pertanyaan: q.teks,
    jawaban: jawabanBersih[q.kunciField] || '',
  }));

  const infoKelas = ekstrakInfoKelasSemester(canonicalMeetingId);
  const recordPayload = {
    uid: effectiveUid,
    studentKey: effectiveUid,
    kelas: infoKelas.kelas,
    semester: infoKelas.semester,
    bab: String(judulBab || '').slice(0, 200),
    pertemuanId: canonicalMeetingId,
    idSumberPertemuan: String(dataPertemuan?.idSumberAsli || canonicalMeetingId),
    judulPertemuan: String(judulPertemuan || '').slice(0, 200),
    menu: 'as-learning',
    jawaban: jawabanBersih,
    daftarRefleksi,
    submitted: true,
    savedAtIso,
  };

  if (effectiveUid && effectiveUid !== 'guest') {
    await saveNonDbMenuRecord({
      uid: effectiveUid,
      meetingId: canonicalMeetingId,
      menu: 'as-learning',
      data: recordPayload,
      updatedAtIso: savedAtIso,
    });
    hapusDrafLokalAsLearning(effectiveUid, canonicalMeetingId);
  }

  return {
    ok: true,
    syncedToCloud: false,
    savedAtIso,
    jawabanTersimpan: jawabanBersih,
  };
}

/**
 * Memulihkan serta berlangganan pembaruan jawaban refleksi AS Learning per UID siswa
 * dari ruang kerja non-database (localStorage + IndexedDB + Cloud Storage object sync)
 * dengan resolusi konflik otomatis berbasis timestamp terbaru.
 */
export function langgananRefleksiAsLearning(
  userKey,
  meetingId,
  dataPertemuan,
  onData
) {
  const canonicalMeetingId = normalisasiIdPertemuanAsLearning(meetingId);
  if (!canonicalMeetingId || !dataPertemuan || !userKey || userKey === 'guest') {
    onData(null);
    return () => {};
  }

  return subscribeNonDbMenuRecord(
    userKey,
    canonicalMeetingId,
    'as-learning',
    (envelope) => {
      const data = envelope?.data;
      if (!data || typeof data !== 'object' || !data.submitted) {
        onData(null);
        return;
      }

      onData({
        jawaban: gabungkanJawabanAsLearning(dataPertemuan, data.jawaban),
        submitted: Boolean(data.submitted),
        savedAtIso: String(data.savedAtIso || envelope.updatedAtIso || ''),
        syncedFromCloud: false,
      });
    }
  );
}
