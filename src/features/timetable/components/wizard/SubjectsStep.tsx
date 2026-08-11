import { useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "iconsax-react";
import { motion } from "motion/react";
import { cn } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";
import { SelectDropdown } from "../../../../components/ui/select-dropdown";
import { DoublePeriodsSection } from "./DoublePeriodsSection";
import { type DoublePeriodConfig, type SubjectTeacherRow } from "../../types";
import type { SubjectTemplate } from "../../api/useScheduleTemplates";
import type { TimetableConfigFromEntries } from "../../utils/scheduleConfig";

interface SubjectsStepProps {
  subjects: SubjectTeacherRow[];
  selectedSubjects: string[];
  onToggleSubject: (subjectId: string) => void;
  targets: Record<string, number>;
  onTargetsChange: (t: Record<string, number>) => void;
  doublePeriods: DoublePeriodConfig[];
  onDoublePeriodsChange: (d: DoublePeriodConfig[]) => void;
  weeklySlots: number;
  availableDays: number;
  isEditing?: boolean;
  subjectTemplates: SubjectTemplate[];
  onCopySubjectConfig: (config: TimetableConfigFromEntries) => void;
  onBack: () => void;
  onNext: () => void;
}

export const SubjectsStep = ({
  subjects,
  selectedSubjects,
  onToggleSubject,
  targets,
  onTargetsChange,
  doublePeriods,
  onDoublePeriodsChange,
  weeklySlots,
  availableDays,
  isEditing,
  subjectTemplates,
  onCopySubjectConfig,
  onBack,
  onNext,
}: SubjectsStepProps) => {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [sourceClassId, setSourceClassId] = useState("");

  const doubleDaysFor = (id: string) =>
    doublePeriods.find((d) => d.subjectId === id)?.days ?? [];

  // A subject appears at most once per day; a configured double day uses 2 slots
  // but still counts as that subject's single daily appearance.
  const capFor = (id: string) => availableDays + doubleDaysFor(id).length;

  const toggleSubject = (id: string) => {
    if (selectedSubjects.includes(id)) {
      onToggleSubject(id);
      if (doublePeriods.some((d) => d.subjectId === id)) {
        onDoublePeriodsChange(doublePeriods.filter((d) => d.subjectId !== id));
      }
    } else {
      onToggleSubject(id);
    }
  };

  const setTarget = (id: string, value: number) => {
    const n = Math.max(0, Math.min(20, Math.floor(value || 0)));
    onTargetsChange(
      n > 0 ? { ...targets, [id]: n } : Object.fromEntries(Object.entries(targets).filter(([k]) => k !== id)),
    );
  };

  const selected = subjects.filter((s) => selectedSubjects.includes(s.subjectId));

  const targetSum = selected.reduce((sum, s) => sum + (targets[s.subjectId] ?? 0), 0);
  const capIssues = selected.filter((s) => (targets[s.subjectId] ?? 0) > capFor(s.subjectId));
  const budgetOverflow = targetSum > weeklySlots;
  const hasErrors = budgetOverflow || capIssues.length > 0;

  const handleNext = () => {
    if (hasErrors) {
      setShakeKey((k) => k + 1);
      requestAnimationFrame(() => badgeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
    <div className="rounded-xl border border-input bg-card p-4 md:p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-gray900">Select subjects</p>
          <span className="text-xs text-placeholder">{selected.length} selected</span>
        </div>
        <p className="mt-1 text-sm text-placeholder">Subjects are auto-attached to their assigned teacher.</p>

        {!isEditing && subjectTemplates.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="max-w-md">
              <SelectDropdown
                options={subjectTemplates.map((t) => ({
                  value: t.classId,
                  label: t.className,
                  badge: `${t.subjectCount} subjects · ${t.targetSum} slots`,
                  badgeTone: "neutral" as const,
                }))}
                value={sourceClassId}
                onChange={(v) => {
                  setSourceClassId(v);
                  const t = subjectTemplates.find((x) => x.classId === v);
                  if (t) onCopySubjectConfig(t.config);
                }}
                placeholder="Copy settings from another class…"
                searchable
              />
            </div>
            {sourceClassId && (
              <p className="text-xs text-springgreen600">
                Copied{" "}
                {subjectTemplates.find((t) => t.classId === sourceClassId)?.className}&apos;s subjects — edit
                anything below.
              </p>
            )}
          </div>
        )}

        {subjects.length === 0 ? (
          <Link
            to="/admin/subjects?tab=classes"
            className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber400/10 px-3 py-2 text-sm text-amber500 transition-colors hover:bg-amber400/20"
          >
            No subjects assigned to this class yet — assign subjects under Classes &amp; Assignments.
            <ArrowRight size={14} color="#FBBC05" />
          </Link>
        ) : (
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {subjects.map((s) => {
              const active = selectedSubjects.includes(s.subjectId);
              return (
                <button
                  key={s.subjectId}
                  type="button"
                  onClick={() => toggleSubject(s.subjectId)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    active ? "border-gray900/20 bg-gray50" : "border-input text-placeholder",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      active ? "border-gray900 bg-gray900 text-white" : "border-input",
                    )}
                  >
                    {active && (
                      <svg className="h-3 w-3" fill="none" stroke="#FFFFFF" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1 truncate font-medium">{s.name}</span>
                  <span className="truncate text-xs text-placeholder">{s.teacherName}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>

      <DoublePeriodsSection
        subjects={subjects}
        selectedSubjects={selectedSubjects}
        onToggleSubject={onToggleSubject}
        doublePeriods={doublePeriods}
        onChange={onDoublePeriodsChange}
      />

      {selected.length > 0 && (
        <div className="rounded-xl border border-input bg-card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs text-gray500">Target periods per week</p>
            <span className="shrink-0 text-xs text-placeholder">
              {availableDays} days · {weeklySlots} slots
            </span>
          </div>

          <div ref={badgeRef} className="scroll-mt-6">
            {hasErrors ? (
              <motion.div
                key={shakeKey}
                initial={false}
                animate={{ x: [0, -8, 8, -8, 8, -4, 4, 0] }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="mt-3 space-y-1 rounded-xl border border-red400/30 bg-red500/5 px-3 py-2.5 text-sm text-red500"
              >
                {budgetOverflow && (
                  <p>
                    Targets ({targetSum}) exceed the {weeklySlots} available weekly slots — reduce targets or
                    add periods in the Schedule step.
                  </p>
                )}
                {capIssues.length > 0 && (
                  <p>
                    {capIssues.map((s) => s.name).join(", ")}{" "}
                    {capIssues.length === 1 ? "exceeds" : "exceed"} the once-per-day cap — a subject can only
                    appear once per day (a double period counts as its one appearance).
                  </p>
                )}
              </motion.div>
            ) : targetSum > 0 ? (
              <div className="mt-3 rounded-xl bg-springgreen600/10 px-3 py-2.5 text-sm text-springgreen600">
                Targets {targetSum} / {weeklySlots} slots — fits.
              </div>
            ) : (
              <p className="mt-3 text-xs text-placeholder">
                No targets — every selected subject automatically gets at least 1 period.
              </p>
            )}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {selected.map((s) => {
              const ddays = doubleDaysFor(s.subjectId);
              const target = targets[s.subjectId] ?? 0;
              const maxTarget = capFor(s.subjectId);
              const overCap = target > maxTarget;
              const needsDouble = target > 0 && ddays.length > 0 && target < ddays.length * 2;
              return (
                <div
                  key={s.subjectId}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg px-1.5 py-1",
                    overCap && "rounded-lg bg-red500/5 ring-1 ring-red400/30",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray900">{s.name}</p>
                    {overCap ? (
                      <p className="text-[11px] text-red500">
                        Max {maxTarget} periods/wk — once per day
                        {ddays.length > 0 ? " + double days" : ""}
                      </p>
                    ) : needsDouble ? (
                      <p className="text-[11px] text-amber500">Must be ≥ {ddays.length * 2} for its double days</p>
                    ) : null}
                  </div>
                  <div className="flex h-9 items-center rounded-full border border-input bg-background px-3">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      inputMode="numeric"
                      value={target || ""}
                      onChange={(e) => setTarget(s.subjectId, Number(e.target.value))}
                      placeholder="auto"
                      className="w-12 bg-transparent text-right text-sm tabular-nums focus-visible:outline-none"
                    />
                    <span className="ml-1 text-xs text-placeholder">/wk</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          {hasErrors && (
            <span className="text-xs text-red500">Some target periods can't fit — fix them above.</span>
          )}
          <Button type="button" onClick={handleNext} disabled={selected.length === 0}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};