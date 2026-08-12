import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save2 } from "iconsax-react";

import { Button } from "../../../../components/ui/button";
import { useSubjects } from "../../../principal/api";
import { useSaveTimetableConfig, useScheduleTemplates } from "../../api";
import { normalizeSchedule, buildBlock, newDraftId } from "../../utils/draft";
import { ScheduleStep } from "./ScheduleStep";
import { SubjectsStep } from "./SubjectsStep";
import { DAYS, type DayOfWeek, type DayPeriodBlock, type DoublePeriodConfig, type SchoolTypeConfig, type SubjectTeacherRow, type TimetableConfigDto } from "../../types";
import { schoolTypeLabel } from "../../../../utils/schoolType";

interface TimetableConfigEditorProps {
  configType: SchoolTypeConfig;
  initial?: TimetableConfigDto | null;
  /** Deep-link mode: prefill defaults and jump straight to the Save step. */
  quick?: boolean;
  onDone: () => void;
  onCancel: () => void;
}

export const TimetableConfigEditor = ({
  configType,
  initial,
  quick = false,
  onDone,
  onCancel,
}: TimetableConfigEditorProps) => {
  const save = useSaveTimetableConfig();
  const { subjectTemplates } = useScheduleTemplates();
  const allSubjects = useSubjects();

  const defaultSchedule = useMemo<DayPeriodBlock[]>(() => {
    const base =
      initial?.schedule ??
      [
        buildBlock({
          days: quick ? [...DAYS] as DayOfWeek[] : [],
          periodCount: 10,
          startTime: "08:00",
          endTime: "16:00",
          breaks: [{ id: newDraftId(), label: "Break", startTime: "12:00", durationMinutes: 40 }],
        }),
      ];
    return normalizeSchedule(base);
  }, []);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(initial?.name ?? `${schoolTypeLabel(configType)} school configuration`);
  const [schedule, setSchedule] = useState<DayPeriodBlock[]>(defaultSchedule);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initial?.subjectIds ?? []);
  const [targets, setTargets] = useState<Record<string, number>>(initial?.targets ?? {});
  const [doublePeriods, setDoublePeriods] = useState<DoublePeriodConfig[]>(initial?.doublePeriods ?? []);

  // Quick mode: jump to the Save step immediately; pre-select every subject as
  // soon as they load so the defaults are publish-ready.
  useEffect(() => {
    if (!quick) return;
    setStep(2);
    if (allSubjects.data?.length && selectedSubjects.length === 0) {
      setSelectedSubjects(allSubjects.data.map((s) => s.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quick, allSubjects.data]);

  // Config-scope subject rows (teachers are per-class, resolved at publish).
  const subjects = useMemo<SubjectTeacherRow[]>(
    () =>
      (allSubjects.data ?? []).map((s) => ({
        subjectId: s.id,
        name: s.name,
        code: s.code ?? null,
        teacherId: "",
        teacherName: "Auto — per class",
      })),
    [allSubjects.data],
  );

  const weeklySlots = useMemo(() => {
    const perDay = new Map<DayOfWeek, number>();
    for (const block of schedule) {
      for (const day of block.days) perDay.set(day, Math.max(perDay.get(day) ?? 0, block.periodCount));
    }
    return Array.from(perDay.values()).reduce((a, b) => a + b, 0);
  }, [schedule]);

  const missingDays = useMemo(
    () => DAYS.filter((d) => !schedule.some((b) => b.days.includes(d as DayOfWeek))),
    [schedule],
  );

  const handleCopySubjectConfig = (cfg: { subjectIds: string[]; targets: Record<string, number>; doublePeriods: DoublePeriodConfig[] }) => {
    const available = new Set(subjects.map((s) => s.subjectId));
    setSelectedSubjects(cfg.subjectIds.filter((id) => available.has(id)));
    setTargets(Object.fromEntries(Object.entries(cfg.targets).filter(([id]) => available.has(id))));
    setDoublePeriods(cfg.doublePeriods.filter((d) => available.has(d.subjectId)));
  };

  const handleSave = () => {
    save.mutate(
      {
        id: initial?.id ?? configType,
        configType,
        name: title || `${schoolTypeLabel(configType)} school configuration`,
        schedule,
        subjectIds: selectedSubjects,
        targets,
        doublePeriods,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-placeholder transition-colors hover:text-gray900"
        >
          ← Back to configurations
        </button>
        <h2 className="mt-2 text-xl font-bold text-gray900">
          {schoolTypeLabel(configType)} configuration
        </h2>
        <p className="text-sm text-placeholder">
          One shared schedule &amp; subject setup for every {schoolTypeLabel(configType)} class. Classes are locked
          to this config so teacher-presence stays consistent.
        </p>
      </div>

      <div className="mb-6 flex items-center gap-2">
        {["Schedule", "Subjects", "Save"].map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              i === step ? "bg-gray900 text-white" : i < step ? "text-springgreen600" : "text-placeholder"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                i === step ? "bg-white/20" : i < step ? "bg-springgreen600 text-white" : "bg-gray100"
              }`}
            >
              {i + 1}
            </span>
            {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <ScheduleStep
          isEditing
          title={title}
          onTitleChange={setTitle}
          schedule={schedule}
          onScheduleChange={setSchedule}
          missingDays={missingDays}
          onNext={() => setStep(1)}
          templates={[]}
        />
      )}

      {step === 1 && (
        <SubjectsStep
          subjects={subjects}
          selectedSubjects={selectedSubjects}
          onToggleSubject={(id) =>
            setSelectedSubjects((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
          }
          targets={targets}
          onTargetsChange={setTargets}
          doublePeriods={doublePeriods}
          onDoublePeriodsChange={setDoublePeriods}
          weeklySlots={weeklySlots}
          availableDays={DAYS.length - missingDays.length}
          isEditing
          subjectTemplates={subjectTemplates}
          onCopySubjectConfig={handleCopySubjectConfig}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-input bg-card p-4">
            <p className="text-sm font-medium text-gray900">Ready to save</p>
            <ul className="mt-2 space-y-1 text-sm text-placeholder">
              <li>• {weeklySlots} slots/week across {DAYS.length - missingDays.length} days</li>
              <li>• {selectedSubjects.length} subjects
                {Object.values(targets).reduce((a, b) => a + b, 0) > 0 &&
                  ` · ${Object.values(targets).reduce((a, b) => a + b, 0)} targeted periods`}
              </li>
              <li>• {doublePeriods.length} double-period configuration{doublePeriods.length === 1 ? "" : "s"}</li>
            </ul>
<p className="mt-2 text-xs text-placeholder">
              Every existing &amp; new {schoolTypeLabel(configType)} class will build from this exact config.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={16} color="#8C8C8C" />
              Back
            </Button>
            <Button type="button" size="lg" onClick={handleSave} disabled={save.isPending}>
              {save.isPending ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="#FFFFFF"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <Save2 size={16} color="#FFFFFF" />
              )}
              Save configuration
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};