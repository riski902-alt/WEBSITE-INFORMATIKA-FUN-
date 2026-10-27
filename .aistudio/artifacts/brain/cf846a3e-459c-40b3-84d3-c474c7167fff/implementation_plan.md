# Integrasi Menu Eksplorasi Konsep & For Learning — INFORMATIKA FUN!

Rencana ini menggabungkan dan menstandarkan keenam sumber data pembelajaran (3 sumber materi **Eksplorasi Konsep** dan 3 sumber latihan **For Learning** untuk seluruh 81 pertemuan Kelas 7, 8, dan 9) serta menghadirkan ruang presentasi interaktif bergaya Prezi lengkap dengan unduh PDF per materi dan latihan formatif berpenjelasan otomatis yang tersimpan real-time ke database.

## Keputusan Penting & Konfirmasi Pengguna

> [!IMPORTANT]
> Berikut adalah rangkuman keputusan yang telah dikonfirmasi beserta pengaturan standar yang direkomendasikan agar alur berurutan antar-menu tetap konsisten tanpa mengubah sistem login maupun menu yang sudah berjalan.

- **Sistem Penilaian For Learning (Dikonfirmasi)**: Menggunakan skala **0–100 poin merata** untuk 8 butir soal di setiap pertemuan (**12,5 poin** per soal benar), mencakup Pilihan Ganda, Pilihan Ganda Kompleks, Menjodohkan, dan Isian Singkat.
- **Alur Penyimpanan For Learning (Dikonfirmasi)**: Menggunakan **satu tombol Simpan Jawaban** di bagian bawah untuk memvalidasi dan menyimpan seluruh jawaban pertemuan sekaligus, lalu langsung menampilkan skor serta **Penjelasan Inti** di setiap soal.
- **Pembaruan Jawaban Tanpa Poin Ganda (Dikonfirmasi)**: Siswa diizinkan memperbaiki jawaban dan menyimpan ulang; sistem menimpa dokumen jawaban pertemuan milik siswa tersebut secara idempoten sehingga skor diperbarui akurat tanpa penjumlahan ganda.
- **Standar Presentasi & Unduh PDF Eksplorasi Konsep (Rekomendasi Default)**: Seluruh penanda teknis seperti `SLIDE 1`, `SLIDE 2`, hingga `SLIDE 10` dihapus sepenuhnya dari layar dan PDF; tombol **Unduh PDF** menghasilkan dokumen lanskap rasio presentasi **16:9** khusus untuk materi yang sedang tampil (lengkap dengan judul, isi utuh, dan ilustrasi visual topik), dan pencapaian bagian materi terakhir membuka akses menuju menu **For Learning**.

---

## 1. Gambaran Umum & Konsep Inti

- **Apa yang Dihadirkan**:
  1. **Eksplorasi Konsep (Menu ke-4)**: Pengalaman presentasi interaktif modern terinspirasi Prezi yang menyajikan materi inti per pertemuan secara bertahap dengan ilustrasi visual kontekstual (diagram tabel/data, alur algoritma/pseudocode, blok visual Scratch, arsitektur perangkat keras, topologi jaringan, hingga keamanan digital), navigasi panah kiri-kanan maupun tombol keyboard, indikator posisi bersih (`2 dari 11`), serta fitur **Unduh PDF** mandiri per tampilan materi.
  2. **For Learning (Menu ke-5)**: Latihan formatif terbimbing berisi 8 soal per pertemuan (2 Pilihan Ganda, 2 Pilihan Ganda Kompleks, 2 Menjodohkan, dan 2 Isian Singkat) yang langsung menghitung poin skala 0–100, menyimpan hasil secara real-time ke Firebase Firestore sesuai akun siswa yang aktif, dan menyajikan **Penjelasan Inti** yang lugas pada setiap nomor soal begitu jawaban disimpan.
