import { useMemo, useState } from "react";
import { DocumentText, Calendar, ClipboardTick, MedalStar, Ranking, ArrowDown2 } from "iconsax-react";
import { cn } from "@/lib/utils";
import { SomaLoader, parentLoadingDescriptions } from "../components/ui/SomaLoader";
import { useCalendarEvents, useActiveTerm } from "../features/calendar/api";
import { termLabel, termNumber } from "../features/calendar/utils/term";
import { useParentExamResults } from "../features/parent/api";
import { localDateKey } from "../utils/date";
import type { ParentResultChild, ParentResultSubject } from "../features/parent/api/useParentExamResults";

type ResultsView = "ca" | "full";

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

const scorePct = (score: number, max: number) => (max > 0 ? Math.round((score / max) * 100) : 0);

const pctColor = (pct: number) => {
  if (pct >= 70) return "text-springgreen600";
  if (pct >= 50) return "text-amber500";
  return "text-red500";
};

const ScoreBadge = ({ pct }: { pct: number }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
      pctColor(pct),
      pct >= 70 ? "bg-springgreen600/10" : pct >= 50 ? "bg-amber500/10" : "bg-red500/10",
    )}
  >
    {pct}%
  </span>
);

const subjectPct = (s: ParentResultSubject): number | null => {
  const hasExam = s.examScore !== null && s.examMaxScore !== null;
  const caMax = s.components.reduce((sum, c) => sum + c.maxScore, 0);
  if (hasExam && s.examMaxScore) return scorePct(s.total, s.examMaxScore);
  if (s.components.length > 0 && caMax > 0) return scorePct(s.caTotal, caMax);
  return null;
};

