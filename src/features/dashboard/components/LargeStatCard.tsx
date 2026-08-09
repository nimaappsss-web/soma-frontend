const sparklineData = [30, 45, 38, 52, 48, 65, 58, 72, 68];

const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 32;
  const pad = 2;
  const step = (w - pad * 2) / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => `${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`).join(" ");
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

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
        <MiniSparkline data={sparklineData} color={trendUp ? "#34A853" : "#CD432F"} />
      </div>
      {trend && (
        <span className={`text-xs font-medium ${trendUp ? "text-springgreen600" : "text-red500"}`}>
          {trend} <span className="text-gray400 font-normal">from last term</span>
        </span>
      )}
    </div>
  </div>
);
