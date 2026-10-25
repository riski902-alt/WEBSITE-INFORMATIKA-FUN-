import React from 'react';
import { MENU_DEFINITIONS, MenuId } from '../types/learning';

interface StageActivityViewProps {
  menuId: MenuId;
}

export const StageActivityView: React.FC<StageActivityViewProps> = ({
  menuId,
}) => {
  const menuDef = MENU_DEFINITIONS.find((m) => m.id === menuId);

  return (
    <div className="bg-white/95 border border-dashed border-[#527DA8]/40 rounded-2xl p-10 text-center shadow-sm">
      <p className="text-sm font-medium text-[#607286]">
        Konten pada menu <strong className="text-[#243B53]">{menuDef?.label}</strong> masih kosong (file JSON belum dihubungkan).
      </p>
    </div>
  );
};
