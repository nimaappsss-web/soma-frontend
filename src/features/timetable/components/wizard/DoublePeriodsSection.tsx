import { useState } from "react";
import { Setting2, Trash } from "iconsax-react";

import { Button } from "../../../../components/ui/button";
import { MultiSelect } from "../../../../components/ui/multi-select";
import { SelectDropdown, type SelectOption } from "../../../../components/ui/select-dropdown";
import { DAYS, type DayOfWeek, type DoublePeriodConfig, type SubjectTeacherRow } from "../../types";

interface DoublePeriodsSectionProps {
  subjects: SubjectTeacherRow[];
  selectedSubjects: string[];
  onToggleSubject: (subjectId: string) => void;
  doublePeriods: DoublePeriodConfig[];
  onChange: (configs: DoublePeriodConfig[]) => void;
}

const DAY_OPTIONS = DAYS.map((d) => ({ value: d, label: d.charAt(0) + d.slice(1).toLowerCase() }));
const labelFor = (d: DayOfWeek) => d.charAt(0) + d.slice(1).toLowerCase();

export const DoublePeriodsSection = ({
  subjects,
  selectedSubjects,
  onToggleSubject,
  doublePeriods,
  onChange,
}: DoublePeriodsSectionProps) => {
  const [draftSubject, setDraftSubject] = useState("");
  const [draftDays, setDraftDays] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const configured = new Set(doublePeriods.map((d) => d.subjectId));
  const subjectOptions: SelectOption[] = subjects
    .filter((s) => !configured.has(s.subjectId) || s.subjectId === editingId)
    .map((s) => ({ value: s.subjectId, label: s.name }));

  const beginEdit = (cfg: DoublePeriodConfig) => {
    setDraftSubject(cfg.subjectId);
    setDraftDays([...cfg.days]);
    setEditingId(cfg.subjectId);
  };

  const reset = () => {
    setDraftSubject("");
    setDraftDays([]);
    setEditingId(null);
  };

  const handleSet = () => {
    if (!draftSubject || draftDays.length === 0) return;
    const next: DoublePeriodConfig = {
      subjectId: draftSubject,
      days: draftDays as DayOfWeek[],
    };
    const exists = doublePeriods.some((d) => d.subjectId === draftSubject);
    onChange(exists ? doublePeriods.map((d) => (d.subjectId === draftSubject ? next : d)) : [...doublePeriods, next]);
    if (!selectedSubjects.includes(draftSubject)) onToggleSubject(draftSubject);
    reset();
  };

  return (
    <div className="rounded-xl border border-azure500/30 bg-azure500/5 p-4 md:p-5">
      <p className="text-sm font-medium text-gray900">Double periods</p>
      <p className="mt-1 text-sm text-placeholder">
        Pick a subject and choose which days it runs double periods. Lab-heavy lessons often run back-to-back.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[180px] flex-1 space-y-1.5 sm:max-w-[220px]">
          <span className="text-xs text-gray500">Subject</span>
          <SelectDropdown
            options={subjectOptions}
            value={draftSubject}
            onChange={setDraftSubject}
            placeholder="Choose a subject"
            searchable
          />
        </div>
        <div className="min-w-[180px] flex-1 space-y-1.5 sm:max-w-[260px]">
          <span className="text-xs text-gray500">Days</span>
          <MultiSelect
            options={DAY_OPTIONS}
            selected={draftDays}
            onChange={setDraftDays}
            placeholder="Pick days"
            searchable
          />
        </div>
        <Button type="button" size="sm" onClick={handleSet} disabled={!draftSubject || draftDays.length === 0}>
          {editingId ? "Update" : "Set"}
        </Button>
      </div>

      {doublePeriods.length > 0 && (
        <div className="mt-4 space-y-2">
          {doublePeriods.map((cfg) => (
            <div
              key={cfg.subjectId}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-input bg-card px-3 py-2.5"
            >
              <span className="text-sm font-medium text-gray900">
                {subjects.find((s) => s.subjectId === cfg.subjectId)?.name ?? cfg.subjectId}
              </span>
              <span className="flex flex-wrap gap-1">
                {cfg.days.map((d) => (
                  <span key={d} className="rounded-full bg-gray50 px-2 py-0.5 text-[11px] text-gray500">
                    {labelFor(d)}
                  </span>
                ))}
              </span>
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => beginEdit(cfg)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-input text-gray500 hover:text-gray900"
                  aria-label="Edit double periods"
                >
                  <Setting2 size={14} color="#8C8C8C" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(doublePeriods.filter((d) => d.subjectId !== cfg.subjectId))}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-input text-placeholder hover:text-red500"
                  aria-label="Remove double periods"
                >
                  <Trash size={14} color="#8C8C8C" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};