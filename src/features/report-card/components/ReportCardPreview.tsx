import type { ReportTemplate, ReportTheme } from "../types";
import type { StudentAcademicsResponse } from "../../examinations/types";
import { cn } from "../../../lib/utils";

const THEMES: Record<ReportTheme, { hex: string; soft: string }> = {
  slate: { hex: "#0D0D0D", soft: "#F4F4F5" },
  emerald: { hex: "#059669", soft: "#ECFDF5" },
  indigo: { hex: "#4F46E5", soft: "#EEF2FF" },
  amber: { hex: "#B45309", soft: "#FFFBEB" },
};

const gradeLabel = (grade: string) => {
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "Distinction";
  if (g.startsWith("B") || g.startsWith("C")) return "Credit";
  if (g.startsWith("D") || g.startsWith("E")) return "Pass";
  if (g === "F") return "Fail";
  return "—";
};

const ordinal = (n: number) => {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
};

const gradeBadgeClass = (grade: string) => {
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "bg-emerald50 text-emerald700 border-emerald200";
  if (g.startsWith("B") || g.startsWith("C")) return "bg-sky50 text-sky700 border-sky200";
  if (g.startsWith("D") || g.startsWith("E")) return "bg-amber50 text-amber700 border-amber200";
  if (g === "F") return "bg-rose50 text-rose700 border-rose200";
  return "bg-gray50 text-gray500 border-gray200";
};

const GRADE_TABLE = [
  { range: "70% & Above", grade: "A", label: "Distinction", color: "bg-emerald500" },
  { range: "50% – 69%", grade: "B / C", label: "Credit", color: "bg-sky500" },
  { range: "40% – 49%", grade: "D", label: "Pass", color: "bg-amber500" },
  { range: "Below 40%", grade: "F", label: "Fail", color: "bg-rose500" },
];

const RATINGS_TABLE = [
  { score: "5", label: "Excellent", color: "text-emerald600" },
  { score: "4", label: "Very Good", color: "text-sky600" },
  { score: "3", label: "Good", color: "text-amber600" },
  { score: "2", label: "Fair", color: "text-orange600" },
  { score: "1", label: "Very Poor", color: "text-rose600" },
];

const DOMAINS = [
  "Punctuality",
  "Attendance",
  "Self-Control",
  "Neatness",
  "Responsibility",
  "Diligence",
  "Attentiveness",
  "Legibility",
  "Accuracy",
  "Sports & Games",
];

export interface ReportColumnComponent {
  id: string;
  name: string;
  type: string;
  maxScore: number;
  sortOrder: number;
}

interface ReportCardPreviewProps {
  template: ReportTemplate;
  theme: ReportTheme;
  report: StudentAcademicsResponse;
  studentName?: string;
  admissionNo?: string;
  className?: string;
  schoolName?: string;
  logoUrl?: string;
  components?: ReportColumnComponent[];
}

