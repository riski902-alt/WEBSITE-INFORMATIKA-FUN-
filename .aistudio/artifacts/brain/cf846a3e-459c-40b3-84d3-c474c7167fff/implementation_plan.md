# Pengembangan & Integrasi Menu Refleksi AS Learning — INFORMATIKA FUN!

Menghadirkan pengalaman refleksi akhir pembelajaran (**AS Learning**) yang hangat, bermakna, dan terhubung penuh pada seluruh **81 pertemuan Informatika SMP (Kelas 7, 8, dan 9)**, lengkap dengan penyimpanan jawaban *real-time*, sapaan personal sesuai akun pengguna aktif, kartu apresiasi interaktif *3D flip* berisi pantun edukatif serta motivasi sesuai topik pertemuan, dan navigasi penutup menuju pertemuan berikutnya maupun daftar materi.

## Tinjauan Pengguna & Keputusan Utama

> [!IMPORTANT]
> Ketiga preferensi pengalaman belajar dan antarmuka dari tahap klarifikasi telah dikunci sebagai acuan utama implementasi tanpa mengubah redaksi asli 162 pertanyaan refleksi maupun mengganggu keenam menu pembelajaran yang sudah berjalan.

- **Keputusan Terkonfirmasi 1 — Format Motivasi Kontekstual**: Setiap pertemuan menampilkan **kombinasi kalimat motivasi/nasihat kontekstual dan pantun edukatif 4 baris** yang dirancang khusus mengikuti topik materi pertemuan tersebut (bukan pesan seragam untuk semua pertemuan).
- **Keputusan Terkonfirmasi 2 — Gaya Kartu Apresiasi**: Menggunakan **kartu interaktif *3D flip* dengan kilau halus** yang menampilkan sapaan huruf kapital dinamis `TERIMA KASIH, [NAMA PENGGUNA]!` di sisi depan serta pantun edukatif dan pesan inspiratif topik di sisi balik, tetap ringan dan mematuhi preferensi aksesibilitas gerak pengguna (`prefers-reduced-motion`).
- **Keputusan Terkonfirmasi 3 — Navigasi Penutup 100% Pertemuan**: Setelah refleksi tersimpan dan progres pertemuan mencapai 7 dari 7 menu (100%), tersedia **tombol lanjut ke pertemuan berikutnya** serta **tombol pembuka daftar seluruh materi** agar siswa dapat berpindah pertemuan atau meninjau bab lain secara leluasa.

---

## 1. Gambaran Umum & Konsep Inti

- **Apa yang Dilakukan**: Menyediakan tahap ketujuh sekaligus penutup alur belajar di setiap pertemuan tempat siswa merenungkan pemahaman konsep (Pertanyaan 1) dan pengalaman/perasaan belajarnya (Pertanyaan 2), menyimpan refleksinya secara aman ke basis data awan sesuai akun masing-masing, lalu menerima apresiasi personal dan dorongan semangat yang relevan dengan materi yang baru dipelajari.
- **Target Pengguna**: Siswa SMP Kelas 7, 8, dan 9 serta guru Informatika yang mendampingi proses refleksi mandiri di kelas maupun di rumah.
- **Nilai Utama**: Mengubah tahap penutup pelajaran dari sekadar formulir isian kaku menjadi ruang refleksi metakognitif yang nyaman, bebas takut salah, menghargai suara siswa secara personal, dan mengunci ketuntasan pertemuan hingga 100%.

---

## 2. Pengalaman Pengguna & Desain Visual

### Alur Pengguna Utama

1. **Membuka Menu AS Learning**: Saat siswa memilih tombol menu AS Learning pada pertemuan mana pun (setelah menyelesaikan tahap sebelumnya), sistem memuat tepat 2 pertanyaan refleksi milik pertemuan tersebut secara instan tanpa tertukar antarpertemuan.
2. **Menulis Refleksi dengan Nyaman**:
   - Siswa membaca pengantar singkat yang menenangkan bahwa refleksi bertujuan mengenali pemahaman diri sendiri dengan jujur.
   - Setiap kartu pertanyaan dilengkapi area tulis lega yang mendukung kalimat pendek maupun paragraf panjang, indikator jumlah kata/karakter yang ramah, serta panduan pemantik tipis agar siswa tidak bingung memulai kalimat.
   - Setiap ketikan siswa otomatis tersimpan sebagai draf sementara sehingga jawaban tidak hilang apabila siswa berpindah ke menu lain untuk melihat kembali materi sebelum mengirim.
