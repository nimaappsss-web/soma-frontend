import { DocumentText, Profile2User } from "iconsax-react";

import { useTeacherProfile } from "../../teacher/api";
import { useActiveTerm } from "../../calendar/api";
import { termLabel } from "../../calendar/utils/term";
import { useTermResults } from "../api/useTermResults";
import { cn } from "../../../lib/utils";
import type { TermResultsResponse } from "../types";

const gradeTone = (grade: string) => {
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "text-springgreen600";
  if (g.startsWith("B") || g.startsWith("C")) return "text-azure500";
  return "text-amber500";
};

export const TermResultsView = () => {
  const { formClassId, formClass, isLoading: profileLoading } = useTeacherProfile();
  const { activeTerm } = useActiveTerm();

  const term = activeTerm?.term ?? "";

  const { data, isLoading, error } = useTermResults({
    classId: formClassId ?? "",
    term,
    session: "",
  });

  if (profileLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
      </div>
    );
  }

  if (!formClassId) {
    return (
      <div className="bg-white rounded-xl border border-gray100 p-12 text-center">
        <Profile2User size={32} className="mx-auto text-gray300 mb-3" variant="Bold" />
        <p className="text-sm font-medium text-gray900">You're not assigned as a form teacher</p>
        <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
          Once you're assigned a form class, you'll be able to review its term results here.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray100 p-12 text-center">
        <p className="text-sm font-medium text-gray900">Couldn't load term results</p>
        <p className="text-xs text-gray500 mt-1">
          {error.response?.data?.message ?? error.message}
        </p>
      </div>
    );
  }

  const results = data as TermResultsResponse | undefined;

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray900">Term Results</h1>
          <p className="text-xs md:text-sm text-gray500 mt-0.5">
            {formClass} · {term ? termLabel(term).label : "Term"} · Read-only
          </p>
        </div>
      </div>

      {!results || results.students.length === 0 ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-12 text-center">
          <DocumentText size={32} className="mx-auto text-gray300 mb-3" variant="Bold" />
          <p className="text-sm font-medium text-gray900">No results yet</p>
          <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
            Results appear here once scores have been entered for this class in the active term.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {results.students.map((s) => (
            <div key={s.studentId} className="bg-white rounded-xl border border-gray100 overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray900 text-sm font-bold text-white">
                  {s.position}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray900 truncate">{s.studentName}</p>
                  <p className="text-xs text-gray500 truncate">{s.admissionNo}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray500">{s.totalScore} / {s.subjects.length * 100}</p>
                  <p className="text-xs text-gray400 mt-0.5">{s.average.toFixed(1)}% · {s.classSize} in class</p>
                </div>
              </div>
              <div className="border-t border-gray100 divide-y divide-gray100">
                {s.subjects.map((sub) => (
                  <div key={sub.subjectId} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray900 truncate">{sub.subjectName}</p>
                      <p className="text-xs text-gray400 truncate">{sub.teacherName}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray500 w-10 text-right">{sub.caScore} CA</span>
                    <span className="shrink-0 text-xs text-gray500 w-10 text-right">{sub.examScore} Exam</span>
                    <span className="shrink-0 text-sm font-semibold text-gray900 w-8 text-right">{sub.total}</span>
                    <span className={cn("shrink-0 w-10 text-right text-sm font-bold", gradeTone(sub.grade))}>{sub.grade}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray100 flex items-center justify-end gap-4">
                <p className="text-xs text-gray500">
                  Attendance: <span className="font-semibold text-gray900">{s.attendancePercentage}%</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
