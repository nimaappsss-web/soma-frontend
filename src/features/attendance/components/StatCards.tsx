import { Sparklines, SparklinesLine } from "react-sparklines";
import type { AttendanceSummary } from "../types";

interface StatCardsProps {
  data?: AttendanceSummary;
  isLoading: boolean;
  sparklineData?: number[];
}

export const ratePillClass = (pct: number) => {
  if (pct >= 80) return "bg-springgreen600/10 text-springgreen600";
  if (pct >= 50) return "bg-amber500/10 text-amber500";
  return "bg-red500/10 text-red500";
};

export const StatCards = ({ data, isLoading, sparklineData }: StatCardsProps) => {
  const perClass = data?.byClass ?? [];
  const trend = sparklineData ?? perClass.map((c) => (c.total > 0 ? Math.round((c.present / c.total) * 100) : 0));
  const markedClasses = perClass.filter((c) => c.present + c.absent > 0).length;

  const LargeCard = ({
    label,
    value,
    sub,
    sparkColor,
    textColor,
  }: {
    label: string;
    value: string;
    sub?: string;
    sparkColor: string;
    textColor: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray100 p-5">
      <p className="text-xs text-gray500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray900 mt-1">{value}</p>
      {sub && <p className={`text-xs font-medium mt-1 ${textColor}`}>{sub}</p>}
      {trend.length > 1 && (
        <div className="w-full h-8 mt-3">
          <Sparklines
            data={trend}
            width={240}
            height={32}
            margin={2}
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <SparklinesLine color={sparkColor} style={{ fill: "none", strokeWidth: 1.5 }} />
          </Sparklines>
        </div>
      )}
    </div>
  );

  const SmallCard = ({
    label,
    value,
    tone,
  }: {
    label: string;
    value: string;
    tone?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray100 p-4 min-w-[140px] flex-1">
      <p className="text-xs text-gray500 font-medium">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className={`text-lg font-bold ${tone ?? "text-gray900"}`}>{value}</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LargeCard
          label="Attendance Rate"
          value={isLoading ? "—" : `${data?.percentage ?? 0}%`}
          sub={
            isLoading
              ? undefined
              : `${data?.present ?? 0} present of ${data?.totalStudents ?? 0} students`
          }
          sparkColor="#4285F4"
          textColor="text-azure500"
        />
        <LargeCard
          label="Absent Today"
          value={isLoading ? "—" : String(data?.absent ?? 0)}
          sub={
            isLoading
              ? undefined
              : `${markedClasses} of ${perClass.length} classes marked`
          }
          sparkColor="#CD432F"
          textColor="text-red500"
        />
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:overflow-visible">
        <SmallCard
          label="Present"
          value={isLoading ? "—" : String(data?.present ?? 0)}
          tone="text-springgreen600"
        />
        <SmallCard label="Absent" value={isLoading ? "—" : String(data?.absent ?? 0)} tone="text-red500" />
        <SmallCard
          label="Total Enrolled"
          value={isLoading ? "—" : String(data?.totalStudents ?? 0)}
        />
        <SmallCard
          label="Day"
          value={
            isLoading
              ? "—"
              : data?.isHoliday
                ? "Holiday"
                : data?.isWeekend
                  ? "Weekend"
                  : data?.dayOfWeek || "School day"
          }
          tone={
            data?.isHoliday || data?.isWeekend ? "text-amber500" : "text-gray900"
          }
        />
      </div>
    </>
  );
};
