import { useRef, useState } from "react";
import { Add, AddCircle, Minus, Trash, Copy } from "iconsax-react";
import { motion } from "motion/react";

import { cn } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { MultiSelect } from "../../../../components/ui/multi-select";
import { SelectDropdown } from "../../../../components/ui/select-dropdown";
import { TimeInput } from "../../../../components/ui/time-input";
import { deriveDaySchedule, timeToMin } from "../../utils/allocate";
import { buildBlock, newDraftId } from "../../utils/draft";
import { DAYS, type DayOfWeek, type DayPeriodBlock, type ScheduleBreak } from "../../types";
import type { ScheduleTemplate } from "../../api/useScheduleTemplates";

interface ScheduleStepProps {
  isEditing?: boolean;
  title: string;
  onTitleChange: (t: string) => void;
  schedule: DayPeriodBlock[];
  onScheduleChange: (s: DayPeriodBlock[]) => void;
  missingDays: DayOfWeek[];
  onNext: () => void;
  templates: ScheduleTemplate[];
}

const DAY_OPTIONS = DAYS.map((d) => ({ value: d, label: d.charAt(0) + d.slice(1).toLowerCase() }));
const labelFor = (d: DayOfWeek) => d.charAt(0) + d.slice(1).toLowerCase();

const blockIssues = (b: DayPeriodBlock): string[] => {
  const issues: string[] = [];
  if (timeToMin(b.endTime) <= timeToMin(b.startTime)) {
    issues.push("End time must be after the start time.");
    return issues;
  }
  const derived = deriveDaySchedule(b.startTime, b.endTime, b.periodCount, b.breaks);
  if (derived.periods.length < b.periodCount) {
    issues.push("School day is too short for the selected periods — extend the end time or reduce periods.");
  }
  const sorted = b.breaks
    .map((br) => ({ start: timeToMin(br.startTime), end: timeToMin(br.startTime) + br.durationMinutes }))
    .sort((x, y) => x.start - y.start);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < sorted[i - 1].end) {
      issues.push("Breaks overlap each other — give them different start times.");
      break;
    }
  }
  for (const br of b.breaks) {
    const s = timeToMin(br.startTime);
    const e = s + br.durationMinutes;
    if (s < timeToMin(b.startTime) || e > timeToMin(b.endTime)) {
      issues.push("A break falls outside the school day.");
      break;
    }
  }
  return issues;
};

const Stepper = ({
  value,
  step,
  min,
  max,
  onChange,
  format,
}: {
  value: number;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) => (
  <div className="flex h-11 items-center justify-between rounded-full border border-input bg-background px-2">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - step))}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray50 text-gray500 hover:bg-accent"
      aria-label="Decrease"
    >
      <Minus size={14} color="#8C8C8C" />
    </button>
    <span className="text-sm font-semibold tabular-nums">{format ? format(value) : value}</span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + step))}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray50 text-gray500 hover:bg-accent"
      aria-label="Increase"
    >
      <Add size={14} color="#8C8C8C" />
    </button>
  </div>
);

