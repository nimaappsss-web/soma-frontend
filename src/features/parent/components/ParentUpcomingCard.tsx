import { Calendar, InfoCircle } from "iconsax-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "../../calendar/types";

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  EVENT: { bg: "bg-azure500/10", color: "#4285F4" },
  HOLIDAY: { bg: "bg-amber-300/20", color: "#FBBC05" },
  EXAM: { bg: "bg-[#F3EDFF]", color: "#8C37C3" },
  MEETING: { bg: "bg-[#E9F7EE]", color: "#34A853" },
  SPORTS: { bg: "bg-[#FFF0ED]", color: "#CD432F" },
};

const TYPE_LABEL: Record<string, string> = {
  EVENT: "Event",
  HOLIDAY: "Holiday",
  EXAM: "Exam",
  MEETING: "Meeting",
  SPORTS: "Sports",
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr.slice(0, 10));
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const key = dateStr.slice(0, 10);

  if (key === today.toISOString().split("T")[0]) return "Today";
  if (key === tomorrow.toISOString().split("T")[0]) return "Tomorrow";
  return d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
};

export const ParentUpcomingCard = ({ events }: { events: CalendarEvent[] }) => {
  const visible = events.slice(0, 4);

  return (
    <div className="bg-white rounded-2xl border border-gray100 p-5">
      <h3 className="text-base font-semibold text-gray900 mb-4">Upcoming</h3>
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-gray50 flex items-center justify-center mb-2">
            <InfoCircle size={18} color="#8C8C8C" />
          </div>
          <p className="text-sm text-gray400">Nothing upcoming</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((e) => {
            const typeColor = TYPE_COLORS[e.type] ?? TYPE_COLORS.EVENT;
            return (
              <div key={e.id} className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", typeColor.bg)}>
                  <Calendar size={16} color={typeColor.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray900 truncate">{e.title}</p>
                  <p className="text-xs text-gray500 truncate">
                    {formatDate(e.date)} · {TYPE_LABEL[e.type] ?? e.type}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};