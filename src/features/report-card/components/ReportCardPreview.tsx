import type { ReportTemplate, ReportTheme } from "../types";
import type { StudentAcademicsResponse } from "../../examinations/types";
import { cn } from "../../../lib/utils";

const THEMES: Record<ReportTheme, { hex: string; soft: string }> = {
  slate: { hex: "#0D0D0D", soft: "#F4F4F5" },
  emerald: { hex: "#059669", soft: "#ECFDF5" },
  indigo: { hex: "#4F46E5", soft: "#EEF2FF" },
  amber: { hex: "#D97706", soft: "#FFFBEB" },
};

const gradeTone = (grade: string) => {
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "text-green-600";
  if (g.startsWith("B") || g.startsWith("C")) return "text-blue-600";
  return "text-amber-600";
};

interface ReportCardPreviewProps {
  template: ReportTemplate;
  theme: ReportTheme;
  report: StudentAcademicsResponse;
  studentName?: string;
  admissionNo?: string;
  className?: string;
  schoolName?: string;
}

export const ReportCardPreview = ({
  template,
  theme,
  report,
  studentName,
  admissionNo,
  className,
  schoolName,
}: ReportCardPreviewProps) => {
  const accent = THEMES[theme] ?? THEMES.slate;
  const termLabel = report.term.charAt(0).toUpperCase() + report.term.slice(1);
  const sessionLabel = report.session ? ` · ${report.session}` : "";

  const rows = report.subjects.map((s) => ({
    name: s.subjectName,
    ca: s.caTotal,
    exam: s.examScore,
    total: s.total,
    grade: s.grade,
    teacher: s.teacherName,
  }));

  const summary = [
    { label: "Position", value: report.position ? `${report.position} of ${report.classSize}` : "—" },
    { label: "Average", value: `${report.average.toFixed(1)}%` },
    { label: "Attendance", value: `${report.attendancePercentage}%` },
  ];

  return (
    <div
      className={cn(
        "w-full max-w-[520px] mx-auto bg-white text-gray-900 overflow-hidden",
        template === "compact" ? "rounded-lg border border-gray-200" : "rounded-xl border border-gray-200 shadow-sm",
      )}
    >
      {/* Header */}
      {template === "modern" ? (
        <div className="px-6 py-5 text-white" style={{ backgroundColor: accent.hex }}>
          <p className="text-xs uppercase tracking-widest opacity-80">Academic Report</p>
          <p className="text-xl font-bold mt-0.5">{schoolName || "School Name"}</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span><span className="opacity-70">Student:</span> <strong>{studentName || "—"}</strong></span>
            {className && <span><span className="opacity-70">Class:</span> <strong>{className}</strong></span>}
            <span><span className="opacity-70">Term:</span> <strong>{termLabel}{sessionLabel}</strong></span>
          </div>
        </div>
      ) : (
        <div className="px-6 pt-5 pb-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">{schoolName || "School Name"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Academic Report · {termLabel} Term</p>
            </div>
            {admissionNo && <p className="text-xs text-gray-400">Adm. No: {admissionNo}</p>}
          </div>
          <div className={cn("mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm", template === "compact" && "text-xs")}>
            <span><span className="text-gray-500">Student:</span> <strong>{studentName || "—"}</strong></span>
            {className && <span><span className="text-gray-500">Class:</span> <strong>{className}</strong></span>}
            <span><span className="text-gray-500">Session:</span> <strong>{report.session || "—"}</strong></span>
          </div>
        </div>
      )}

      {/* Subjects table */}
      <table className="w-full text-sm">
        <thead>
          <tr
            className={cn("text-left text-xs uppercase tracking-wide", template === "modern" ? "text-white" : "text-gray-500")}
            style={template === "modern" ? { backgroundColor: accent.hex } : undefined}
          >
            <th className="px-6 py-2 font-semibold">Subject</th>
            <th className="px-2 py-2 font-semibold text-right">CA</th>
            <th className="px-2 py-2 font-semibold text-right">Exam</th>
            <th className="px-2 py-2 font-semibold text-right">Total</th>
            <th className="px-6 py-2 font-semibold text-right">Grade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.name} className={cn(template === "compact" ? "text-xs" : "text-sm")}>
              <td className="px-6 py-2 font-medium">
                {r.name}
                {r.teacher && <span className="ml-2 text-xs text-gray-400 font-normal">{r.teacher}</span>}
              </td>
              <td className="px-2 py-2 text-right tabular-nums text-gray-600">{r.ca}</td>
              <td className="px-2 py-2 text-right tabular-nums text-gray-600">{r.exam}</td>
              <td className="px-2 py-2 text-right font-semibold tabular-nums">{r.total}</td>
              <td className={cn("px-6 py-2 text-right font-bold tabular-nums", gradeTone(r.grade))}>{r.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div
        className={cn("px-6 py-4 flex items-center justify-between gap-4", template === "modern" ? "text-white" : "border-t border-gray-200")}
        style={template === "modern" ? { backgroundColor: accent.hex } : undefined}
      >
        {summary.map((s) => (
          <div key={s.label}>
            <p className={cn("text-[11px] uppercase tracking-wide", template === "modern" ? "opacity-75" : "text-gray-400")}>{s.label}</p>
            <p className="text-sm font-bold tabular-nums mt-0.5">{s.value}</p>
          </div>
        ))}
        {report.bestSubject && (
          <div className="text-right">
            <p className={cn("text-[11px] uppercase tracking-wide", template === "modern" ? "opacity-75" : "text-gray-400")}>Best</p>
            <p className="text-sm font-bold tabular-nums mt-0.5">{report.bestSubject.name}</p>
          </div>
        )}
      </div>
    </div>
  );
};