- **Target Pengguna**: Siswa dan Guru SMP Kelas 7, 8, dan 9 pengguna ruang belajar **INFORMATIKA FUN!** pada perangkat laptop, Chromebook, tablet, maupun ponsel Android.
- **Nilai Utama**: Seluruh 81 pertemuan memiliki alur belajar utuh dan terkunci berurutan secara otomatis—mulai dari pemahaman konsep visual yang bebas tumpukan teks hingga evaluasi formatif real-time yang meluruskan pemahaman siswa tanpa merusak menu **ATP**, **Asesmen Awal**, dan **Pertanyaan Esensial**.

---

## 2. Pengalaman Pengguna & Desain Visual

- **Alur Pengguna Utama**:
  1. **Membuka Eksplorasi Konsep**: Setelah menyelesaikan *Pertanyaan Esensial*, siswa membuka menu *Eksplorasi Konsep* sesuai kelas, bab, dan pertemuan aktif. Layar menampilkan kanvas presentasi putih bersih tanpa kata "SLIDE", dimulai dari tampilan pembuka topik pertemuan.
  2. **Menjelajahi Materi & Mengunduh PDF**: Siswa berpindah antar-materi menggunakan tombol panah `←` dan `→` (atau panah kiri/kanan pada keyboard) dengan indikator posisi `X dari Y`. Pada tampilan mana pun, siswa dapat menekan tombol **`↓ Unduh PDF`** untuk mengunduh salindia materi aktif dalam format lanskap 16:9 yang rapi tanpa elemen navigasi halaman web. Saat mencapai tampilan penutup, siswa dapat melanjutkan dan membuka kunci menu *For Learning*.
  3. **Mengerjakan For Learning**: Siswa menjawab 8 soal interaktif sesuai tipe masing-masing (radio button untuk Pilihan Ganda, kotak centang multi-pilihan untuk Pilihan Ganda Kompleks, pemilih pasangan untuk Menjodohkan, dan kolom ketik untuk Isian Singkat).
  4. **Menyimpan Jawaban & Membaca Penjelasan Inti**: Saat menekan **Simpan Jawaban**, tombol menampilkan status proses **Menyimpan...**, mengirim data ke Firestore, lalu menampilkan konfirmasi **Jawaban berhasil disimpan**, ringkasan **Skor: XX/100** (dengan angka tabular yang rapi), lencana benar/salah disertai teks eksplisit pada tiap soal, serta kartu **Penjelasan Inti** yang menjelaskan konsep benar secara ringkas dan ramah SMP. Status menu *For Learning* otomatis ditandai selesai dan membuka kunci menu *Penerapan Konsep*.
  5. **Memuat Ulang atau Memperbarui Jawaban**: Jika halaman dimuat ulang, sistem memulihkan jawaban, poin, dan penjelasan inti milik siswa yang sedang login dari penyimpanan database dan sinkronisasi lokal. Jika siswa memilih ubah jawaban dan menyimpan kembali, skor lama diperbarui tanpa menggandakan poin.

- **Identitas Visual & Tema**:
  - *Arah Estetika*: **Modern EdTech + Prezi-Inspired Interactive Stage** yang bersih, terfokus, dan selaras penuh dengan identitas **INFORMATIKA FUN!**.
  - *Distribusi Warna (60-30-10)*:
    - **60% Kanvas Dominan Putih (`#FFFFFF` & `#F8FAFC`)** di dalam satu kontainer putih utama berbingkai hijau lembut (`#88D4AB`), menjaga keterbacaan materi dan soal tetap optimal di semua layar.
    - **30% Permukaan Struktural Biru Denim & Navy (`#527DA8`, `#1E3A5F`, `#243B53`)** untuk panel ilustrasi topik, header kartu soal, bar navigasi bawah, serta teks utama berkontras tinggi.
    - **10% Aksen Fokal Hijau Lembut & Emas Hangat (`#88D4AB`, `#D8BD7B`)** untuk tombol aksi utama (**Simpan Jawaban**, **Unduh PDF**), indikator progres, dan penanda keberhasilan yang selalu dipasangkan dengan ikon serta label teks jelas (tidak mengandalkan warna semata).
  - *Tipografi & Hierarki*: Memadukan `Space Grotesk` untuk judul materi presentasi (`text-wrap: balance`), `Plus Jakarta Sans` untuk navigasi dan label kontrol satu baris (`whitespace-nowrap`), serta angka `tabular-nums` untuk indikator posisi materi (`2 dari 11`) dan skor poin (`87,5 / 100`).
  - *Tata Letak Dua Zona pada Eksplorasi Konsep*: Pada layar lebar (laptop/Chromebook), kanvas presentasi membagi ruang secara proporsional antara **Zona Penjelasan Konsep Terstruktur** (judul bersih, poin-poin terurai otomatis, atau tabel rapi bila materi memuat format tabel/kode) dan **Zona Visualisasi Topik Kontekstual** (ilustrasi vektor dinamis sesuai subtopik slide aktif). Pada ponsel, kedua zona tersusun vertikal ringkas tanpa scroll horizontal.

