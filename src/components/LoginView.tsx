import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { UserRole, UserSession } from '../types/learning';
import { buildCanonicalUid } from '../utils/authSession';
import { firebaseAuth, firebaseDb } from '../utils/firebaseClient';

interface LoginViewProps {
  onLogin: (session: UserSession) => void;
}

interface StatusState {
  message: string;
  type: 'error' | 'success';
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('siswa');
  const [nama, setNama] = useState('');
  const [nisn, setNisn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<StatusState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);
    setStatus(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (role === 'siswa') {
      const namaInput = nama.trim();
      const nisnInput = nisn.trim();

      if (namaInput === '' || nisnInput === '') {
        setStatus({
          message: 'Nama dan NISN wajib diisi.',
          type: 'error',
        });
        return;
      }

      setIsSubmitting(true);
      setStatus({
        message: 'Memeriksa data siswa...',
        type: 'success',
      });

      try {
        let q = query(
          collection(firebaseDb, 'siswa'),
          where('NISN', '==', nisnInput)
        );
        let querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          const nisnAngka = Number(nisnInput);
          if (!Number.isNaN(nisnAngka)) {
            q = query(
              collection(firebaseDb, 'siswa'),
              where('NISN', '==', nisnAngka)
            );
            querySnapshot = await getDocs(q);
          }
        }

        if (querySnapshot.empty) {
          setStatus({
            message: 'NISN tidak terdaftar di database.',
            type: 'error',
          });
          setIsSubmitting(false);
          return;
        }

        let siswaCocok = false;
        let namaTerdaftar = namaInput;
        let matchedDocId = '';

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          for (const kolom in data) {
            const namaKolomBersih = kolom
              .trim()
              .toLowerCase()
              .replace(/_/g, '');
            if (namaKolomBersih.includes('nama')) {
              const isiNamaDatabase = data[kolom];
              if (
                typeof isiNamaDatabase === 'string' &&
                isiNamaDatabase.trim().toLowerCase() ===
                  namaInput.toLowerCase()
              ) {
                siswaCocok = true;
                namaTerdaftar = isiNamaDatabase.trim();
                matchedDocId = docSnap.id;
                break;
              }
            }
          }
        });

