import { ArrowRight } from "iconsax-react";
import type { DashboardStats } from "../types";

interface RowProps {
  label: string;
  value: string | number;
  badge?: string;
}

const OperationsRow = ({ label, value, badge }: RowProps) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-sm text-gray700">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray900">{value}</span>
      {badge && (
        <span className="text-[10px] bg-azure100 text-azure500 px-1.5 py-0.5 rounded font-medium">{badge}</span>
      )}
      <ArrowRight variant="Bold" size={14} className="text-gray300" />
    </div>
  </div>
);

interface OperationsSectionProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export const OperationsSection = ({ stats, isLoading }: OperationsSectionProps) => (
  <div className="bg-white rounded-xl border border-gray100 p-5">
    <h3 className="text-sm font-semibold text-gray900 mb-4">Parent & Student Operations</h3>
    <div className="space-y-3">
      <OperationsRow label="Active Parent App Users" value={1062} />
      <OperationsRow label="Unlinked Parent Accounts" value={88} />
      <OperationsRow label="Today's Student Attendance" value={isLoading ? "—" : `${stats?.attendance.today.percentage ?? 0}%`} />
      <OperationsRow label="Tuition Defaulters" value={142} badge="Current term" />
      <OperationsRow label="Broadcast Open Rate" value="98.2%" />
    </div>
  </div>
);
