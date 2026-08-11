import { useMemo } from "react";
import { CalendarTick } from "iconsax-react";

import { useAuth } from "../../contexts/AuthContext";
import { useTeacherProfile } from "../../features/teacher/api";
import { useTeacherTimetableCache } from "../../features/timetable/api";
import { TimetableGrid, buildSubjectColorMap, solidSwatch } from "../../features/timetable/components/TimetableGrid";
import { TimetableMobile } from "../../features/timetable/components/TimetableMobile";
import { SomaLoader } from "../../components/ui/SomaLoader";
import { cn } from "../../lib/utils";

export const TeacherTimetable = () => {
  const { user } = useAuth();
  const teacherId = user?.id ?? "";
  const { entries, isLoading, error, refresh } = useTeacherTimetableCache(teacherId);
  const { assignments } = useTeacherProfile();

  // A teacher's own name is redundant inside the grid cells.
  const selfEntries = useMemo(() => entries.map((e) => ({ ...e, teacherName: "" })), [entries]);

  const subjectColorMap = useMemo(
    () => buildSubjectColorMap(assignments.map((a) => ({ subjectId: a.subject.id }))),
    [assignments],
  );
  const lessonCount = (subjectId: string) => entries.filter((e) => e.subjectId === subjectId).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray900 md:text-2xl">My timetable</h1>
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
        <div className="rounded-xl border border-input bg-card p-10 text-center">
          <CalendarTick size={28} color="#BBBBBB" className="mx-auto" />
          <p className="mt-3 text-sm text-placeholder">
            No lessons assigned yet. Your timetable will appear here once the school publishes it.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.length > 0 && (
            <div className="rounded-xl border border-input bg-card p-4">
              <p className="text-sm font-semibold text-gray900">Subjects you teach</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {assignments.map((a) => (
                  <span
                    key={a.subject.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray100 bg-offWhite px-3 py-1.5 text-xs"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        solidSwatch(subjectColorMap.get(a.subject.id) ?? ""),
                      )}
                    />
                    <span className="font-medium text-gray900">{a.subject.name}</span>
                    <span className="text-gray500">{a.classes.map((c) => c.name).join(", ")}</span>
                    <span className="text-placeholder">
                      · {lessonCount(a.subject.id)}/wk
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="hidden md:block">
            <TimetableGrid periodsPerDay={9} entries={selfEntries} showTeacher={false} showClass />
          </div>
          <div className="md:hidden">
            <TimetableMobile periodsPerDay={9} entries={selfEntries} showClass />
          </div>
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
