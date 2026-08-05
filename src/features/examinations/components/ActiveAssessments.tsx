import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight2, Profile2User, StatusUp } from "iconsax-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useMyAssignments } from "../../teacher/api/useMyAssignments";
import { useActiveExamScores } from "../api/useActiveExamScores";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { cn } from "../../../lib/utils";
export const ActiveAssessments = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState("");
  const { data: assignments = [], isLoading: assignmentsLoading } = useMyAssignments(userId);
  const { data: rows = [], isLoading: rowsLoading, error } = useActiveExamScores(selectedClassId || undefined);
  const cards = useMemo(() => {
    return rows.map((r) => {
      const total = r.rosterCount > 0 ? r.rosterCount : r.count;
      const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
      return { ...r, total, pct };
    });
  }, [rows]);
  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assignments) {
      for (const c of a.classes) {
        if (!map.has(c.id)) map.set(c.id, c.name);
      }
    }
    return [
      { value: "", label: "All classes" },
      ...Array.from(map, ([id, name]) => ({ value: id, label: name })),
    ];
  }, [assignments]);
  const visibleCards = useMemo(
    () => (selectedClassId ? cards.filter((c) => c.classId === selectedClassId) : cards),
    [cards, selectedClassId],
  );
  const isLoading = rowsLoading || assignmentsLoading;
  const classGroups = useMemo(() => {
    const map = new Map<string, { classId: string; className: string; latest: number; items: typeof cards }>();
    for (const c of visibleCards) {
      const g = map.get(c.classId);
      if (g) {
        g.items.push(c);
        if (c.latest > g.latest) g.latest = c.latest;
      } else {
        map.set(c.classId, { classId: c.classId, className: c.className ?? c.classId, latest: c.latest, items: [c] });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.latest - a.latest);
  }, [visibleCards]);
  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray900">Active Assessments</h1>
          <p className="text-xs md:text-sm text-gray500 mt-0.5">
            Assessments you've started. Pick one up where you left off, or start a new one from Mark Scores.
          </p>
        </div>
        <SelectDropdown
          options={classOptions}
          value={selectedClassId}
          onChange={setSelectedClassId}
          placeholder="All classes"
          className="w-44 md:w-52"
        />
      </div>
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
        </div>
      ) : error && cards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray100 px-6 py-12 text-center flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-gray900">Couldn't load your assessments</p>
          <p className="text-xs text-gray500 max-w-xs">
            Check your connection and try again. Your saved scores are safe on this device.
          </p>
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
            onClick={() => navigate("/teach/ca-and-exams/mark-scores")}
            className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gray900 px-5 text-sm font-medium text-white transition-all hover:bg-gray800 active:scale-95"
          >
            Start scoring
            <ArrowRight2 size={16} variant="Bold" color="#FFFFFF" />
          </button>
        </div>
      ) : visibleCards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray100 px-6 py-12 text-center flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-gray900">No assessments in this class</p>
          <p className="text-xs text-gray500 max-w-xs">
            Pick another class from the dropdown to see its active assessments.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {classGroups.map((g) => (
            <section key={g.classId}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray900">
                  <Profile2User size={16} variant="Bold" color="#0D0D0D" />
                  {g.className}
                </h2>
                <span className="text-xs text-gray500">
                  {g.items.length} {g.items.length === 1 ? "assessment" : "assessments"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {g.items.map((c) => (
                  <button
                    key={c.examKey}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/teach/ca-and-exams/mark-scores?subjectId=${c.subjectId}&classId=${c.classId}&componentId=${c.componentId}`,
                      )
                    }
                    className="group flex flex-col gap-3 rounded-xl border border-gray100 bg-white p-4 text-left transition-all hover:border-gray200 hover:shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray900">{c.subjectName}</p>
                        <p className="mt-0.5 truncate text-xs text-gray500">
                          {c.componentName} · out of {c.maxScore}
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