export const ScheduleStep = ({
  isEditing,
  title,
  onTitleChange,
  schedule,
  onScheduleChange,
  missingDays,
  onNext,
  templates,
}: ScheduleStepProps) => {
  const missingRef = useRef<HTMLDivElement>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [sourceClassId, setSourceClassId] = useState("");

  const applySource = (selectedClassId: string) => {
    setSourceClassId(selectedClassId);
    const t = templates.find((x) => x.classId === selectedClassId);
    if (t) onScheduleChange(t.config);
  };

  const patch = (id: string, patch: Partial<DayPeriodBlock>) =>
    onScheduleChange(
      schedule.map((b) => {
        if (b.id !== id) return b;
        const next = { ...b, ...patch };
        const derived = deriveDaySchedule(next.startTime, next.endTime, next.periodCount, next.breaks);
        return { ...next, periodCount: derived.periodCount, periods: derived.periods };
      }),
    );

  const patchBreak = (blockId: string, breakId: string, change: Partial<ScheduleBreak>) => {
    const block = schedule.find((b) => b.id === blockId);
    if (!block) return;
    patch(blockId, { breaks: block.breaks.map((br) => (br.id === breakId ? { ...br, ...change } : br)) });
  };

  const addBreak = (blockId: string) => {
    const block = schedule.find((b) => b.id === blockId);
    if (!block) return;
    const start = block.periods.length && block.periods[block.periods.length - 1]
      ? block.periods[block.periods.length - 1].endTime
      : "12:00";
    patch(blockId, { breaks: [...block.breaks, { id: newDraftId(), label: "Break", startTime: start, durationMinutes: 40 }] });
  };

  const removeBreak = (blockId: string, breakId: string) => {
    const block = schedule.find((b) => b.id === blockId);
    if (!block) return;
    patch(blockId, { breaks: block.breaks.filter((br) => br.id !== breakId) });
  };

  const addBlock = () =>
    onScheduleChange([
      ...schedule,
      buildBlock({
        days: [],
        periodCount: 10,
        startTime: "08:00",
        endTime: "16:00",
        breaks: [{ id: newDraftId(), label: "Break", startTime: "12:00", durationMinutes: 40 }],
      }),
    ]);

  const removeBlock = (id: string) => onScheduleChange(schedule.filter((b) => b.id !== id));

  const blocksWithDays = schedule.filter((b) => b.days.length > 0);
  const weeklySlots = blocksWithDays.reduce((sum, b) => sum + b.periodCount * b.days.length, 0);
  const hasInvalid = schedule.some((b) => blockIssues(b).length > 0);
  const usedDays = new Set<DayOfWeek>(schedule.flatMap((b) => b.days));
  const allDaysTaken = DAYS.every((d) => usedDays.has(d));

  const handleNext = () => {
    if (missingDays.length > 0) {
      setShakeKey((k) => k + 1);
      requestAnimationFrame(() =>
        missingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {!isEditing && templates.length > 0 && (
        <div className="rounded-xl border border-input p-4 md:p-5">
          <div className="flex items-center gap-2">
            <Copy size={16} color="#0D0D0D" />
            <p className="text-sm font-medium text-gray900">Start from another class</p>
          </div>
          <p className="mt-1 text-sm text-placeholder">
            Copy the days, periods and breaks from a class that already has a timetable. Period times are
            recalculated for this class.
          </p>
          <div className="mt-3 max-w-md">
            <SelectDropdown
              options={templates.map((t) => ({
                value: t.classId,
                label: t.className,
                badge: `${t.weeklySlots} slots/wk`,
                badgeTone: "neutral" as const,
              }))}
              value={sourceClassId}
              onChange={applySource}
              placeholder="Choose a class to copy from…"
              searchable
            />
          </div>
          {sourceClassId && (
            <p className="mt-2 text-xs text-springgreen600">
              Copied {templates.find((t) => t.classId === sourceClassId)?.className}&apos;s configuration —
              edit anything below.
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-input p-4 md:p-5">
        <p className="text-sm font-medium text-gray900">Timetable title</p>
        <Input
          className="mt-2"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Weekly Timetable"
        />
      </div>

      <div className="rounded-xl border border-input p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray900">Days &amp; periods configuration</p>
          <span className="rounded-full bg-gray50 px-3 py-1 text-xs text-gray500">
            {weeklySlots} slots / week
          </span>
        </div>
        <p className="mt-1 text-sm text-placeholder">
          Give each block a school-day start–end range, the number of periods, and any breaks. Period times are
          calculated to fill the remaining minutes.
        </p>

        <div className="mt-4 space-y-4">
          {schedule.map((block) => {
            const issues = blockIssues(block);
            const derived = deriveDaySchedule(block.startTime, block.endTime, block.periodCount, block.breaks);
            const first = derived.periods[0];
            const last = derived.periods[derived.periods.length - 1];
            const lens = derived.periods.map((p) => timeToMin(p.endTime) - timeToMin(p.startTime));
            const minLen = lens.length ? Math.min(...lens) : 0;
            const maxLen = lens.length ? Math.max(...lens) : 0;

            const takenDays = new Set<DayOfWeek>(
              schedule.filter((b) => b.id !== block.id).flatMap((b) => b.days),
            );
            const availableDayOptions = DAY_OPTIONS.filter(
              (o) => !takenDays.has(o.value as DayOfWeek) || block.days.includes(o.value as DayOfWeek),
            );
            const takenDayLabels = DAY_OPTIONS.filter((o) => takenDays.has(o.value as DayOfWeek)).map((o) => o.label);

            return (
              <div key={block.id} className="rounded-xl border border-input bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray900">Configuration</p>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-input text-placeholder hover:text-red500"
                    aria-label="Remove configuration"
                  >
                    <Trash size={14} color="#8C8C8C" />
                  </button>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="text-xs text-gray500">Days</span>
                    <MultiSelect
                      options={availableDayOptions}
                      selected={[...block.days]}
                      onChange={(days) => patch(block.id, { days: days as DayOfWeek[] })}
                      placeholder="Pick weekdays"
                      searchable
                    />
                    {takenDayLabels.length > 0 && (
                      <p className="text-xs text-placeholder">
                        {takenDayLabels.join(", ")} {takenDayLabels.length === 1 ? "is" : "are"} used in another
                        configuration.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-gray500">Periods per day</span>
                    <Stepper
                      value={block.periodCount}
                      step={1}
                      min={1}
                      max={12}
                      onChange={(v) => patch(block.id, { periodCount: v })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-gray500">School day starts</span>
                    <TimeInput
                      value={block.startTime}
                      onChange={(t) => patch(block.id, { startTime: t })}
                      placeholder="e.g. 08:00"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-gray500">School day ends</span>
                    <TimeInput
                      value={block.endTime}
                      onChange={(t) => patch(block.id, { endTime: t })}
                      placeholder="e.g. 16:00"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-gray500">Breaks</p>
                  {block.breaks.length === 0 && (
                    <p className="text-xs text-placeholder">No breaks — periods run continuously.</p>
                  )}
                  {block.breaks.map((br) => (
                    <div key={br.id} className="flex flex-col gap-2.5 rounded-xl border border-input bg-background p-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <span className="text-xs text-gray500">Label</span>
                        <Input
                          value={br.label}
                          onChange={(e) => patchBreak(block.id, br.id, { label: e.target.value })}
                          placeholder="e.g. Short Break"
                        />
                      </div>
                      <div className="space-y-1.5 sm:w-32">
                        <span className="text-xs text-gray500">Starts</span>
                        <TimeInput
                          value={br.startTime}
                          onChange={(t) => patchBreak(block.id, br.id, { startTime: t })}
                          placeholder="12:00"
                        />
                      </div>
                      <div className="space-y-1.5 sm:w-40">
                        <span className="text-xs text-gray500">Minutes</span>
                        <Stepper
                          value={br.durationMinutes}
                          step={5}
                          min={5}
                          max={180}
                          onChange={(v) => patchBreak(block.id, br.id, { durationMinutes: v })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBreak(block.id, br.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-input text-placeholder hover:text-red500 sm:mb-0"
                        aria-label="Remove break"
                      >
                        <Trash size={14} color="#8C8C8C" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addBreak(block.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-input px-3 py-1.5 text-xs font-medium text-gray900 transition-colors hover:bg-gray50"
                  >
                    <AddCircle size={14} color="#0D0D0D" />
                    Add another break
                  </button>
                </div>

                {derived.periods.length > 0 && (
                  <p className="mt-3 border-t border-input pt-3 text-xs text-gray500">
                    {derived.periods.length} × {minLen === maxLen ? `${minLen} min` : `${minLen}–${maxLen} min`}
                    {derived.breakSlots.length > 0
                      ? ` · breaks ${derived.breakSlots.map((s) => `${s.startTime}–${s.endTime}`).join(", ")}`
                      : " · no break"}
                    {first && last ? ` · ${first.startTime}–${last.endTime}` : ""}
                  </p>
                )}

                {issues.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-red500">
                    {issues.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {schedule.length > 0 && !allDaysTaken && (
          <button
            type="button"
            onClick={addBlock}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-medium text-gray900 transition-colors hover:bg-gray50"
          >
            <AddCircle size={16} color="#0D0D0D" />
            Add another configuration
          </button>
        )}

        {missingDays.length > 0 && (
          <div ref={missingRef} className="scroll-mt-6">
            <motion.div
              key={shakeKey}
              initial={false}
              animate={{ x: [0, -8, 8, -8, 8, -4, 4, 0] }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="rounded-xl bg-amber400/10 px-4 py-3 text-sm text-amber500"
            >
              You haven't set periods for{" "}
              {missingDays.map((d, i) => (
                <span key={d}>
                  <span className="font-medium">{labelFor(d)}</span>
                  {i < missingDays.length - 1 && <span>, </span>}
                </span>
              ))}{" "}
              yet.
            </motion.div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <span
          className={cn(
            "text-xs",
            blocksWithDays.length === 0 || hasInvalid || missingDays.length > 0
              ? "text-red500"
              : "text-placeholder",
          )}
        >
          {blocksWithDays.length === 0
            ? "Add at least one configuration with days."
            : missingDays.length > 0
              ? "Add periods for every weekday before continuing."
              : hasInvalid
                ? "Fix the issues above to continue."
                : ""}
        </span>
        <Button type="button" onClick={handleNext} disabled={blocksWithDays.length === 0 || hasInvalid}>
          Continue
        </Button>
      </div>
    </div>
  );
};