- **Umpan Balik Interaktif & Animasi**:
  - Perpindahan antar-materi pada *Eksplorasi Konsep* menggunakan transisi *Prezi-style camera zoom & pan* ringan berbasis properti kompositor (`transform: scale/translate3d` dan `opacity`, durasi ~220ms) yang mulus di Chromebook/HP dan otomatis menyesuaikan jika perangkat mengaktifkan `prefers-reduced-motion`.
  - Tombol `←` otomatis nonaktif di materi pertama dan tombol `→` otomatis nonaktif di materi terakhir agar tidak pernah melompat keluar dari pertemuan aktif.

---

## 3. Keputusan Produk Utama & Pertimbangan Teknis

- **Keputusan 1: Penggabungan & Penyeragaman 3 Sumber Data Tanpa Mengubah Redaksi Asli**
  - *Pendekatan Terpilih*: Menggabungkan ketiga sumber **Eksplorasi Konsep** (urutan mutlak: Kelas 7 → Kelas 8 → Kelas 9) dan ketiga sumber **For Learning** (urutan mutlak: Kelas 7 → Kelas 8 → Kelas 9) dengan mempertahankan 100% kalimat soal, pilihan, kunci jawaban, dan isi materi asli, sambil menormalkan perbedaan pembungkus struktur antar-file (objek vs array string tergabung) serta memetakan kunci `Kelas9-sem2-bab1-pertemuan1..8` secara otomatis ke `kelas9-sem2-bab3-pertemuan1..8` agar selaras dengan sistem navigasi bab Kelas 9 Semester 2 yang sudah berjalan.
  - *Alasan*: Ketiga file sumber pada masing-masing menu memiliki struktur pembungkus berbeda (File 1 Kelas 7 memakai objek terurai, sedangkan File 2 Kelas 8 dan File 3 Kelas 9 memakai array string gabungan dan penamaan kunci yang berbeda). Normalisasi terukur pada lapisan data dan komponen pembaca menjamin ke-81 pertemuan tampil utuh tanpa menghilangkan satu kata pun dari naskah sumber.

- **Keputusan 2: Pemisahan Metadata Slide & Pembuatan PDF Lanskap 16:9 Murni**
  - *Pendekatan Terpilih*: Mesin pengurai komponen memisahkan penanda teknis (`SLIDE 1 — PEMBUKA`, ` | SLIDE 1 — `, maupun nomor kembar `SLIDE 10` pada bagian penutup) dari judul dan isi materi sebelum dirender ke layar maupun saat dirender ke kanvas PDF 16:9 menggunakan generator dokumen vektor/kanvas beresolusi tinggi di sisi klien.
  - *Alasan*: Memastikan kata `SLIDE` beserta nomornya tidak pernah tampil di layar siswa, sekaligus menjamin hasil **Unduh PDF** benar-benar berisi satu salindia presentasi 16:9 yang bersih (judul, poin materi, dan ilustrasi topik), bukan tangkapan layar antarmuka website beserta tombol navigasi.

