import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Book1,
  ArrowDown2,
  DocumentText,
  InfoCircle,
  Profile2User,
  TickCircle,
  SearchNormal,
  CloseCircle,
} from "iconsax-react";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { useMyAssignments } from "../../teacher/api/useMyAssignments";
import { useActiveTerm } from "../../calendar/api";
import { useExamComponents } from "../api/useExamComponents";
import { useStudents } from "../../students/api";
import { useExamScoresLocal, useExamScoresBulk, useSaveExamScores, examScoreKey } from "../api";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { Button } from "../../../components/ui/button";
import { StudentScoreCard } from "./StudentScoreCard";
import { ScoreListView } from "./ScoreListView";
import { cn } from "../../../lib/utils";
import type { ExamComponent } from "../types";
import type { SubjectAssignment } from "../../teacher/types";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface SubjectBlockProps {
  assignment: SubjectAssignment;
  components: ExamComponent[];
  term: string;
  open: boolean;
  onToggle: () => void;
  initialClassId?: string;
  initialComponentId?: string;
}

type ViewMode = "list" | "card";

const SubjectBlock = ({
  assignment,
  components,
  term,
  open,
  onToggle,
  initialClassId = "",
  initialComponentId = "",
}: SubjectBlockProps) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const subject = assignment.subject;
  const classOptions = assignment.classes.map((c) => ({ value: c.id, label: c.name }));

  const [classId, setClassId] = useState<string>(() => initialClassId || classOptions[0]?.value || "");
  const [componentId, setComponentId] = useState<string>(initialComponentId);
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<ViewMode>(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "card" : "list",
  );
  const [scores, setScores] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");

  const examKey = classId && componentId ? examScoreKey({ subjectId: subject.id, classId, componentId, term }) : "";

  const { data: roster = [], isLoading: rosterLoading } = useStudents(classId, "ACTIVE");
  const { scores: savedScores, isLoading: savedLoading } = useExamScoresLocal(examKey);
  useExamScoresBulk({ subjectId: subject.id, classId, componentId, term });
  const saveMutation = useSaveExamScores();

  const savedScoreMap = new Map(savedScores.map((r) => [r.studentId, r]));

  const q = search.trim().toLowerCase();
  const filteredRoster = useMemo(() => {
    if (!q) return roster;
    return roster.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.admissionNo ?? "").toLowerCase().includes(q),
    );
  }, [roster, q]);
  const isSearching = q.length > 0;
  const displayRoster = isSearching ? filteredRoster : roster;

  const rosterCards = displayRoster.map((s) => ({
    studentId: s.id,
    studentName: s.name,
    admissionNo: s.admissionNo ?? "",
    score: null,
    remarks: null,
  }));

  useEffect(() => {
    setIndex(0);
    setScores({});
    setSearch("");
  }, [examKey]);

  useEffect(() => {
    setIndex(0);
  }, [q]);

  useEffect(() => {
    if (!examKey || savedLoading || rosterLoading) return;
    const rosterIds = new Set(roster.map((s) => s.id));
    setScores((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [sid, row] of savedScoreMap) {
        if (rosterIds.has(sid) && next[sid] === undefined) {
          next[sid] = row.score;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [examKey, savedLoading, rosterLoading, savedScores, roster]);

  const maxScore = components.find((c) => c.id === componentId)?.maxScore ?? 0;
  const enteredCount = roster.filter((s) => scores[s.id] !== undefined).length;
  const allScored = roster.length > 0 && enteredCount === roster.length;
  const current = rosterCards[index] ?? null;
  const isCurrentSaved = current ? savedScoreMap.has(current.studentId) : false;

  const pendingSync = useLiveQuery(
    () => {
      if (!userId || !examKey) return Promise.resolve(0);
      return db.syncQueue
        .where("userId")
        .equals(userId)
        .filter(
          (i) =>
            i.table === "examScores" &&
            i.recordId === `${userId}:${examKey}` &&
            (i.status === "pending" || i.status === "failed"),
        )
        .count();
    },
    [userId, examKey],
  );

  const selectedComponent = components.find((c) => c.id === componentId) ?? null;

  const handleChange = (studentId: string, value: number) => {
    setScores((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSave = () => {
    if (!classId || !componentId) return;

    const entries = roster
      .filter((s) => scores[s.id] !== undefined)
      .map((s) => ({ studentId: s.id, score: scores[s.id] as number }));

    if (entries.length === 0) return;

    const studentNames: Record<string, string> = {};
    roster.forEach((s) => {
      studentNames[s.id] = s.name;
    });

    saveMutation.mutate({
      subjectId: subject.id,
      classId,
      componentId,
      term,
      scores: entries,
      studentNames,
    });
  };

  const handleNext = () => {
    setIndex((i) => Math.min(i + 1, Math.max(rosterCards.length - 1, 0)));
  };

  const handleSkip = () => {
    if (index < rosterCards.length - 1) setIndex(index + 1);
  };

  return (
    <div className="bg-white rounded-xl border border-gray100 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray50/60 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray100">
          <Book1 size={20} variant="Bold" color="#0D0D0D" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray900 truncate">{subject.name}</p>
          <p className="text-xs text-gray500 truncate">
            {assignment.classes.length} {assignment.classes.length === 1 ? "class" : "classes"}
            {components.length > 0 ? ` · ${components.length} mark types` : ""}
          </p>
        </div>
        <ArrowDown2
          variant="Linear"
          size={18}
          color="#B3B3B3"
          className={cn("shrink-0 transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray100">
          {components.length === 0 ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber500/30 bg-amber500/5 px-4 py-3">
              <InfoCircle size={16} variant="Bold" color="#F59E0B" className="shrink-0 mt-0.5" />
              <p className="text-sm text-gray700">
                No score scheme is configured for this term yet. Ask your principal to set up CA &amp; exams in
                Examinations → Configure.
              </p>
            </div>
          ) : (
            <div className="pt-4">
              <div className="w-full sm:w-64">
                <p className="text-xs font-medium text-gray500 mb-1.5">Class</p>
                <SelectDropdown
                  options={classOptions}
                  value={classId}
                  onChange={setClassId}
                  placeholder="Select class"
                  searchable
                />
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-gray500 mb-2">Mark type</p>
                <div className="flex flex-wrap gap-2">
                  {components.map((c) => {
                    const active = componentId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setComponentId(c.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border h-10 sm:h-9 px-4 text-sm font-medium transition-all active:scale-95",
                          active
                            ? "bg-gray900 text-white border-gray900"
                            : "bg-white text-gray700 border-gray100 hover:border-gray200 hover:text-gray900",
                        )}
                      >
                        {c.name}
                        <span className={cn("text-xs", active ? "text-gray300" : "text-gray400")}>· {c.maxScore}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {componentId && selectedComponent && (
                <div className="mt-5">
                  {rosterLoading ? (
                    <div className="flex items-center justify-center gap-3 rounded-xl bg-gray50 py-8">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray200 border-t-gray900" />
                      <p className="text-sm text-gray500">Loading students…</p>
                    </div>
                  ) : roster.length === 0 ? (
                    <div className="w-full rounded-xl border border-gray100 p-8 text-center">
                      <DocumentText size={24} className="mx-auto text-gray300 mb-2" variant="Bold" />
                      <p className="text-sm font-medium text-gray900">No students in this class</p>
                      <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
                        Once students are enrolled in this class, their scores will appear here.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray900 truncate">
                            {selectedComponent.name}
                            <span className="text-gray500 font-normal"> · out of {maxScore}</span>
                          </p>
                          <p className="text-xs text-gray500 truncate">
                            {classOptions.find((c) => c.value === classId)?.label ?? "Class"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              allScored ? "text-springgreen600" : "text-gray900",
                            )}
                          >
                            {enteredCount}/{roster.length}
                          </p>
                          <p className="text-[11px] text-gray400">students scored</p>
                        </div>
                      </div>

                      <div className="h-1.5 bg-gray100 rounded-full overflow-hidden mt-2">
                        <div
                          className={cn(
                            "h-full bg-gray900 rounded-full transition-all duration-500",
                            allScored && "bg-springgreen600",
                          )}
                          style={{ width: `${(enteredCount / roster.length) * 100}%` }}
                        />
                      </div>

                      <div className="mt-4 relative max-w-sm">
                        <SearchNormal
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                          variant="Bold"
                          color="#B3B3B3"
                        />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search student by name or admission no."
                          className="w-full h-11 rounded-full border border-gray100 bg-white pl-11 pr-11 text-sm text-gray900 placeholder:text-gray400 focus:outline-none focus:border-gray900 transition-colors"
                        />
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-gray400 hover:bg-gray50 hover:text-gray900 transition-colors"
                            aria-label="Clear search"
                          >
                            <CloseCircle size={16} variant="Bold" color="#8C8C8C" />
                          </button>
                        )}
                      </div>

                      {allScored && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-springgreen600/30 bg-springgreen600/10 px-4 py-2.5">
                          <TickCircle size={16} variant="Bold" color="#15803D" className="shrink-0" />
                          <p className="text-sm font-medium text-springgreen600">
                            All {roster.length} students scored for {selectedComponent.name}
                          </p>
                        </div>
                      )}

                      {view === "card" && (
                        <div className="mt-4">
                          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4">
                            {rosterCards.map((s, i) => {
                              const done = savedScoreMap.has(s.studentId) || scores[s.studentId] !== undefined;
                              const isCurrent = i === index;
                              return (
                                <button
                                  key={s.studentId}
                                  type="button"
                                  onClick={() => setIndex(i)}
                                  title={s.studentName}
                                  className={cn(
                                    "h-10 w-10 sm:h-8 sm:w-8 shrink-0 rounded-full text-[11px] sm:text-[10px] font-bold flex items-center justify-center transition-all active:scale-95",
                                    isCurrent && "ring-2 ring-gray900 ring-offset-2",
                                    done ? "bg-springgreen600 text-white" : "bg-gray100 text-gray700 hover:bg-gray200",
                                  )}
                                >
                                  {initials(s.studentName)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex rounded-full border border-gray100 bg-offWhite p-0.5 w-fit">
                            <button
                              type="button"
                              onClick={() => setView("list")}
                              className={cn(
                                "rounded-full px-5 h-10 sm:h-9 text-sm sm:text-xs font-medium transition-all active:scale-95",
                                view === "list" ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
                              )}
                            >
                              List
                            </button>
                            <button
                              type="button"
                              onClick={() => setView("card")}
                              className={cn(
                                "rounded-full px-5 h-10 sm:h-9 text-sm sm:text-xs font-medium transition-all active:scale-95",
                                view === "card" ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
                              )}
                            >
                              Card
                            </button>
                          </div>

                          {enteredCount > 0 && (
                            <span className="text-xs text-gray400 flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  pendingSync ? "bg-amber-500" : "bg-springgreen600",
                                )}
                              />
                              {pendingSync ? "saved · syncing" : "saved to this device"}
                            </span>
                          )}
                        </div>

                        <Button
                          onClick={handleSave}
                          disabled={enteredCount === 0 || saveMutation.isPending}
                          className="w-full sm:w-auto sm:self-end active:scale-95 transition-transform"
                        >
                          {saveMutation.isPending ? "Saving…" : `Save (${enteredCount})`}
                        </Button>
                      </div>

                      <div className="mt-3">
                        {isSearching && filteredRoster.length === 0 ? (
                          <div className="w-full rounded-xl border border-gray100 bg-offWhite px-6 py-10 flex flex-col items-center text-center gap-2">
                            <SearchNormal size={20} variant="Bold" color="#B3B3B3" />
                            <p className="text-sm font-medium text-gray900">No student found</p>
                            <p className="text-xs text-gray400">
                              No match for “{search.trim()}”. Try a name or admission number.
                            </p>
                          </div>
                        ) : view === "card" ? (
                          <div className="flex justify-center">
                            <div className="w-full max-w-md">
                              {current ? (
                                <StudentScoreCard
                                  key={current.studentId}
                                  student={current}
                                  maxScore={maxScore}
                                  value={scores[current.studentId] ?? null}
                                  saved={isCurrentSaved}
                                  onChange={handleChange}
                                  onNext={handleNext}
                                  onSkip={handleSkip}
                                />
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <ScoreListView students={displayRoster} values={scores} maxScore={maxScore} onChange={handleChange} />
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TeacherScoring = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [searchParams] = useSearchParams();
  const focusSubjectId = searchParams.get("subjectId") ?? "";
  const focusClassId = searchParams.get("classId") ?? "";
  const focusComponentId = searchParams.get("componentId") ?? "";

  const { activeTerm, isLoading: termLoading } = useActiveTerm();
  const term = activeTerm?.term ?? "";

  const { data: assignments = [], isLoading: assignmentsLoading } = useMyAssignments(userId);
  const { data: schemeData, isLoading: schemeLoading } = useExamComponents(term);
  const components = schemeData?.components ?? [];

  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [openedOnce, setOpenedOnce] = useState(false);

  useEffect(() => {
    if (!openedOnce && assignments.length > 0) {
      const hasFocus = assignments.some((a) => a.subject.id === focusSubjectId);
      setOpenSubject(hasFocus && focusSubjectId ? focusSubjectId : assignments[0].subject.id);
      setOpenedOnce(true);
    }
  }, [assignments, openedOnce, focusSubjectId]);

  if (assignmentsLoading || termLoading || schemeLoading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="bg-white rounded-xl border border-gray100 p-12 text-center">
          <Profile2User size={32} className="mx-auto text-gray300 mb-3" variant="Bold" />
          <p className="text-sm font-medium text-gray900">You're not assigned to any subjects yet</p>
          <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
            Once your principal assigns you a subject, you'll be able to record scores here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray900">Mark Scores</h1>
        <p className="text-xs md:text-sm text-gray500 mt-0.5">
          Pick a class and a mark type for each subject, enter scores, then save. Scores are saved on this device and
          sync when you're back online.
        </p>
      </div>

      <div className="space-y-3">
        {assignments.map((a) => (
          <SubjectBlock
            key={a.subject.id}
            assignment={a}
            components={components}
            term={term}
            open={openSubject === a.subject.id}
            onToggle={() => setOpenSubject((prev) => (prev === a.subject.id ? null : a.subject.id))}
            initialClassId={a.subject.id === focusSubjectId ? focusClassId : ""}
            initialComponentId={a.subject.id === focusSubjectId ? focusComponentId : ""}
          />
        ))}
      </div>
    </div>
  );
};
