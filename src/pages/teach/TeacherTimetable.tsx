import { useEffect, useMemo, useState } from "react";
import { CalendarTick } from "iconsax-react";

import { useAuth } from "../../contexts/AuthContext";
import { useTeacherTimetableCache } from "../../features/timetable/api";
import { TimetableGrid } from "../../features/timetable/components/TimetableGrid";
import { buildClassColorMap } from "../../features/timetable/utils/classColors";
import { TimetableMobile } from "../../features/timetable/components/TimetableMobile";
import { TeacherCalendar } from "../../features/timetable/components/TeacherCalendar";
import { currentLessonKeys, todayName } from "../../features/timetable/utils/currentLesson";
import { distinctClasses, lessonsForDate, lessonsPerClass } from "../../features/timetable/utils/timetableDates";
import { EmptyState } from "../../components/ui/EmptyState";
import { SomaLoader } from "../../components/ui/SomaLoader";
import { HelpHint } from "../../components/ui/HelpHint";
import { cn } from "../../lib/utils";

type ViewMode = "week" | "month";

export const TeacherTimetable = () => {
  const { user } = useAuth();
  const teacherId = user?.id ?? "";
  const { entries, isLoading, error, refresh } = useTeacherTimetableCache(teacherId);

  const [filterClass, setFilterClass] = useState<string>("all");
  const [view, setView] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Keep the "current lesson" in sync with the clock while the page is open.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nowKeys = useMemo(() => currentLessonKeys(entries, now), [entries, now]);
  const today = useMemo(() => todayName(now), [now]);

  // A teacher's own name is redundant inside the grid cells.
  const selfEntries = useMemo(() => entries.map((e) => ({ ...e, teacherName: "" })), [entries]);

  const classes = useMemo(() => distinctClasses(entries), [entries]);
  const classColorMap = useMemo(() => buildClassColorMap(classes), [classes]);
  const counts = useMemo(() => lessonsPerClass(entries), [entries]);

  const filtered = useMemo(
    () => (filterClass === "all" ? selfEntries : selfEntries.filter((e) => e.className === filterClass)),
    [selfEntries, filterClass],
  );

  const selectedDayLessons = useMemo(
    () => (selectedDate ? lessonsForDate(selfEntries, selectedDate) : []),
    [selectedDate, selfEntries],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <div className="mb-5">
        <div className="group flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-gray900 md:text-2xl">My timetable</h1>
          <HelpHint
            title="My timetable"
            storageKey="teacher-timetable"
            description="Your lessons across all classes, week by week."
            sections={[
              { title: "What you'll see", text: "Every lesson you teach is shown in its class color, with subject, time, and room." },
              { title: "Switch views", text: "Browse week by week with the calendar or grid, and pick a day to zoom in." },
              { title: "Class colors", text: "Each class has its own color so you can tell them apart at a glance." },
            ]}
          />
        </div>
        <p className="text-sm text-placeholder">Your lessons across all classes, week by week.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <SomaLoader />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-input p-8 text-center text-sm text-placeholder">
          Could not load your timetable.
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<CalendarTick size={30} variant="Bold" color="#0D0D0D" />}
          title="No lessons assigned yet"
          description="Your timetable will appear here once the school publishes your lessons."
        />
      ) : (
        <div className="space-y-5">
          {/* Class filter + view toggle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterClass("all")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filterClass === "all"
                    ? "border-gray900 bg-gray900 text-white"
                    : "border-input text-gray700 hover:bg-gray50",
                )}
              >
                All classes
              </button>
              {classes.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setFilterClass(name)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    filterClass === name
                      ? "border-gray900 bg-gray900 text-white"
                      : "border-input text-gray700 hover:bg-gray50",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      (classColorMap.get(name) ?? "").split(" ")[1]?.replace("text-", "bg-") ?? "bg-gray500",
                    )}
                  />
                  {name}
                  <span className={filterClass === name ? "text-white/60" : "text-placeholder"}>
                    · {counts.get(name) ?? 0}/wk
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-full border border-input bg-background p-1">
              {(["week", "month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors",
                    view === mode ? "bg-gray900 text-white" : "text-gray700 hover:bg-gray50",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {view === "week" ? (
            <>
              <div className="hidden md:block">
                <TimetableGrid periodsPerDay={9} entries={filtered} showTeacher={false} showClass colorBy="class" nowKeys={nowKeys} today={today} />
              </div>
              <div className="md:hidden">
                <TimetableMobile periodsPerDay={9} entries={filtered} showClass colorBy="class" nowKeys={nowKeys} />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <TeacherCalendar entries={filtered} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
              {selectedDayLessons.length > 0 && (
                <div className="rounded-xl border border-input bg-card p-4">
                  <p className="text-sm font-semibold text-gray900">
                    {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {selectedDayLessons.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-3 rounded-lg bg-gray50 px-3 py-2"
                      >
                        <span
                          className={cn(
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            (classColorMap.get(e.className) ?? "").split(" ")[1]?.replace("text-", "bg-") ?? "bg-gray500",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-gray900">{e.subjectName || "Subject"}</p>
                          <p className="truncate text-[11px] text-placeholder">
                            {e.className} · {e.startTime}–{e.endTime}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={refresh}
            className="text-xs font-medium text-azure500 hover:underline"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};