3. **Menyimpan & Mengirim Refleksi**:
   - Jika masih ada kolom yang kosong atau terlalu singkat, sistem menampilkan pengingat santun tepat di area aksi tanpa memunculkan kotak peringatan peramban yang mengganggu.
   - Saat seluruh pertanyaan terjawab dan siswa menekan **Selesai dan Kirim Refleksi**, jawaban disimpan secara *real-time* ke basis data awan sesuai identitas pengguna dan pertemuan aktif, status menu ketujuh berubah menjadi selesai, dan bar progres pertemuan mencapai **100% (7 dari 7 menu selesai)**.
4. **Menerima Apresiasi Personal & Motivasi Topik**:
   - Panel apresiasi terbuka dengan animasi transisi lembut dan kilau halus, menampilkan sapaan kapital dinamis **`TERIMA KASIH, [NAMA PENGGUNA]!`** yang diambil langsung dari sesi akun yang sedang masuk.
   - Siswa dapat membalik (**Flip 3D**) kartu apresiasi untuk membaca sisi depan (apresiasi refleksi & kalimat motivasi sesuai topik pertemuan) dan sisi belakang (pantun edukatif 4 baris bertema materi pertemuan tersebut beserta pesan praktis penerapan sehari-hari).
5. **Mengedit Kembali atau Melanjutkan Belajar**:
   - Jawaban yang telah dikirim tampil rapi dalam mode baca; siswa tetap dapat menekan tombol **Edit Jawaban** kapan saja untuk memperbarui refleksinya dan menyimpannya ulang tanpa duplikasi rekaman.
   - Di bagian bawah kartu apresiasi tersedia tombol **Lanjut ke Pertemuan Berikutnya** dan **Buka Daftar Materi** untuk memilih pertemuan atau bab lain dengan mudah.

### Identitas Visual & Tema

- **Arah Estetika**: *Modern EdTech Reflective Journal* — bersih, hangat, fokus, dan selaras penuh dengan identitas ruang belajar INFORMATIKA FUN!.
- **Distribusi Warna (60-30-10)**:
  - **60% Kanvas Netral Dominan**: Putih bersih (`#FFFFFF`) dan biru pucat lembut (`#F8FAFC` / `#DCEAF5`) pada area kartu kerja agar teks refleksi memiliki keterbacaan tinggi (rasio kontras memenuhi standar WCAG AA).
  - **30% Permukaan Struktural**: Biru tua/navy (`#1E3A5F` dan `#243B53`) serta biru denim (`#527DA8`) pada tajuk refleksi, penanda nomor pertanyaan, dan bingkai kartu interaktif dengan garis batas tipis merata (tanpa garis aksen tebal di sisi kiri).
  - **10% Aksen Semantik & Apresiasi**: Hijau lembut (`#88D4AB`) dan emas hangat (`#D8BD7B`) khusus untuk penanda ketuntasan, aksi utama pengiriman refleksi, serta aksen kilau pada kartu apresiasi.
- **Tipografi & Hierarki**: Memadukan huruf tajuk tegas dengan `Plus Jakarta Sans` yang ramah remaja pada label navigasi dan isi bacaan, menggunakan ukuran teks proporsional (15px–16px untuk area ketik refleksi dengan spasi baris `1.65`), angka tabular (`tabular-nums`) untuk penghitung kata dan progres, serta metadata teks bersih menggunakan pemisah titik tengah (`·`) tanpa tumpukan kapsul dekoratif.
- ** Tata Letak Dua Zona Seimbang**: Pada layar desktop lebar, ruang refleksi menyusun pengantar dan kartu pertanyaan secara terstruktur dengan proporsi ruang kosong yang lega, diikuti panggung kartu apresiasi *3D flip* terpusat yang responsif sempurna hingga layar ponsel tanpa geser horizontal.

### Umpan Balik Interaktif & Animasi

