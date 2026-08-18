import { useMemo } from "react";
import { DocumentText, Calendar, ClipboardTick } from "iconsax-react";
import { cn } from "@/lib/utils";
import { SomaLoader, parentLoadingDescriptions } from "../components/ui/SomaLoader";
import { useCalendarEvents } from "../features/calendar/api";
import { localDateKey } from "../utils/date";

const TYPE_LABEL: Record<string, string> = {
  EXAM: "Exam",
  TEST: "Test",
  EVENT: "Assessment",
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr.slice(0, 10));
  const today = localDateKey();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowKey = localDateKey(tomorrow);
  const key = dateStr.slice(0, 10);
  if (key === today) return "Today";
  if (key === tomorrowKey) return "Tomorrow";
  return d.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "short" });
};

export const ParentExams = () => {
  const today = localDateKey();
  const from = today;
  const to = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const { data, isLoading } = useCalendarEvents({
    from,
    to: localDateKey(to),
  });

  const allEvents = data?.events ?? [];

  const exams = useMemo(
    () =>
      allEvents
        .filter((e) => e.type === "EXAM")
        .filter((e) => e.date.slice(0, 10) >= today)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [allEvents, today],
  );

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray900">Examinations & Tests</h1>
        <p className="text-sm text-gray500 mt-1">Upcoming exams and tests</p>
      </div>

      {isLoading ? (
        <div className="py-12">
          <SomaLoader descriptions={parentLoadingDescriptions} />
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray100 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F3EDFF] flex items-center justify-center mx-auto mb-3">
            <DocumentText size={22} color="#8C37C3" />
          </div>
          <p className="text-gray500">No exams or tests scheduled right now.</p>
        </div>
      ) : (
        <div className="max-w-2xl">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-3xl border border-gray100 p-5 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#F3EDFF] flex items-center justify-center shrink-0">
                  <DocumentText size={20} color="#8C37C3" variant="Bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray900">{exam.title}</p>
                  <p className="text-xs text-gray500 mt-0.5">
                    {TYPE_LABEL[exam.type] ?? "Exam"} · {formatDate(exam.date)}
                  </p>
                  {exam.description && (
                    <p className="text-sm text-gray600 mt-2 whitespace-pre-wrap">{exam.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray500">
                    <Calendar size={13} color="#8C8C8C" />
                    <span>{exam.date.slice(0, 10)}</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    exam.date.slice(0, 10) === today ? "bg-[#E9F7EE]" : "bg-gray50",
                  )}
                >
                  <ClipboardTick size={18} color="#34A853" variant="Bold" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};