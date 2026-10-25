import React, { useState } from 'react';
import { DesktopTower, Student, ChalkboardTeacher } from '@phosphor-icons/react';
import { UserRole, UserSession } from '../types/learning';

interface LoginViewProps {
  onLogin: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('siswa');
  const [namaSiswa, setNamaSiswa] = useState('');
  const [nisn, setNisn] = useState('');
  const [namaGuru, setNamaGuru] = useState('');
  const [emailGuru, setEmailGuru] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (role === 'siswa') {
      const cleanNama = namaSiswa.trim();
      const cleanNisn = nisn.trim();
      if (!cleanNama && !cleanNisn) {
        setErrorMessage('Silakan isi Nama Lengkap dan NISN untuk masuk sebagai Siswa.');
        return;
      }
      if (cleanNisn && !/^\d+$/.test(cleanNisn)) {
        setErrorMessage('NISN harus berupa angka.');
        return;
      }
      onLogin({
        nama: cleanNama || 'Pelajar',
        nisn: cleanNisn || '0000000000',
        email: '',
        role: 'siswa',
      });
    } else {
      const cleanEmail = emailGuru.trim();
      const cleanNamaGuru = namaGuru.trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setErrorMessage('Silakan masukkan alamat Email Guru yang valid.');
        return;
      }
      onLogin({
        nama: cleanNamaGuru || 'Riski Amalia, S.Pd',
        nisn: '',
        email: cleanEmail,
        role: 'guru',
      });
    }
  };

  return (
    <div id="login-container" className="login-bg-gradient min-h-screen flex items-center justify-center p-5 w-full">
      <div className="bg-white w-full max-w-[420px] rounded-[20px] px-7 py-8 shadow-[0_10px_30px_rgba(0,0,0,0.1)] text-center font-[var(--font-nav)] text-[#243447]">
        <div className="w-[54px] h-[54px] bg-[#DCEAF5] rounded-xl flex items-center justify-center mx-auto mb-3 text-[#527DA8]">
          <DesktopTower size={30} weight="duotone" />
        </div>

        <h1 className="text-2xl font-extrabold text-[#243B53] mb-1.5 font-[var(--font-title)]">
          INFORMATIKA FUN!
        </h1>
        <p className="text-[13px] text-[#607286] mb-5">
          Masuk ke Ruang Belajar untuk mengakses materi dan progres pembelajaran.
        </p>

        {/* Pemilih Peran Siswa / Guru */}
        <div className="flex bg-[#F1F5F9] p-1 rounded-[10px] mb-5">
          <button
            type="button"
            onClick={() => {
              setRole('siswa');
              setErrorMessage('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[13px] font-bold rounded-lg transition cursor-pointer ${
              role === 'siswa'
                ? 'bg-white text-[#243B53] shadow-[0_2px_5px_rgba(0,0,0,0.08)]'
                : 'text-[#607286] hover:text-[#243B53]'
            }`}
          >
            <Student size={18} weight="bold" />
            Siswa
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('guru');
              setErrorMessage('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[13px] font-bold rounded-lg transition cursor-pointer ${
              role === 'guru'
                ? 'bg-white text-[#243B53] shadow-[0_2px_5px_rgba(0,0,0,0.08)]'
                : 'text-[#607286] hover:text-[#243B53]'
            }`}
          >
            <ChalkboardTeacher size={18} weight="bold" />
            Guru
          </button>
        </div>

        <form onSubmit={handleSubmit} className="text-left">
          {role === 'siswa' ? (
            <div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#243B53] mb-1.5">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full h-11 bg-white border border-[#CBD5E1] rounded-[10px] px-3.5 text-sm text-[#243B53] outline-none focus:border-[#527DA8]"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#243B53] mb-1.5">
                  NISN
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Contoh: 0081234567"
                  className="w-full h-11 bg-white border border-[#CBD5E1] rounded-[10px] px-3.5 text-sm text-[#243B53] outline-none focus:border-[#527DA8]"
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#243B53] mb-1.5">
                  Nama Guru (Opsional)
                </label>
                <input
                  type="text"
                  value={namaGuru}
                  onChange={(e) => setNamaGuru(e.target.value)}
                  placeholder="Riski Amalia, S.Pd"
                  className="w-full h-11 bg-white border border-[#CBD5E1] rounded-[10px] px-3.5 text-sm text-[#243B53] outline-none focus:border-[#527DA8]"
                />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#243B53] mb-1.5">
                  Email Guru
                </label>
                <input
                  type="email"
                  value={emailGuru}
                  onChange={(e) => setEmailGuru(e.target.value)}
                  placeholder="nama@guru.smp.belajar.id"
                  className="w-full h-11 bg-white border border-[#CBD5E1] rounded-[10px] px-3.5 text-sm text-[#243B53] outline-none focus:border-[#527DA8]"
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="text-[13px] font-semibold p-2.5 rounded-lg bg-[#FEE2E2] text-[#e63946] mb-3">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full h-[46px] bg-[#527DA8] hover:bg-[#243B53] text-white rounded-[10px] text-[15px] font-bold cursor-pointer mt-1 transition"
          >
            Masuk ke Ruang Belajar
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
          <p className="text-xs font-extrabold text-[#607286]">
            DASHBOARD MATERI INFORMATIKA SMP
          </p>
          <p className="text-[11px] text-[#607286] mt-0.5">
            Kelas VII, VIII, dan IX — Kurikulum Merdeka
          </p>
        </div>
      </div>
    </div>
  );
};