- **Kartu *3D Flip* Berbasis Kompositor**: Efek balik kartu menggunakan perspektif tiga dimensi murni pada properti `transform` (`rotateY`) dan `opacity` dengan kurva pelambatan halus sehingga berjalan mulus 60fps di laptop sekolah maupun perangkat seluler.
- **Kilau Apresiasi Halus**: Efek kilau lembut muncul sesaat ketika refleksi berhasil dikirim untuk merayakan pencapaian 100% pertemuan tanpa menutupi teks motivasi.
- **Kepatuhan Aksesibilitas Gerak**: Apabila perangkat pengguna mengaktifkan mode pengurangan gerak (`prefers-reduced-motion: reduce`), perpindahan sisi kartu dan kemunculan panel otomatis beralih ke transisi pudar (*cross-fade*) instan tanpa putaran 3D.

---

## 3. Keputusan Produk & Pertimbangan Teknis

- **Keputusan 1 — Normalisasi Identitas Pertemuan Tanpa Mengubah Data Sumber**:
  - *Pendekatan Terpilih*: Mempertahankan seluruh isi data asli (81 objek pertemuan, 162 kalimat pertanyaan refleksi, nomor urut, dan susunan pertemuan) secara utuh apa adanya, lalu menormalkan kunci pencarian di lapisan penghubung (menyamakan huruf besar/kecil `Kelas` menjadi `kelas` serta memetakan kode semester genap Kelas 9 `sem2-bab1` ke kunci katalog utama `sem2-bab3`).
  - *Alasan*: Menjamin 100% kecocokan satu-ke-satu untuk seluruh 81 pertemuan di Kelas 7, 8, dan 9 sekaligus mematuhi aturan keutuhan redaksi data asli.
- **Keputusan 2 — Penyimpanan Berlapis (*Cloud Firestore* + Draf & Cermin Lokal)**:
  - *Pendekatan Terpilih*: Menyimpan jawaban terkirim pada koleksi khusus refleksi di basis data Firebase Firestore yang sudah terpasang menggunakan kunci dokumen deterministik gabungan identitas siswa dan pertemuan, disertai pendengar pembaruan *real-time* serta penyimpanan draf lokal per akun dan per pertemuan.
  - *Alasan*: Memastikan jawaban setiap siswa terisolasi aman (tidak tertimpa akun lain atau pertemuan lain), langsung termuat kembali saat halaman disegarkan, tetap responsif saat jaringan sekolah melambat, dan bebas rekaman ganda ketika siswa memperbarui jawaban.
- **Keputusan 3 — Katalog Motivasi & Pantun Kontekstual 81 Topik Pertemuan**:
  - *Pendekatan Terpilih*: Menyediakan pemetaan pesan motivasi reflektif dan pantun edukatif 4 baris yang spesifik untuk masing-masing dari 81 pertemuan (mulai dari pengenalan data & *spreadsheet* di Kelas 7, jaringan & pemrograman Scratch/Blockly di Kelas 8, hingga struktur data graf/pohon, desain poster digital, serta keamanan siber, 2FA, dan *anti-phishing* di Kelas 9), dilengkapi pembangkit kontekstual berbasis judul bab/pertemuan sebagai jaring pengaman.
  - *Alasan*: Membuat siswa merasa refleksinya benar-benar dibaca dan disambut dengan nasihat serta pantun yang nyambung langsung dengan kegiatan yang baru saja mereka kerjakan.

---

## 4. Arsitektur Teknis & Strategi Data

### Diagram Arsitektur & Aliran Data

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     RUANG BELAJAR INFORMATIKA FUN!                         │
│   Sesi Akun Aktif (Nama, NISN, Peran)  ·  Pemilih Kelas/Pertemuan (81 ID)  │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │                                    │
                    ▼                                    ▼
┌───────────────────────────────────────┐  ┌─────────────────────────────────┐
│     Katalog Pertanyaan Refleksi       │  │   Manajer Progres 7 Tahap       │
│  81 Pertemuan · 162 Pertanyaan Utuh   │  │  Mengunci Ketuntasan ke 100%    │
└───────────────────┬───────────────────┘  └─────────────────▲───────────────┘
                    │                                        │
                    ▼                                        │
