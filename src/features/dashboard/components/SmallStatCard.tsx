interface SmallStatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

export const SmallStatCard = ({ label, value, trend, trendUp }: SmallStatCardProps) => (
  <div className="bg-white rounded-xl border border-gray100 p-4">
    <p className="text-xs text-gray500 font-medium">{label}</p>
    <div className="flex items-baseline gap-2 mt-1">
      <p className="text-lg font-bold text-gray900">{value}</p>
      {trend && (
        <span className={`text-xs font-medium ${trendUp ? "text-springgreen600" : "text-red500"}`}>
          {trend}
        </span>
      )}
    </div>
  </div>
);