- **Keputusan 3: Evaluasi Jawaban Toleran & Penjelasan Inti Terkurasi**
  - *Pendekatan Terpilih*:
    - *Pilihan Ganda*: Pencocokan tepat terhadap kunci jawaban (`12,5 poin`).
    - *Pilihan Ganda Kompleks*: Bernilai penuh (`12,5 poin`) hanya bila himpunan pilihan siswa sama persis dengan seluruh kunci jawaban benar (mencegah siswa mendapat poin hanya dengan memilih satu opsi atau mencentang semua opsi).
    - *Menjodohkan*: Bernilai penuh bila kedua pasangan pernyataan cocok dengan pasangannya (`12,5 poin` per butir nomor menjodohkan).
    - *Isian Singkat*: Pencocokan fleksibel yang menormalkan huruf besar/kecil, spasi berlebih, tanda baca/kurung penjelasan, serta menerima seluruh variasi sinonim yang tercantum pada kunci sumber (misal `Baris / Row` menerima `baris`, `row`, maupun `baris / row`).
    - *Penjelasan Inti*: Disusun otomatis berbasis konsep soal, opsi jawaban benar, dan perbandingan terhadap jawaban siswa menggunakan bahasa Indonesia sederhana tingkat SMP, tanpa kalimat basa-basi dan **tanpa pernah memuat frasa "mis komunikasi"**.
  - *Alasan*: Adil bagi siswa SMP saat mengetik jawaban isian yang setara secara makna, sekaligus memberikan umpan balik konseptual yang langsung meluruskan kekeliruan.

- **Keputusan 4: Penyimpanan Real-Time Idempoten ke Firebase Firestore yang Sudah Terhubung**
  - *Pendekatan Terpilih*: Menyimpan jawaban dan skor ke instance Firestore proyek yang sudah aktif menggunakan ID dokumen deterministik berbasis kombinasi identitas unik akun siswa (`NISN` atau `email` tervalidasi dari sesi login) dan ID pertemuan (`{identitasSiswa}_{idPertemuan}`), dilengkapi pengunci klik ganda saat proses simpan berlangsung serta sinkronisasi penyimpanan lokal agar pemuatan ulang halaman instan dan tahan gangguan sinyal.
  - *Alasan*: Menjamin data antar-siswa tidak pernah tertukar atau tertimpa, mencegah duplikasi poin saat siswa menekan tombol berkali-kali atau memperbarui jawaban, dan tetap menjaga sistem login serta koleksi siswa yang sudah berjalan tetap utuh.

---

## 4. Arsitektur Teknis & Strategi Data

- **Diagram Arsitektur & Aliran Data Sistem**:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                     RUANG BELAJAR INFORMATIKA FUN!                           │
│        Sesi Akun Aktif (Siswa NISN / Guru) + Pilihan Kelas/Bab/Pertemuan     │
└───────────────────┬──────────────────────────────────────┬───────────────────┘
                    │                                      │
      Menu: Eksplorasi Konsep                    Menu: For Learning
                    │                                      │
                    ▼                                      ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────────┐
│   Katalog Materi Eksplorasi Konsep    │  │    Katalog Soal For Learning      │
│  (Gabungan Utuh File 1 + 2 + 3:       │  │  (Gabungan Utuh File 1 + 2 + 3:   │
│   81 Pertemuan Kelas 7, 8, dan 9)     │  │   81 Pertemuan × 8 Soal = 648)    │
└───────────────────┬───────────────────┘  └─────────────────┬─────────────────┘
                    │                                        │
                    ▼                                        ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────────┐
│    Pengelola Eksplorasi Konsep        │  │      Pengelola For Learning       │
│ • Pemetaan ID pertemuan & alias Bab   │  │ • Pemetaan ID pertemuan & tipe    │
│ • Pembersih penanda teknis "SLIDE X"  │  │ • Validasi PG, PGK, Jodoh, Isian  │
│ • Pemilih ilustrasi visual per topik  │  │ • Kalkulator skor skala 0–100     │
│ • Generator dokumen PDF 16:9 mandiri  │  │ • Penyusun Penjelasan Inti SMP    │
└───────────────────┬───────────────────┘  └─────────────────┬─────────────────┘
                    │                                        │
                    ▼                                        ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────────┐