export const ReportCardPreview = ({
  template,
  theme,
  report,
  studentName,
  admissionNo,
  className,
  schoolName,
  logoUrl,
  components,
}: ReportCardPreviewProps) => {
  const accent = THEMES[theme] ?? THEMES.slate;
  const termTitle =
    report.term === "session"
      ? "Session Average"
      : `${report.term.charAt(0).toUpperCase() + report.term.slice(1)} Term`;
  const termShort =
    report.term === "session"
      ? "Session"
      : report.term.charAt(0).toUpperCase() + report.term.slice(1);

  const subjects = report.subjects.map((s) => {
    const scores = (s as { scores?: Array<{ type: string; score: number; maxScore: number }> }).scores ?? [];
    return {
      name: s.subjectName,
      scores,
      caTotal: s.caTotal,
      examScore: s.examScore,
      total: s.total,
      grade: s.grade,
      teacher: s.teacherName,
    };
  });

  const hasIndividualScores = subjects.some((s) => s.scores.length > 0);

  const useConfigColumns = !!components && components.length > 0;

  const caColumns = (() => {
    if (useConfigColumns) {
      const sorted = [...components!].sort((a, b) => a.sortOrder - b.sortOrder);
      const typeSeen = new Map<string, number>();
      return sorted.map((c) => {
        const index = typeSeen.get(c.type) ?? 0;
        typeSeen.set(c.type, index + 1);
        return { key: c.id, label: c.name, type: c.type, index };
      });
    }
    if (!hasIndividualScores) return [];
    const typeCount = new Map<string, number>();
    const ordered: string[] = [];
    for (const s of subjects) {
      const perSubject = new Map<string, number>();
      for (const sc of s.scores) {
        perSubject.set(sc.type, (perSubject.get(sc.type) ?? 0) + 1);
      }
      for (const [type, count] of perSubject) {
        if (!typeCount.has(type)) {
          typeCount.set(type, 0);
          ordered.push(type);
        }
        typeCount.set(type, Math.max(typeCount.get(type)!, count));
      }
    }
    const columns: Array<{ key: string; label: string; type: string; index: number }> = [];
    for (const type of ordered) {
      const count = typeCount.get(type)!;
      if (count > 1) {
        for (let i = 0; i < count; i++) {
          const label = type === "TEST" ? `${ordinal(i + 1)} Test` : type === "ASSIGNMENT" ? "Assignment" : type === "PROJECT" ? "Project" : `${type} ${i + 1}`;
          columns.push({ key: `${type}_${i}`, label, type, index: i });
        }
      } else {
        const label = type === "TEST" ? "Test" : type === "ASSIGNMENT" ? "Assignment" : type === "PROJECT" ? "Project" : type;
        columns.push({ key: type, label, type, index: 0 });
      }
    }
    return columns;
  })();

  const getScoreForColumn = (subjectScores: Array<{ type: string; score: number; maxScore: number; componentId?: string }>, col: { key: string; type: string; index: number }) => {
    const byId = subjectScores.find((sc) => sc.componentId && sc.componentId === col.key);
    if (byId) return byId.score;
    let idx = 0;
    for (const sc of subjectScores) {
      if (sc.type === col.type) {
        if (idx === col.index) return sc.score;
        idx++;
      }
    }
    return null;
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const isCompact = template === "compact";

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "w-full bg-white text-gray900 overflow-hidden rounded-2xl border border-gray200 shadow-[0_2px_8px_rgba(13,13,13,0.06)]",
        isCompact ? "text-xs" : "text-sm",
      )}
    >
      {/* Header with accent gradient */}
      <div
        className="relative px-6 md:px-10 py-8 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent.hex} 0%, ${accent.hex}dd 50%, ${accent.hex}aa 100%)`,
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm shadow-lg">
            {logoUrl ? (
              <img src={logoUrl} alt={`${schoolName || "School"} logo`} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold tracking-tight">{initials(schoolName || "S")}</span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] opacity-70 font-medium">
            {schoolName || "School Name"}
          </p>
          <h2 className={cn("mt-2 font-bold tracking-tight", isCompact ? "text-lg" : "text-xl md:text-2xl")}>
            {termTitle} Report Sheet
          </h2>
          {report.session && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              {report.session}
            </div>
          )}
        </div>
      </div>

      {/* Student info */}
      <div className="px-6 md:px-10 py-5 border-b border-gray200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Name", value: studentName || "—" },
            { label: "Admission No.", value: admissionNo || "—" },
            { label: "Class", value: className || "—" },
            { label: "Term", value: termShort },
            { label: "Session", value: report.session || "—" },
            { label: "Position", value: report.position ? `${report.position}${report.position === 1 ? "st" : report.position === 2 ? "nd" : report.position === 3 ? "rd" : "th"} of ${report.classSize}` : "—" },
            { label: "Average", value: `${report.average.toFixed(1)}%` },
            { label: "Attendance", value: `${report.attendancePercentage}%` },
          ].map((item) => (
            <div key={item.label} className="min-w-0 rounded-lg bg-gray50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide font-medium text-gray500">
                {item.label}
              </p>
              <p className={cn("mt-0.5 font-bold truncate text-gray900", isCompact ? "text-xs" : "text-sm")}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Subjects table */}
      <div className="px-6 md:px-10 py-5">
        <div className="overflow-x-auto rounded-xl border border-gray200">
          <table className="w-full text-xs">
            <thead>
              <tr
                className="text-left uppercase tracking-wide text-[10px] font-semibold"
                style={{ backgroundColor: accent.soft, color: accent.hex }}
              >
                <th className="px-4 py-3 first:rounded-tl-xl">Subject</th>
                {useConfigColumns ? (
                  caColumns.map((col) => (
                    <th key={col.key} className="px-2 py-3 text-right whitespace-nowrap">
                      {col.label}
                    </th>
                  ))
                ) : (
                  <>
                    {hasIndividualScores &&
                      caColumns.map((col) => (
                        <th key={col.key} className="px-2 py-3 text-right whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    {!hasIndividualScores && <th className="px-2 py-3 text-right">CA</th>}
                    <th className="px-2 py-3 text-right">Exam</th>
                  </>
                )}
                <th className="px-2 py-3 text-right">Total</th>
                <th className="px-2 py-3 text-center">Grade</th>
                <th className="px-4 py-3 text-right last:rounded-tr-xl">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray100">
              {subjects.map((s, i) => (
                <tr
                  key={s.name}
                  className={cn(
                    "transition-colors",
                    i % 2 === 0 ? "bg-white" : "bg-gray50/50",
                    "hover:bg-gray100/50",
                  )}
                >
                  <td className="px-4 py-2.5 font-medium text-gray900">
                    {s.name}
                    {s.teacher && (
                      <span className="ml-1.5 text-[10px] text-gray500 font-normal">{s.teacher}</span>
                    )}
                  </td>
                  {useConfigColumns ? (
                    caColumns.map((col) => {
                      const score = getScoreForColumn(s.scores, col) ?? (col.type === "EXAM" ? s.examScore : null);
                      return (
                        <td key={col.key} className="px-2 py-2.5 text-right tabular-nums text-gray600">
                          {score !== null ? (
                            <span>{score}</span>
                          ) : (
                            <span className="text-gray300">—</span>
                          )}
                        </td>
                      );
                    })
                  ) : (
                    <>
                      {hasIndividualScores &&
                        caColumns.map((col) => {
                          const score = getScoreForColumn(s.scores, col);
                          return (
                            <td key={col.key} className="px-2 py-2.5 text-right tabular-nums text-gray600">
                              {score !== null ? (
                                <span>{score}</span>
                              ) : (
                                <span className="text-gray300">—</span>
                              )}
                            </td>
                          );
                        })}
                      {!hasIndividualScores && (
                        <td className="px-2 py-2.5 text-right tabular-nums text-gray600">{s.caTotal}</td>
                      )}
                      <td className="px-2 py-2.5 text-right tabular-nums text-gray600">{s.examScore}</td>
                    </>
                  )}
                  <td className="px-2 py-2.5 text-right font-bold tabular-nums text-gray900">{s.total}</td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={cn("inline-flex min-w-[28px] items-center justify-center rounded-lg border px-2 py-0.5 font-bold tabular-nums", gradeBadgeClass(s.grade))}>
                      {s.grade || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray600 font-medium">
                    {gradeLabel(s.grade)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Domains & Grading Key */}
      <div className="px-6 md:px-10 py-5 border-t border-gray200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Domains */}
          <div className="rounded-xl border border-gray200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray200" style={{ backgroundColor: accent.soft }}>
              <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: accent.hex }}>
                Domains
              </p>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray100">
                {DOMAINS.map((d) => (
                  <tr key={d} className="hover:bg-gray50/50">
                    <td className="px-4 py-2 text-gray700 font-medium">{d}</td>
                    <td className="px-4 py-2 text-right font-bold text-gray900 tabular-nums">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Keys to Grading & Rating — stacked in one card */}
          <div className="rounded-xl border border-gray200 overflow-hidden">
            {/* Keys to Grading */}
            <div className="px-4 py-2.5 border-b border-gray200" style={{ backgroundColor: accent.soft }}>
              <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: accent.hex }}>
                Keys to Grading
              </p>
            </div>
            <table className="w-full text-xs whitespace-nowrap">
              <thead>
                <tr className="text-[10px] uppercase text-gray500 border-b border-gray100">
                  <th className="px-4 py-2 text-left font-semibold">Range</th>
                  <th className="px-4 py-2 text-center font-semibold">Grade</th>
                  <th className="px-4 py-2 text-right font-semibold">Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray100">
                {GRADE_TABLE.map((g) => (
                  <tr key={g.range} className="hover:bg-gray50/50">
                    <td className="px-4 py-2 text-gray600 whitespace-nowrap">{g.range}</td>
                    <td className="px-4 py-2 text-center font-bold text-gray900 whitespace-nowrap">{g.grade}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-gray600">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", g.color)} />
                        {g.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Divider */}
            <div className="border-t border-gray200" />

            {/* Keys to Rating */}
            <div className="px-4 py-2.5 border-b border-gray200" style={{ backgroundColor: accent.soft }}>
              <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: accent.hex }}>
                Keys to Rating
              </p>
            </div>
            <table className="w-full text-xs whitespace-nowrap">
              <thead>
                <tr className="text-[10px] uppercase text-gray500 border-b border-gray100">
                  <th className="px-4 py-2 text-center font-semibold">Score</th>
                  <th className="px-4 py-2 text-left font-semibold">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray100">
                {RATINGS_TABLE.map((r) => (
                  <tr key={r.score} className="hover:bg-gray50/50">
                    <td className="px-4 py-2 text-center font-bold text-gray900 whitespace-nowrap">{r.score}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={cn("font-medium", r.color)}>{r.label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="px-6 md:px-10 py-4 border-t border-gray200">
        <div className="flex flex-wrap items-center gap-6">
          {report.bestSubject && (
            <div className="flex items-center gap-3 rounded-xl bg-emerald50 px-4 py-2.5 border border-emerald200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald100 text-emerald700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-emerald600 font-medium">Best Subject</p>
                <p className="font-bold text-gray900 tabular-nums">
                  {report.bestSubject.name} <span className="text-emerald600">({report.bestSubject.score})</span>
                </p>
              </div>
            </div>
          )}
          {report.worstSubject && (
            <div className="flex items-center gap-3 rounded-xl bg-amber50 px-4 py-2.5 border border-amber200">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber100 text-amber700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-amber-600 font-medium">Lowest Subject</p>
                <p className="font-bold text-gray900 tabular-nums">
                  {report.worstSubject.name} <span className="text-amber-600">({report.worstSubject.score})</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Teacher's Comments */}
      <div className="px-6 md:px-10 py-5 border-t border-gray200">
        <div className="rounded-xl border border-gray200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray200" style={{ backgroundColor: accent.soft }}>
            <p className="text-[10px] uppercase tracking-wide font-bold" style={{ color: accent.hex }}>
              Form Teacher's Comments
            </p>
          </div>
          <div className="px-4 py-4">
            <p className={cn("text-gray600 italic", isCompact ? "text-xs" : "text-sm")}>
              —
            </p>
          </div>
        </div>
      </div>

      {/* Signature strips */}
      <div className="px-6 md:px-10 py-5 border-t border-gray200 flex flex-wrap items-start justify-between gap-6">
        <div className="flex-1 min-w-[200px]">
          <div className="h-px w-full bg-gray300 mb-2" />
          <p className="text-[10px] text-gray500 uppercase tracking-wide font-medium">Class Teacher's Signature &amp; Date</p>
          <p className="text-[10px] text-gray400 mt-1">{today}</p>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="h-px w-full bg-gray300 mb-2" />
          <p className="text-[10px] text-gray500 uppercase tracking-wide font-medium">Principal's Signature &amp; Stamp</p>
        </div>
      </div>
    </div>
  );
};