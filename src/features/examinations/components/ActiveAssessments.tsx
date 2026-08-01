import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight2, StatusUp } from "iconsax-react";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { useMyAssignments } from "../../teacher/api/useMyAssignments";
import { useActiveTerm } from "../../calendar/api";
import { useExamComponents } from "../api/useExamComponents";
import { cn } from "../../../lib/utils";

interface ActiveAssessmentGroup {
  examKey: string;
  subjectId: string;
  classId: string;
  componentId: string;
  term: string;
  count: number;
  latest: number;
  rosterCount: number;
}

export const ActiveAssessments = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const navigate = useNavigate();

  const { activeTerm, isLoading: termLoading } = useActiveTerm();
  const term = activeTerm?.term ?? "";

  const { data: assignments = [], isLoading: assignmentsLoading } = useMyAssignments(userId);
  const { data: schemeData, isLoading: schemeLoading } = useExamComponents(term);
  const components = schemeData?.components ?? [];

  const rows = useLiveQuery(
    async () => {
      if (!userId) return [] as ActiveAssessmentGroup[];
      const all = await db.examScores.where("userId").equals(userId).toArray();

      const groups = new Map<
        string,
        { count: number; latest: number; subjectId: string; classId: string; componentId: string; term: string }
      >();
      for (const r of all) {
        const existing = groups.get(r.examKey);
        if (existing) {
          existing.count += 1;
          if (r.updatedAt > existing.latest) existing.latest = r.updatedAt;
        } else {
          const [subjectId, classId, componentId, keyTerm] = r.examKey.split(":");
          groups.set(r.examKey, {
            count: 1,
            latest: r.updatedAt,
            subjectId,
            classId,
            componentId,
            term: keyTerm,
          });
        }
      }

      const items: ActiveAssessmentGroup[] = [];
      for (const [examKey, g] of groups) {
        const rosterCount = await db.students
          .where("classId")
          .equals(g.classId)
          .filter((s) => s.status === "ACTIVE")
          .count();
        items.push({
          examKey,
          subjectId: g.subjectId,
          classId: g.classId,
          componentId: g.componentId,
          term: g.term,
          count: g.count,
          latest: g.latest,
          rosterCount,
        });
      }

      items.sort((a, b) => b.latest - a.latest);
      return items;
    },
    [userId],
  );

  const cards = useMemo(() => {
    if (!rows) return [];
    const subjectNameById = new Map(assignments.map((a) => [a.subject.id, a.subject.name]));
    const classNameById = new Map<string, string>();
    for (const a of assignments) {
      for (const c of a.classes) classNameById.set(c.id, c.name);
    }
    const componentById = new Map(components.map((c) => [c.id, c]));

    return rows.map((r) => {
      const component = componentById.get(r.componentId);
      const total = r.rosterCount > 0 ? r.rosterCount : r.count;
      const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
      return {
        ...r,
        subjectName: subjectNameById.get(r.subjectId) ?? r.subjectId,
        className: classNameById.get(r.classId) ?? r.classId,
        componentName: component?.name ?? r.componentId,
        componentType: component?.type ?? "OTHER",
        total,
        pct,
      };
    });
  }, [rows, assignments, components]);

  const isLoading = assignmentsLoading || termLoading || schemeLoading;

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray900">Active Assessments</h1>
        <p className="text-xs md:text-sm text-gray500 mt-0.5">
          Assessments you've started. Pick one up where you left off, or start a new one from Mark Scores.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray100 px-6 py-12 text-center flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray100">
            <StatusUp size={24} variant="Bold" color="#0D0D0D" />
          </div>
          <p className="text-sm font-medium text-gray900">No active assessments yet</p>
          <p className="text-xs text-gray500 max-w-xs">
            Once you start scoring a CA, it'll show up here so you can jump right back in.
          </p>
          <button
            type="button"
            onClick={() => navigate("/teach/exams/scoring")}
            className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gray900 px-5 text-sm font-medium text-white transition-all hover:bg-gray800 active:scale-95"
          >
            Start scoring
            <ArrowRight2 size={16} variant="Bold" color="#FFFFFF" />
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <button
              key={c.examKey}
              type="button"
              onClick={() =>
                navigate(
                  `/teach/exams/scoring?subjectId=${c.subjectId}&classId=${c.classId}&componentId=${c.componentId}`,
                )
              }
              className="group flex flex-col gap-3 rounded-xl border border-gray100 bg-white p-4 text-left transition-all hover:border-gray200 hover:shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray900">{c.subjectName}</p>
                  <p className="mt-0.5 truncate text-xs text-gray500">
                    {c.className} · {c.componentName}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gray100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray700">
                  {c.componentType}
                </span>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-gray500">
                    {c.count} of {c.total} scored
                  </span>
                  <span className="font-medium text-gray900">{c.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray100">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gray900 transition-all duration-500",
                      c.pct === 100 && "bg-springgreen600",
                    )}
                    style={{ width: `${Math.max(c.pct, 3)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray100 pt-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-springgreen600">
                  <span className="h-1.5 w-1.5 rounded-full bg-springgreen600" />
                  In progress
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-gray900 transition-all group-hover:gap-2">
                  Continue
                  <ArrowRight2 size={14} variant="Bold" color="#0D0D0D" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