│   Kanvas Presentasi Gaya Prezi        │  │   Antarmuka Latihan & Umpan Balik │
│ • Transisi halus zoom/geser           │  │ • Kartu soal bertema warna selaras│
│ • Navigasi panah ← / → & keyboard     │  │ • Tombol tunggal Simpan Jawaban   │
│ • Indikator posisi "X dari Y"         │  │ • Status simpan & Skor XX/100     │
│ • Tombol "↓ Unduh PDF" slide aktif    │  │ • Kartu Penjelasan Inti per soal  │
└───────────────────┬───────────────────┘  └─────────────────┬─────────────────┘
                    │                                        │
                    └──────────────────┬─────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│          Penyimpanan Real-Time Firebase Firestore & Progres Bertahap         │
│  • Dokumen jawaban unik per Siswa + Pertemuan (bebas poin ganda/tertukar)    │
│  • Pembuka kunci berurutan: Eksplorasi Konsep ──► For Learning ──► Penerapan │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Model Data & Penyimpanan**:
  - **Entitas Materi Eksplorasi Konsep**: Menyimpan urutan pertemuan (`Kelas 7`, `Kelas 8`, `Kelas 9`) di mana setiap pertemuan memiliki daftar unit materi terurut berisi judul bersih (tanpa kata `SLIDE`), jenis tampilan (`pembuka`, `inti`, `penutup`), butir konten/tabel/kode yang terurai rapi, dan kategori ilustrasi visual.
  - **Entitas Soal For Learning**: Menyimpan urutan pertemuan (`Kelas 7`, `Kelas 8`, `Kelas 9`) di mana setiap pertemuan memuat 8 soal teridentifikasi unik (`pg-1`, `pg-2`, `pgk-1`, `pgk-2`, `jodoh-1`, `jodoh-2`, `isian-1`, `isian-2`), pilihan jawaban, kunci jawaban asli, bobot `12.5`, serta penjelasan inti kontekstual.
  - **Dokumen Hasil Siswa di Firestore**: Terikat pada kunci unik `{identitasSiswa}_{idPertemuan}` yang memuat identitas siswa (`nama`, `nisn`/`email`, `role`), informasi pertemuan (`kelas`, `bab`, `idPertemuan`), rincian jawaban dan kebenaran tiap ID soal, total poin (`0`–`100`), jumlah benar (`0`–`8`), serta waktu pembaruan terakhir.

- **Pemetaan Komponen Interaktif & Transisi State**:
  - **Navigasi Presentasi Eksplorasi Konsep**: Mengubah indeks materi aktif dalam batas `[0 .. totalMateri - 1]`, memperbarui arah animasi transisi (maju/mundur), mencatat progres bacaan per pertemuan, serta menonaktifkan tombol `←` pada indeks pertama dan `→` pada indeks terakhir.
  - **Ekspor PDF Slide Aktif**: Mengunci tombol unduh sementara (`Menyiapkan PDF...`), menyusun halaman lanskap 16:9 bersih dari judul, poin materi, dan grafis topik aktif tanpa elemen UI web, mengunduh berkas `.pdf` bernama rapi sesuai pertemuan dan judul materi, lalu menampilkan umpan balik gagal yang jujur apabila ekspor terkendala.
  - **Penyimpanan & Evaluasi For Learning**: Memeriksa kelengkapan jawaban siswa, mengaktifkan state `isSaving` untuk mencegah klik berulang, menulis data secara real-time ke Firestore, dan hanya setelah penyimpanan terkonfirmasi mengubah status ke `Jawaban berhasil disimpan`, menampilkan skor `0–100` beserta **Penjelasan Inti** di bawah tiap soal, serta membuka kunci menu berikutnya. Jika koneksi ke database gagal, sistem menampilkan pesan `Gagal menyimpan, silakan coba kembali` tanpa mengklaim berhasil.
