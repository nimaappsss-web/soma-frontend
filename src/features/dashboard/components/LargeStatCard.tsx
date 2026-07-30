import { Sparklines, SparklinesLine } from "react-sparklines";

const sparklineData = [30, 45, 38, 52, 48, 65, 58, 72, 68];

interface LargeStatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

export const LargeStatCard = ({ label, value, trend, trendUp }: LargeStatCardProps) => (
  <div className="bg-white rounded-xl border border-gray100 p-5">
    <p className="text-xs text-gray500 font-medium">{label}</p>
    <p className="text-2xl font-bold text-gray900 mt-1">{value}</p>
    <div className="flex items-center gap-3 mt-2">
      <div className="w-20 h-8">
        <Sparklines data={sparklineData} width={80} height={32} margin={2}>
          <SparklinesLine color={trendUp ? "#34A853" : "#CD432F"} style={{ fill: "none", strokeWidth: 1.5 }} />
        </Sparklines>
      </div>
      {trend && (
        <span className={`text-xs font-medium ${trendUp ? "text-springgreen600" : "text-red500"}`}>
          {trend} <span className="text-gray400 font-normal">from last term</span>
        </span>
      )}
    </div>
  </div>
);
