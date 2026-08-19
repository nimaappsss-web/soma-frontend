import { useMemo } from "react";
import { DocumentText, Calendar, ClipboardTick, MedalStar, Ranking } from "iconsax-react";
import { cn } from "@/lib/utils";
import { SomaLoader, parentLoadingDescriptions } from "../components/ui/SomaLoader";
import { useCalendarEvents } from "../features/calendar/api";
import { useParentExamResults } from "../features/parent/api";
import { localDateKey } from "../utils/date";
import type { ParentResultChild, ParentResultSubject } from "../features/parent/api/useParentExamResults";

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

const SubjectResultRow = ({ subject }: { subject: ParentResultSubject }) => {
  const hasExam = subject.examScore !== null && subject.examMaxScore !== null;
  const totalPct = hasExam && subject.examMaxScore ? scorePct(subject.total, subject.examMaxScore) : null;

  return (
    <div className="rounded-xl border border-gray100 bg-offWhite px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray900">{subject.subjectName}</p>
        {totalPct !== null && (
          <span className={cn("text-sm font-bold", pctColor(totalPct))}>{totalPct}%</span>
        )}
      </div>

      {subject.components.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {subject.components.map((c) => (
            <span
              key={c.componentId ?? c.name}
              className="inline-flex items-center gap-1 rounded-full border border-gray100 bg-white px-2.5 py-1 text-xs text-gray600"
            >
              {c.name}
              <span className="font-semibold text-gray900">
                {c.score}
                <span className="font-normal text-gray400">/{c.maxScore}</span>
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray500">
        {subject.components.length > 0 && (
          <span>
            CA total: <span className="font-semibold text-gray900">{subject.caTotal}</span>
          </span>
        )}
        {hasExam && (
          <span>
            Exam:{" "}
            <span className="font-semibold text-gray900">
              {subject.examScore}
              <span className="text-gray400">/{subject.examMaxScore}</span>
            </span>
          </span>
        )}
        {subject.components.length > 0 && (hasExam ? subject.examScore !== null : true) && (
          <span>
            Overall: <span className="font-semibold text-gray900">{subject.total}</span>
          </span>
        )}
      </div>
    </div>
  );
};

const ChildResultsCard = ({ child }: { child: ParentResultChild }) => (
  <div className="bg-white rounded-3xl border border-gray100 p-5">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-11 h-11 rounded-xl bg-[#E9F7EE] flex items-center justify-center shrink-0">
        <Ranking size={20} color="#34A853" variant="Bold" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray900 truncate">{child.studentName}</p>
        <p className="text-xs text-gray500 truncate">
          {child.className ?? "Class"} · {child.subjects.length} subject{child.subjects.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
    <div className="grid gap-2.5">
      {child.subjects.map((s) => (
        <SubjectResultRow key={s.subjectId} subject={s} />
      ))}
    </div>
  </div>
);

export const ParentExams = () => {
  const today = localDateKey();
  const from = today;
  const to = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const { data, isLoading } = useCalendarEvents({
    from,
    to: localDateKey(to),
  });
  const { data: results, isLoading: resultsLoading } = useParentExamResults();

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

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray900">Examinations & Tests</h1>
        <p className="text-sm text-gray500 mt-1">Published results and upcoming exams</p>
      </div>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MedalStar size={18} color="#8C37C3" variant="Bold" />
          <h2 className="text-lg font-bold text-gray900">Results</h2>
          {results?.term ? (
            <span className="text-xs text-gray500">Term {results.term}</span>
          ) : null}
        </div>

        {resultsLoading ? (
          <div className="py-8">
            <SomaLoader descriptions={parentLoadingDescriptions} />
          </div>
        ) : !hasResults ? (
          <div className="bg-white rounded-2xl p-8 border border-gray100 text-center">
            <div className="w-12 h-12 rounded-full bg-gray50 flex items-center justify-center mx-auto mb-3">
              <ClipboardTick size={22} color="#B3B3B3" />
            </div>
            <p className="text-gray500 text-sm">
              No results have been shared yet. Tests and exam results appear here once your child's teacher broadcasts
              them.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 max-w-2xl">
            {(results?.children ?? []).map((child) => (
              <ChildResultsCard key={child.studentId} child={child} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray900 mb-4">Upcoming</h2>

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
      </section>
    </div>
  );
};
