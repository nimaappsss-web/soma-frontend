import type { ReactNode } from "react";

interface TintedStatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  bgColor: string;
  badge?: { text: string; icon?: ReactNode };
}

export const TintedStatCard = ({ label, value, icon, bgColor, badge }: TintedStatCardProps) => (
  <div className={`${bgColor} rounded-2xl p-5 flex flex-col justify-between min-h-[140px] relative overflow-hidden`}>
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-lg bg-gray900 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray600">{label}</span>
    </div>
    <div className="mt-4">
      <p className="text-[32px] font-bold text-gray900 leading-none tracking-tight">{value}</p>
      {badge && (
        <div className="inline-flex items-center gap-1.5 mt-3 bg-gray900 text-white text-xs font-medium rounded-full px-3 py-1.5">
          {badge.icon}
          {badge.text}
        </div>
      )}
    </div>
  </div>
);
