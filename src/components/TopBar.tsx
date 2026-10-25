import React, { useState } from 'react';
import { UserCircle, DesktopTower } from '@phosphor-icons/react';
import { UserSession } from '../types/learning';
import { getDisplayUserName } from '../utils/authSession';

interface TopBarProps {
  session: UserSession;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  session,
  onLogout,
}) => {
  const [logoError, setLogoError] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const displayName = getDisplayUserName(session);

  return (
    <header className="flex flex-wrap justify-between items-center gap-3 py-[15px] px-[5%] bg-[#1E3A5F] border-b-[3px] border-[#88D4AB]">
      <div className="font-[var(--font-title)] font-bold text-[#88D4AB] text-[1.35rem] sm:text-[1.45rem] flex items-center gap-3.5">
        {!logoError ? (
          <img
            src="https://cdn.phototourl.com/member/2026-10-20-301bf8f0-f5cd-4de0-a3fd-b9b3a2d0e3e0.png"
            alt="Logo INFORMATIKA FUN!"
            className="h-11 w-11 sm:h-12 sm:w-12 object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="h-10 w-10 rounded-xl bg-[#152C5B] border border-[#88D4AB]/50 flex items-center justify-center text-[#88D4AB]">
            <DesktopTower size={24} weight="duotone" />
          </div>
        )}
        <span>INFORMATIKA FUN!</span>
      </div>

      <div className="font-[var(--font-nav)] text-[0.9rem] text-[#D8BD7B] flex flex-wrap items-center gap-2.5">

        <div className="flex items-center gap-2">
          <span id="user-name-display" className="font-semibold">
            {displayName}
          </span>
          <UserCircle size={26} weight="fill" className="text-[#D8BD7B]" />
        </div>

        {!confirmingLogout ? (
          <button
            type="button"
            id="logout-btn"
            onClick={() => setConfirmingLogout(true)}
            className="bg-transparent text-[#E57373] border border-[#E57373] hover:bg-[#E57373] hover:text-white px-3 py-1 rounded-md font-[var(--font-nav)] text-xs font-bold cursor-pointer transition ml-1"
          >
            Keluar
          </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#152C5B] border border-[#E57373]/70 px-2.5 py-1 rounded-md">
            <span className="text-xs text-white">Yakin keluar?</span>
            <button
              type="button"
              onClick={() => {
                setConfirmingLogout(false);
                onLogout();
              }}
              className="bg-[#E57373] text-white px-2 py-0.5 rounded text-xs font-bold cursor-pointer hover:opacity-90"
            >
              Ya
            </button>
            <button
              type="button"
              onClick={() => setConfirmingLogout(false)}
              className="bg-white/10 text-white px-2 py-0.5 rounded text-xs font-semibold cursor-pointer hover:bg-white/20"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
