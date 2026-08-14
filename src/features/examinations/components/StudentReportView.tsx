import { useNavigate, useParams } from "react-router";
import { ArrowLeft2, DocumentText, Profile2User } from "iconsax-react";
import { useTeacherProfile } from "../../teacher/api";
import { useActiveTerm } from "../../calendar/api";
import { termLabel } from "../../calendar/utils/term";
import { useStudents } from "../../students/api";
import { useSessionAverageReport } from "../api/useSessionAverageReport";
import { useReportSettings } from "../../report-card/api";
import { ReportCardPreview } from "../../report-card/components/ReportCardPreview";
import { cn } from "../../../lib/utils";
const gradeTone = (grade: string) => {
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "text-green-600";
  if (g.startsWith("B") || g.startsWith("C")) return "text-blue-600";
  return "text-amber-600";
};
export const StudentReportView = () => {
  const { studentId = "" } = useParams();
  const navigate = useNavigate();
  const { formClassId, formClass, schoolName } = useTeacherProfile();
  const { activeTerm } = useActiveTerm();
  const { settings } = useReportSettings();
  const { data: students } = useStudents(formClassId ?? "", "ACTIVE");
  const student = students.find((s) => s.id === studentId);
  const { report, isThirdTermAverage, termTotals, isLoading, error } = useSessionAverageReport(studentId);
  const term = activeTerm?.term ?? "";
  const termLabelText = isThirdTermAverage
    ? "Session Average"
    : term
      ? termLabel(term).label
      : "Term";
  return (
    <div className="p-4 md:p-6 w-full">
      <button
        onClick={() => navigate("/teach/ca-and-exams/my-class")}
        aria-label="Back to My Class"
        className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
      >
        <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray900">{student?.name ?? "Student Report"}</h1>
          <p className="text-xs md:text-sm text-gray500 mt-0.5">
            {[student?.admissionNo, formClass, termLabelText].filter(Boolean).join(" · ") || "Loading..."}
          </p>
        </div>
        {isThirdTermAverage && (
          <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            Third Term Average
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
        </div>
      ) : error ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-12 text-center">
          <DocumentText size={32} className="mx-auto text-gray300 mb-3" variant="Bold" />
          <p className="text-sm font-medium text-gray900">Couldn't load this report</p>
          <p className="text-xs text-gray500 mt-1">{error.response?.data?.message ?? error.message}</p>
        </div>
      ) : !report ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-12 text-center">
          <Profile2User size={32} className="mx-auto text-gray300 mb-3" variant="Bold" />
          <p className="text-sm font-medium text-gray900">No report yet</p>
          <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
            {isThirdTermAverage
              ? "Scores across the three terms will appear here once CA and exam marks are recorded."
              : `Scores for this student in ${termLabelText} will appear here once CA and exam marks are recorded.`}
          </p>
        </div>
      ) : report.subjects.length === 0 ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-12 text-center">
          <DocumentText size={32} className="mx-auto text-gray300 mb-3" variant="Bold" />
          <p className="text-sm font-medium text-gray900">No scores recorded</p>
          <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
            {isThirdTermAverage
              ? "No CA or exam scores have been recorded for this student in any term."
              : `No CA or exam scores have been recorded for this student in ${termLabelText}.`}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Position",
                value: isThirdTermAverage
                  ? "—"
                  : report.position
                    ? `${report.position} of ${report.classSize}`
                    : "—",
              },
              {
                label: isThirdTermAverage ? "Session Average" : "Average",
                value: `${report.average.toFixed(1)}%`,
              },
              { label: "Attendance", value: `${report.attendancePercentage}%` },
              { label: "Best Subject", value: report.bestSubject?.name ?? "—" },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl border border-gray100 p-4">
                <p className="text-xs text-gray500">{item.label}</p>
                <p className="text-sm font-bold text-gray900 mt-1 truncate">{item.value}</p>
              </div>
            ))}
          </div>
          {/* Subjects table */}
          <div className="bg-white rounded-xl border border-gray100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray100">
              <h2 className="text-sm font-semibold text-gray900">Subject Results</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray500">
                    <th className="px-4 py-2.5 font-medium">Subject</th>
                    {isThirdTermAverage ? (
                      <>
                        <th className="px-4 py-2.5 font-medium text-right">1st</th>
                        <th className="px-4 py-2.5 font-medium text-right">2nd</th>
                        <th className="px-4 py-2.5 font-medium text-right">3rd</th>
                        <th className="px-4 py-2.5 font-medium text-right">Session</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-2.5 font-medium text-right">CA</th>
                        <th className="px-4 py-2.5 font-medium text-right">Exam</th>
                        <th className="px-4 py-2.5 font-medium text-right">Total</th>
                      </>
                    )}
                    <th className="px-4 py-2.5 font-medium text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray100">
                  {isThirdTermAverage
                    ? report.subjects.map((s) => {
                        const totals = termTotals[s.subjectId] ?? {};
                        return (
                          <tr key={s.subjectId}>
                            <td className="px-4 py-2.5 font-medium text-gray900">
                              {s.subjectName}
                              {s.teacherName && (
                                <span className="ml-2 text-xs text-gray400 font-normal">{s.teacherName}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray600">
                              {totals.first ?? "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray600">
                              {totals.second ?? "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray600">
                              {totals.third ?? "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray900">
                              {s.total}
                            </td>
                            <td className={cn("px-4 py-2.5 text-right font-bold tabular-nums", gradeTone(s.grade))}>
                              {s.grade}
                            </td>
                          </tr>
                        );
                      })
                    : report.subjects.map((s) => (
                        <tr key={s.subjectId}>
                          <td className="px-4 py-2.5 font-medium text-gray900">
                            {s.subjectName}
                            {s.teacherName && (
                              <span className="ml-2 text-xs text-gray400 font-normal">{s.teacherName}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray600">{s.caTotal}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray600">{s.examScore}</td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray900">{s.total}</td>
                          <td className={cn("px-4 py-2.5 text-right font-bold tabular-nums", gradeTone(s.grade))}>
                            {s.grade}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Report card preview */}
          <div className="bg-white rounded-xl border border-gray100 p-4 md:p-6">
            <h2 className="text-sm font-semibold text-gray900">Report Card Preview</h2>
            <p className="text-xs text-gray500 mt-0.5">
              Final look of {schoolName}'s report card for this student.
            </p>
            <div className="mt-4">
              <ReportCardPreview
                template={settings.template}
                theme={settings.theme}
                report={report}
                studentName={student?.name}
                admissionNo={student?.admissionNo}
                className={formClass ?? undefined}
                schoolName={schoolName}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
