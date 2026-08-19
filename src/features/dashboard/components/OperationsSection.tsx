import type { ReactNode } from "react";
import { Profile2User, Link2, ClipboardTick } from "iconsax-react";
import type { DashboardStats } from "../types";

const StatusRow = ({
  icon,
  bg,
  label,
  value,
}: {
  icon: ReactNode;
  bg: string;
  label: string;
  value: string | number;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
      <span className="text-sm text-gray700">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray900">{value}</span>
  </div>
);

interface OperationsSectionProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export const OperationsSection = ({ stats, isLoading }: OperationsSectionProps) => {
  const totalParents = stats?.parents.total ?? 0;
  const activeParents = stats?.parents.active ?? 0;
  const unlinked = Math.max(totalParents - activeParents, 0);

  return (
    <div className="bg-white rounded-3xl border border-gray100 p-5">
      <h3 className="text-sm font-semibold text-gray900">Parent & Student Operations</h3>

      <div className="mt-4 space-y-3">
        <StatusRow
          icon={<Profile2User size={16} color="#4285F4" variant="Bold" />}
          bg="bg-[#EBF0FF]"
          label="Active parent app users"
          value={isLoading ? "—" : activeParents}
        />
        <StatusRow
          icon={<Link2 size={16} color="#FBBC05" variant="Bold" />}
          bg="bg-[#FEF6E0]"
          label="Unlinked parent accounts"
          value={isLoading ? "—" : unlinked}
        />
        <StatusRow
          icon={<ClipboardTick size={16} color="#34A853" variant="Bold" />}
          bg="bg-[#E9F7EE]"
          label="Today's attendance"
          value={isLoading ? "—" : `${(stats?.attendance.today.percentage ?? 0).toFixed(1)}%`}
        />
      </div>
    </div>
  );
};