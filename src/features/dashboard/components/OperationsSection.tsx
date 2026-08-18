import type { ReactNode } from "react";
import { Profile2User, Link2, ClipboardTick, Wallet3, Notification } from "iconsax-react";
import type { DashboardStats } from "../types";

const Tile = ({
  icon,
  bg,
  value,
  label,
}: {
  icon: ReactNode;
  bg: string;
  value: string | number;
  label: string;
}) => (
  <div className="rounded-xl p-3">
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>{icon}</div>
    <p className="text-lg font-bold text-gray900 leading-none">{value}</p>
    <p className="text-[11px] text-gray500 mt-1 leading-tight">{label}</p>
  </div>
);

interface OperationsSectionProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export const OperationsSection = ({ stats, isLoading }: OperationsSectionProps) => (
  <div className="bg-white rounded-3xl border border-gray100 p-5">
    <h3 className="text-sm font-semibold text-gray900">Parent & Student Operations</h3>

    <div className="grid grid-cols-2 gap-2 mt-4">
      <Tile
        icon={<Profile2User size={16} color="#4285F4" variant="Bold" />}
        bg="bg-[#EBF0FF]"
        value={1062}
        label="Active parent app users"
      />
      <Tile
        icon={<Link2 size={16} color="#FBBC05" variant="Bold" />}
        bg="bg-[#FEF6E0]"
        value={88}
        label="Unlinked parent accounts"
      />
      <Tile
        icon={<ClipboardTick size={16} color="#34A853" variant="Bold" />}
        bg="bg-[#E9F7EE]"
        value={isLoading ? "—" : `${stats?.attendance.today.percentage ?? 0}%`}
        label="Today's attendance"
      />
      <Tile
        icon={<Wallet3 size={16} color="#CD432F" variant="Bold" />}
        bg="bg-[#FFF0ED]"
        value={142}
        label="Tuition defaulters"
      />
    </div>

    <div className="mt-3 pt-4 border-t border-gray100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F3EDFF] flex items-center justify-center">
            <Notification size={16} color="#8C37C3" variant="Bold" />
          </div>
          <div>
            <p className="text-sm text-gray700">Broadcast open rate</p>
            <p className="text-[11px] text-gray400">Current term</p>
          </div>
        </div>
        <span className="text-lg font-bold text-gray900 leading-none">98.2%</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-gray100 overflow-hidden">
        <div className="h-full rounded-full bg-indigo500" style={{ width: "98.2%" }} />
      </div>
    </div>
  </div>
);