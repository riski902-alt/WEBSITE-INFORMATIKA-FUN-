# INFORMATIKA FUN! - Ruang Belajar (React + TypeScript)

Aplikasi web pembelajaran interaktif untuk mata pelajaran **Informatika SMP (Kelas VII, VIII, dan IX)** berbasis **React 19**, **TypeScript**, **Vite**, dan **Tailwind CSS**.

## Fitur Utama

- **Katalog 81 Pertemuan Lengkap (Kelas 7, 8, dan 9)**: Navigasi seluruh bab dan pertemuan Semester 1 & 2, termasuk dukungan parameter URL `?id=<id-pertemuan>&menu=<id-menu>&view=baca`.
- **7 Tahapan Pembelajaran Berurutan**:
  1. **ATP (Alur Tujuan Pembelajaran)** — Kartu Elemen, Capaian Pembelajaran, Tujuan Pembelajaran, Topik, serta modal ringkasan ATP.
  2. **Asesmen Awal** — Kuis diagnostik interaktif (Pilihan Ganda, Pilihan Ganda Kompleks, Menjodohkan, dan Isian Singkat) beserta penilaian otomatis.
  3. **Pertanyaan Esensial** — Pemantik diskusi dan lembar catatan siswa.
  4. **Eksplorasi Konsep** — Pendalaman konsep inti terarah.
  5. **For Learning** — Latihan formatif terbimbing.
  6. **Penerapan Konsep** — Praktik mandiri dan studi kasus.
  7. **As Learning** — Refleksi mandiri akhir pertemuan.
- **Pelacakan Progres & Penyimpanan Otomatis**: Progres per siswa/pertemuan serta catatan kerja tersimpan di `localStorage` (dengan sinkronisasi opsional ke Firebase Realtime Database melalui `VITE_FIREBASE_DATABASE_URL`).
- **Autentikasi Peran Siswa & Guru**: Mendukung login Siswa (Nama & NISN) maupun Guru (Nama & Email), serta deteksi parameter sesi URL.
- **Mode Baca Materi Lengkap**: Ringkasan seluruh tahapan pertemuan dalam satu halaman.

## Menjalankan Proyek

```bash
npm install
npm run dev
```

Server pengembangan berjalan di `http://0.0.0.0:3000`.