┌────────────────────────────────────────────────────────────┴───────────────┐
│                   Pengelola Logika & Data AS Learning                      │
│  • Normalisasi ID Pertemuan (Kelas 7/8/9 & Pemetaan Semester 2 Kelas 9)    │
│  • Pembentuk Sapaan Dinamis ("TERIMA KASIH, [NAMA PENGGUNA]!")             │
│  • Katalog 81 Kalimat Motivasi & Pantun Edukatif Kontekstual per Topik     │
│  • Penyimpanan Draf Otomatis & Sinkronisasi Real-Time Basis Data Awan      │
└─────────┬──────────────────────────────────────────────────┬───────────────┘
          │                                                  │
          ▼                                                  ▼
┌───────────────────────────────────────┐  ┌─────────────────────────────────┐
│    Antarmuka Ruang Refleksi Siswa     │  │   Basis Data Firebase Firestore │
│  • Header Refleksi & Info Pertemuan   │  │  Koleksi Jawaban AS Learning    │
│  • Kartu Pertanyaan 1 & 2 + Area Ketik│  │  Dokumen: [Akun]__[Pertemuan]   │
│  • Validasi Ramah & Mode Baca/Edit    │  ├─────────────────────────────────┤
│  • Kartu Apresiasi 3D Flip + Kilau    │  │   Penyimpanan Lokal Peramban    │
│  • Navigasi Pertemuan Berikutnya &    │  │  Draf Ketikan & Cermin Jawaban  │
│    Panel Daftar Seluruh Materi        │  └─────────────────────────────────┘
└───────────────────────────────────────┘
```

### Model Data & Status

- **Entitas Pertanyaan Pertemuan**: Memuat kode pertemuan asli, kode pertemuan ternormalisasi, serta daftar terurut 2 butir pertanyaan refleksi (nomor urut dan teks asli utuh).
- **Rekaman Jawaban Refleksi Siswa**: Memuat kunci identitas siswa, nama tampilan siswa, NISN, surel, kelas, semester, judul bab, judul pertemuan, kode pertemuan kanonik, peta jawaban terstruktur per nomor pertanyaan (`pertanyaan_1`, `pertanyaan_2`), penanda status terkirim, waktu simpan format ISO, serta cap waktu peladen basis data.
- **Paket Apresiasi Kontekstual**: Memuat sapaan kapital nama pengguna aktif, judul topik pertemuan, kalimat apresiasi & motivasi kontekstual (sisi depan kartu *3D flip*), pantun edukatif 4 baris sesuai topik (sisi belakang kartu *3D flip*), dan intisari penerapan nyata.

### Pemetaan Komponen Interaktif & Penanganan Status

- **Pemuatan & Perpindahan Pertemuan**: Saat pengguna mengganti kelas atau pertemuan, status pemuatan direset bersih, pertanyaan pertemuan baru diambil, draf lokal dipulihkan (jika belum dikirim), dan langganan *real-time* basis data dipasang ulang khusus untuk kombinasi akun dan pertemuan aktif.
- **Pengetikan & Penyimpanan Draf**: Setiap perubahan teks pada kolom jawaban langsung memperbarui penghitung kata serta menyimpan draf lokal per akun dan pertemuan tanpa menandai tahap selesai sebelum tombol kirim ditekan.
- **Validasi & Pengiriman Jawaban**: Tombol **Selesai dan Kirim Refleksi** memeriksa kelengkapan kedua jawaban; jika valid, tombol masuk ke status menyimpan (anti-klik ganda), menulis dokumen ke basis data awan dan cermin lokal, mengaktifkan status selesai pada progres pertemuan (100%), lalu menampilkan kartu apresiasi *3D flip*.
- **Interaksi Kartu *3D Flip* & Mode Edit**: Tombol maupun ketukan pada kartu membalik orientasi kartu antara sisi motivasi dan sisi pantun edukatif; tombol **Edit Jawaban** membuka kembali kolom teks dengan isi terakhir agar siswa dapat menyempurnakan refleksinya dan menyimpan pembaruan.
- **Navigasi Penutup Pertemuan**: Tombol **Pertemuan Berikutnya** mengarahkan ruang belajar ke pertemuan selanjutnya dalam urutan kurikulum (dimulai dari tahap awal pertemuan baru), sedangkan tombol **Daftar Materi** membuka panel pilih cepat seluruh bab dan pertemuan lintas kelas beserta penanda ketuntasan belajarnya.
