import type { ReactNode } from "react";
import { ProfileTick, UserAdd, Profile, ProfileCircle } from "iconsax-react";
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

interface SchoolOverviewProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export const SchoolOverview = ({ stats, isLoading }: SchoolOverviewProps) => (
  <div className="bg-white rounded-3xl border border-gray100 p-5">
    <h3 className="text-sm font-semibold text-gray900">Academics</h3>

    <div className="mt-4 space-y-3">
      <StatusRow
        icon={<ProfileTick size={16} color="#34A853" variant="Bold" />}
        bg="bg-[#E9F7EE]"
        label="Active teachers"
        value={isLoading ? "—" : (stats?.teachers.active ?? 0)}
      />
      <StatusRow
        icon={<UserAdd size={16} color="#FBBC05" variant="Bold" />}
        bg="bg-[#FEF6E0]"
        label="Pending invites"
        value={isLoading ? "—" : (stats?.teachers.pendingInvites ?? 0)}
      />
      <p className="text-[11px] uppercase tracking-wide text-gray400">
        Teaching & learning
      </p>
      <StatusRow
        icon={<Profile size={16} color="#4285F4" variant="Bold" />}
        bg="bg-[#EBF0FF]"
        label="Male students"
        value={isLoading ? "—" : (stats?.students.male ?? 0)}
      />
      <StatusRow
        icon={<ProfileCircle size={16} color="#EC4899" variant="Bold" />}
        bg="bg-[#FDECF4]"
        label="Female students"
        value={isLoading ? "—" : (stats?.students.female ?? 0)}
      />
    </div>
  </div>
);