const MobileSubjectRow = ({ s, view }: { s: ParentResultSubject; view: ResultsView }) => {
  const hasExam = s.examScore !== null && s.examMaxScore !== null;
  const caMax = s.components.reduce((sum, c) => sum + c.maxScore, 0);
  const pct = subjectPct(s);
  const showFull = view === "full";

  return (
    <div className="border-t border-gray100 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray900">{s.subjectName}</p>
        {pct !== null ? <ScoreBadge pct={pct} /> : <span className="text-gray400">—</span>}
      </div>

      {s.components.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {s.components.map((c) => (
            <div
              key={c.componentId ?? c.name}
              className="rounded-xl border border-gray100 bg-offWhite px-3 py-2.5"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray500">
                {c.name}
              </p>
              <p className="mt-0.5 text-xl font-bold text-gray900 leading-none tabular-nums">
                {c.score}
                <span className="text-xs font-normal text-gray400">/{c.maxScore}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {(s.components.length > 0 || hasExam) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray500">
          {s.components.length > 0 && (
            <span>
              CA Total:{" "}
              <span className="font-semibold text-gray900">
                {s.caTotal}
                <span className="font-normal text-gray400">/{caMax}</span>
              </span>
            </span>
          )}
          {showFull && hasExam && (
            <span>
              Exam:{" "}
              <span className="font-semibold text-gray900">
                {s.examScore}
                <span className="font-normal text-gray400">/{s.examMaxScore}</span>
              </span>
            </span>
          )}
          {showFull && (s.components.length > 0 || hasExam) && (
            <span>
              Overall: <span className="font-semibold text-gray900">{s.total}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const ChildResultsTable = ({ child, view }: { child: ParentResultChild; view: ResultsView }) => {
  const [open, setOpen] = useState(true);
  const totalSubjects = child.subjects.length;
  const subjectsWithExam = child.subjects.filter((s) => s.examScore !== null).length;
  const caOnlySubjects = totalSubjects - subjectsWithExam;
  const showFull = view === "full";
  const showExam = showFull;
  const showOverall = showFull;

  const componentColumns = useMemo(() => {
    const order: string[] = [];
    const maxBy: Record<string, number> = {};
    for (const s of child.subjects) {
      for (const c of s.components) {
        if (!(c.name in maxBy)) {
          order.push(c.name);
          maxBy[c.name] = c.maxScore;
        }
      }
    }
    return { order, maxBy };
  }, [child.subjects]);

  return (
    <div className="bg-white rounded-3xl border border-gray100 overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
        >
          <div className="w-11 h-11 rounded-xl bg-[#E9F7EE] flex items-center justify-center shrink-0">
            <Ranking size={20} color="#34A853" variant="Bold" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray900 truncate">{child.studentName}</p>
            <p className="text-xs text-gray500 truncate">
              {child.className ?? "Class"} · {totalSubjects} subject{totalSubjects === 1 ? "" : "s"}
              {caOnlySubjects > 0 && (
                <span className="text-gray400">
                  {" "}· {caOnlySubjects} CA-only
                </span>
              )}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse results" : "Expand results"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray100 text-gray500 transition-colors hover:bg-gray50 hover:text-gray900"
        >
          <ArrowDown2
            size={16}
            color="#8C8C8C"
            variant="Bold"
            className={cn("transition-transform duration-200", !open && "-rotate-90")}
          />
        </button>
      </div>

      {open &&
        (totalSubjects === 0 ? (
          <div className="border-t border-gray100 px-5 py-8 text-center text-sm text-gray400">
            No results shared for this term yet.
          </div>
        ) : (
        <>
          <div className="md:hidden">
            {child.subjects.map((s) => (
              <MobileSubjectRow key={s.subjectId} s={s} view={view} />
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-t border-gray100 bg-offWhite text-left text-[11px] font-medium uppercase tracking-wide text-gray400">
                  <th className="px-5 py-4 whitespace-nowrap">Subject</th>
                  {componentColumns.order.map((name) => (
                    <th key={name} className="px-4 py-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-baseline gap-1.5">
                        <span>{name}</span>
                        <span className="text-[10px] font-normal normal-case text-gray400">
                          ({componentColumns.maxBy[name]})
                        </span>
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-4 text-right whitespace-nowrap">CA Total</th>
                  {showExam && <th className="px-4 py-4 text-right whitespace-nowrap">Exam</th>}
                  {showOverall && <th className="px-4 py-4 text-right whitespace-nowrap">Overall</th>}
                  <th className="px-5 py-4 text-right whitespace-nowrap">Score</th>
                </tr>
              </thead>
              <tbody>
                {child.subjects.map((s) => {
                  const hasExam = s.examScore !== null && s.examMaxScore !== null;
                  const caMax = s.components.reduce((sum, c) => sum + c.maxScore, 0);
                  const pct = subjectPct(s);
                  const empty = s.components.length === 0 && !hasExam;
                  return (
                    <tr key={s.subjectId} className="border-t border-gray100 hover:bg-gray50">
                      <td className="px-5 py-5 font-semibold text-gray900 whitespace-nowrap">
                        {s.subjectName}
                      </td>
                      {componentColumns.order.map((name) => {
                        const comp = s.components.find((c) => c.name === name);
                        return (
                          <td key={name} className="px-3 py-5 text-right tabular-nums whitespace-nowrap">
                            {comp ? (
                              <span className="font-semibold text-gray900">
                                {comp.score}
                                <span className="font-normal text-gray400">/{comp.maxScore}</span>
                              </span>
                            ) : (
                              <span className="text-gray400">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-5 text-right tabular-nums whitespace-nowrap">
                        {s.components.length > 0 ? (
                          <span className="font-semibold text-gray900">
                            {s.caTotal}
                            <span className="font-normal text-gray400">/{caMax}</span>
                          </span>
                        ) : (
                          <span className="text-gray400">—</span>
                        )}
                      </td>
                      {showExam && (
                        <td className="px-3 py-5 text-right tabular-nums whitespace-nowrap">
                          {hasExam ? (
                            <span className="font-semibold text-gray900">
                              {s.examScore}
                              <span className="font-normal text-gray400">/{s.examMaxScore}</span>
                            </span>
                          ) : (
                            <span className="text-gray400">—</span>
                          )}
                        </td>
                      )}
                      {showOverall && (
                        <td className="px-3 py-5 text-right tabular-nums font-semibold text-gray900 whitespace-nowrap">
                          {empty ? <span className="font-normal text-gray400">—</span> : s.total}
                        </td>
                      )}
                      <td className="px-5 py-5 text-right whitespace-nowrap">
                        {pct !== null ? <ScoreBadge pct={pct} /> : <span className="text-gray400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
        ))}
    </div>
  );
};

export const ParentExams = () => {
  const today = localDateKey();
  const from = today;
  const to = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const { data, isLoading } = useCalendarEvents({
    from,
    to: localDateKey(to),
  });

  const { terms, activeTerm } = useActiveTerm();
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [view, setView] = useState<ResultsView>("ca");
  const effectiveTerm = selectedTerm ?? activeTerm?.term ?? "";

  const sortedTerms = useMemo(
    () => [...terms].sort((a, b) => termNumber(a.term) - termNumber(b.term)),
    [terms],
  );

  const { data: results, isLoading: resultsLoading, isFetching: resultsFetching } = useParentExamResults({
    term: effectiveTerm,
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

  const hasResults = (results?.children ?? []).some((c) => c.subjects.length > 0);
  const hasExamData = (results?.children ?? []).some((child) =>
    child.subjects.some((s) => s.examScore !== null),
  );
  const effectiveView: ResultsView = view === "full" && !hasExamData ? "ca" : view;
  const viewHasData = (results?.children ?? []).some((child) =>
    child.subjects.some((s) =>
      effectiveView === "ca" ? s.components.length > 0 : s.components.length > 0 || s.examScore !== null,
    ),
  );
  const showResultsLoader = resultsLoading || (resultsFetching && !hasResults);

  const viewTabs: { id: ResultsView; label: string; Icon: typeof MedalStar }[] = [
    { id: "ca", label: "Continuous Assessment", Icon: MedalStar },
    ...(hasExamData ? [{ id: "full" as const, label: "Full Result", Icon: Ranking }] : []),
  ];

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray900">Examinations & Tests</h1>
        <p className="text-sm text-gray500 mt-1">Published results and upcoming exams</p>
      </div>

      <section className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <MedalStar size={18} color="#8C37C3" variant="Bold" />
          <h2 className="text-lg font-bold text-gray900">Results</h2>
          {results?.term ? (
            <span className="text-xs text-gray500">Term {termNumber(results.term)}</span>
          ) : null}
          {sortedTerms.length > 0 && (
            <div className="flex items-center gap-1 rounded-full border border-gray200 bg-white p-1 ml-auto">
              {sortedTerms.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTerm(t.term)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                    effectiveTerm === t.term
                      ? "bg-gray900 text-white"
                      : "text-gray500 hover:text-gray900",
                  )}
                >
                  {termLabel(t.term).label}
                </button>
              ))}
            </div>
          )}
        </div>

        {showResultsLoader ? (
          <div className="py-8">
            <SomaLoader descriptions={parentLoadingDescriptions} />
          </div>
        ) : !hasResults ? (
          <div className="bg-white rounded-2xl p-8 border border-gray100 text-center max-w-4xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-gray50 flex items-center justify-center mx-auto mb-3">
              <ClipboardTick size={22} color="#B3B3B3" />
            </div>
            <p className="text-gray500 text-sm">
              No results have been shared yet. Tests and exam results appear here once your child's teacher broadcasts
              them.
            </p>
          </div>
        ) : hasResults && !viewHasData ? (
          <div className="bg-white rounded-2xl p-8 border border-gray100 text-center max-w-4xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-gray50 flex items-center justify-center mx-auto mb-3">
              <ClipboardTick size={22} color="#B3B3B3" />
            </div>
            <p className="text-gray500 text-sm">
              No{" "}
              {effectiveView === "ca" ? "continuous assessment" : "full"}{" "}
              results have been shared for this term yet.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-1 rounded-full border border-gray200 bg-white p-1 overflow-x-auto no-scrollbar max-w-full">
                {viewTabs.map(({ id, label, Icon }) => {
                const active = effectiveView === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setView(id)}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                      active ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
                    )}
                  >
                    <Icon size={15} color={active ? "#FFFFFF" : "#8C8C8C"} />
                    {label}
                  </button>
                );
              })}
              </div>
            </div>
            <div className="grid gap-4 max-w-4xl mx-auto">
              {(results?.children ?? []).map((child) => (
                <ChildResultsTable key={child.studentId} child={child} view={effectiveView} />
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray900 mb-4 text-center">Upcoming</h2>

        {isLoading ? (
          <div className="py-12">
            <SomaLoader descriptions={parentLoadingDescriptions} />
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray100 text-center max-w-4xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#F3EDFF] flex items-center justify-center mx-auto mb-3">
              <DocumentText size={22} color="#8C37C3" />
            </div>
            <p className="text-gray500">No exams or tests scheduled right now.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
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
      </section>
    </div>
  );
};