        if (siswaCocok) {
          const studentUid = buildCanonicalUid({
            role: 'siswa',
            nisn: nisnInput,
            siswaDocId: matchedDocId,
          });

          localStorage.setItem('infoFun_LoggedOut', 'false');
          localStorage.setItem('infoFun_UID', studentUid);
          if (matchedDocId) {
            localStorage.setItem('infoFun_SiswaDocId', matchedDocId);
          }
          localStorage.setItem('userRole', 'siswa');
          localStorage.setItem('userName', namaTerdaftar);
          localStorage.setItem('userNISN', nisnInput);

          setStatus({
            message: 'Login Siswa berhasil! Mengalihkan...',
            type: 'success',
          });

          setTimeout(() => {
            onLogin({
              uid: studentUid,
              nama: namaTerdaftar,
              nisn: nisnInput,
              email: '',
              role: 'siswa',
              ...(matchedDocId ? { siswaDocId: matchedDocId } : {}),
            });
          }, 700);
        } else {
          setStatus({
            message: 'Nama tidak cocok dengan NISN yang terdaftar.',
            type: 'error',
          });
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error('Error Database:', error);
        setStatus({
          message: 'Terjadi kesalahan koneksi database.',
          type: 'error',
        });
        setIsSubmitting(false);
      }
    } else {
      const emailInput = email.trim();
      const passwordInput = password;

      if (emailInput === '' || passwordInput === '') {
        setStatus({
          message: 'Email dan password belum diisi.',
          type: 'error',
        });
        return;
      }

      setIsSubmitting(true);
      setStatus({
        message: 'Memeriksa akun Guru...',
        type: 'success',
      });

      try {
        const credential = await signInWithEmailAndPassword(
          firebaseAuth,
          emailInput,
          passwordInput
        );

        const guruUid = buildCanonicalUid({
          role: 'guru',
          email: emailInput,
          authUid: credential.user.uid,
        });

        localStorage.setItem('infoFun_LoggedOut', 'false');
        localStorage.setItem('infoFun_UID', guruUid);
        localStorage.setItem('userRole', 'guru');
        localStorage.setItem('userName', emailInput);

        setStatus({
          message: 'Login Guru berhasil! Mengalihkan ke Dashboard...',
          type: 'success',
        });

        const guruDisplayName =
          credential.user.displayName?.trim() || emailInput;

        setTimeout(() => {
          onLogin({
            uid: guruUid,
            nama: guruDisplayName,
            nisn: '',
            email: emailInput,
            role: 'guru',
          });
        }, 700);
      } catch {
        setStatus({
          message: 'Email atau password guru salah.',
          type: 'error',
        });
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="login-bg-gradient min-h-screen flex justify-center items-center p-5 w-full font-[var(--font-nav)]">
      <div className="bg-white w-full max-w-[400px] rounded-[20px] py-[32px] px-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.1)] text-center">
        {/* Ikon Kepala */}
        <div className="w-[50px] h-[50px] bg-[#F0F7FF] rounded-[12px] flex items-center justify-center mx-auto mb-[12px] text-[#527F9B]">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
          </svg>
        </div>

        <h1 className="text-[24px] font-extrabold text-[#173B57] mb-[6px] font-[var(--font-nav)]">
          LOGIN
        </h1>
        <p className="text-[13px] text-[#314F68] mb-[20px]">
          Silakan masuk untuk melanjutkan pembelajaran Informatika.
        </p>

        {/* Pilihan Peran (Siswa / Guru) */}
        <div className="flex bg-[#F1F5F9] p-[4px] rounded-[10px] mb-[20px]">
          <div className="flex-1">
            <input
              type="radio"
              id="roleSiswa"
              name="userRole"
              value="siswa"
              checked={role === 'siswa'}
              onChange={() => handleRoleChange('siswa')}
              className="hidden"
            />
            <label
              htmlFor="roleSiswa"
              className={`block py-[8px] px-[12px] text-[13px] font-bold rounded-[8px] cursor-pointer transition duration-200 ${
                role === 'siswa'
                  ? 'bg-white text-[#173B57] shadow-[0_2px_5px_rgba(0,0,0,0.08)]'
                  : 'text-[#314F68]'
              }`}
            >
              Siswa
            </label>
          </div>

          <div className="flex-1">
            <input
              type="radio"
              id="roleGuru"
              name="userRole"
              value="guru"
              checked={role === 'guru'}
              onChange={() => handleRoleChange('guru')}
              className="hidden"
            />
            <label
              htmlFor="roleGuru"
              className={`block py-[8px] px-[12px] text-[13px] font-bold rounded-[8px] cursor-pointer transition duration-200 ${
                role === 'guru'
                  ? 'bg-white text-[#173B57] shadow-[0_2px_5px_rgba(0,0,0,0.08)]'
                  : 'text-[#314F68]'
              }`}
            >
              Guru
            </label>
          </div>
        </div>

        {/* Form Login */}
        <form id="loginForm" onSubmit={handleSubmit}>
          {role === 'siswa' ? (
            <div>
              <div className="text-left mb-[16px]">
                <label
                  htmlFor="nama"
                  className="block text-[12px] font-bold text-[#173B57] mb-[6px]"
                >
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full h-[44px] bg-white border border-[#CBD5E1] focus:border-[#527F9B] rounded-[10px] px-[14px] text-[14px] text-[#173B57] outline-none"
                />
              </div>

              <div className="text-left mb-[16px]">
                <label
                  htmlFor="nisn"
                  className="block text-[12px] font-bold text-[#173B57] mb-[6px]"
                >
                  NISN
                </label>
                <input
                  type="text"
                  id="nisn"
                  inputMode="numeric"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Masukkan NISN"
                  className="w-full h-[44px] bg-white border border-[#CBD5E1] focus:border-[#527F9B] rounded-[10px] px-[14px] text-[14px] text-[#173B57] outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="text-left mb-[16px]">
                <label
                  htmlFor="email"
                  className="block text-[12px] font-bold text-[#173B57] mb-[6px]"
                >
                  Email Guru
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email guru"
                  className="w-full h-[44px] bg-white border border-[#CBD5E1] focus:border-[#527F9B] rounded-[10px] px-[14px] text-[14px] text-[#173B57] outline-none"
                />
              </div>

              <div className="text-left mb-[16px]">
                <label
                  htmlFor="password"
                  className="block text-[12px] font-bold text-[#173B57] mb-[6px]"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full h-[44px] bg-white border border-[#CBD5E1] focus:border-[#527F9B] rounded-[10px] px-[14px] text-[14px] text-[#173B57] outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            id="btnLogin"
            disabled={isSubmitting}
            className="w-full h-[46px] bg-[#527F9B] hover:bg-[#477FA0] disabled:opacity-70 text-white rounded-[10px] text-[15px] font-bold cursor-pointer mt-[10px] transition duration-200"
          >
            LOGIN
          </button>

          {status && (
            <div
              id="statusMessage"
              className={`text-[13px] font-semibold p-[10px] rounded-[8px] mt-[12px] ${
                status.type === 'error'
                  ? 'bg-[#FEE2E2] text-[#e63946]'
                  : 'bg-[#D1FAE5] text-[#2a9d8f]'
              }`}
            >
              {status.message}
            </div>
          )}
        </form>

        <div className="mt-[24px] pt-[16px] border-t border-[#E2E8F0]">
          <p className="text-[12px] font-extrabold text-[#314F68]">
            INFORMATIKA FUN
          </p>
          <p className="text-[11px] text-[#6F91AA] mt-[2px]">
            By: Riski Amalia, S.Pd
          </p>
        </div>
      </div>
    </div>
  );
};
