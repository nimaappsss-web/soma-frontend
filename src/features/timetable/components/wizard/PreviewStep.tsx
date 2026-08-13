import { Danger, Refresh2, TickCircle } from "iconsax-react";

import { Button } from "../../../../components/ui/button";
import { TimetableGrid } from "../TimetableGrid";
import { type AllocationResult } from "../../utils/allocate";
import type { TeacherCapacityRow } from "../../utils/teacherCapacity";
import { type DayOfWeek, type SubjectTeacherRow, type TimetableBreak } from "../../types";

interface PreviewStepProps {
  title: string;
  className: string;
  allocation: AllocationResult;
  weeklySlots: number;
  missingDays: DayOfWeek[];
  breaks: TimetableBreak[];
  noTeacherSubjects: SubjectTeacherRow[];
  capacityIssues?: TeacherCapacityRow[];
  isPublishing: boolean;
  onRegenerate: () => void;
  onBack: () => void;
  onPublish: () => void;
}

export const PreviewStep = ({
  title,
  className,
  allocation,
  weeklySlots,
  missingDays,
  breaks,
  noTeacherSubjects,
  capacityIssues = [],
  isPublishing,
  onRegenerate,
  onBack,
  onPublish,
}: PreviewStepProps) => {
  const { entries, conflicts, suggestions, unmet, occupiedSlots, totalSlots, overflow, tooFewSlots } = allocation;

  const guardBlocked = overflow || tooFewSlots || conflicts.length > 0 || noTeacherSubjects.length > 0 || capacityIssues.length > 0;
  const maxPeriods = Math.max(1, ...entries.map((e) => e.period));
  const periodsPerDay = Math.max(1, Math.ceil(weeklySlots / 5));

  const canPublish = entries.length > 0 && !guardBlocked && !isPublishing;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray900">{className} — preview</h3>
          <p className="text-sm text-placeholder">{title}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray500">
          <span className="rounded-full bg-gray50 px-3 py-1">
            {occupiedSlots} / {totalSlots} slots
          </span>
          <span className="rounded-full bg-gray50 px-3 py-1">{periodsPerDay} periods/day</span>
        </div>
      </div>

      {overflow && (
        <div className="rounded-xl border border-amber400/40 bg-amber400/10 px-4 py-3 text-sm text-amber500">
          Target periods exceed the weekly slots ({weeklySlots}). Reduce targets or add more periods in the
          Schedule step.
        </div>
      )}
      {tooFewSlots && (
        <div className="rounded-xl border border-amber400/40 bg-amber400/10 px-4 py-3 text-sm text-amber500">
          There aren't enough weekly slots ({weeklySlots}) for every selected subject. Add periods or remove a
          subject.
        </div>
      )}
      {missingDays.length > 0 && (
        <div className="rounded-xl border border-amber400/40 bg-amber400/10 px-4 py-3 text-sm text-amber500">
          No periods configured for {missingDays.join(", ")} — those days will be skipped.
        </div>
      )}

      {noTeacherSubjects.length > 0 && (
        <div className="rounded-xl border border-red400/30 bg-red500/5 px-4 py-3 text-sm text-red500">
          Assign teachers before publishing — no teacher is attached to:{" "}
          <span className="font-medium">
            {noTeacherSubjects.map((s) => s.name).join(", ")}
          </span>
          . Go to Teachers and assign a subject teacher for each of these.
        </div>
      )}

      {capacityIssues.length > 0 && (
        <div className="rounded-xl border border-red400/30 bg-red500/5 px-4 py-3 text-sm text-red500">
          <p className="font-medium">
            Blocked — {capacityIssues.map((c) => c.teacherName).join(", ")} can&apos;t fit this combination.
          </p>
          <ul className="mt-2 space-y-1.5">
            {capacityIssues.map((c) => (
              <li key={c.teacherId} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red500" />
                <span>
                  <span className="font-medium">{c.teacherName}</span> is already booked{" "}
                  <span className="tabular-nums">{c.committed}</span> of {c.capacity} weekly slots in other
                  classes; this class requests <span className="tabular-nums">{c.pending}</span> more — that
                  leaves them in two classes at once. Reduce this class&apos;s requests for that teacher or
                  swap them for a teacher with free time.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConflictPanel conflicts={conflicts} suggestions={suggestions} onSuggestFix={onRegenerate} />

      {unmet.length > 0 && (
        <div className="rounded-xl border border-red400/30 bg-red500/5 px-4 py-3 text-sm text-red500">
          Could not place: {unmet.map((u) => `${u.name} (${u.remaining} left)`).join(", ")} — add free slots in the
          Schedule step.
        </div>
      )}

      {conflicts.length === 0 && entries.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-springgreen600/10 px-4 py-3 text-sm text-springgreen600">
          <TickCircle size={16} color="#34A853" />
          No teacher clashes — ready to publish.
        </div>
      )}

      {entries.length === 0 && (
        <div className="rounded-xl border border-amber400/40 bg-amber400/10 px-4 py-3 text-sm text-amber500">
          No lessons placed yet — adjust the schedule or regenerate.
        </div>
      )}

      {entries.length > 0 ? (
        <div className="space-y-3">
          <TimetableGrid periodsPerDay={maxPeriods} entries={entries} breaks={breaks} showTeacher />
        </div>
      ) : (
        <div className="rounded-xl border border-input bg-card p-10 text-center text-sm text-placeholder">
          Nothing to preview yet.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onRegenerate} disabled={isPublishing}>
            <Refresh2 size={16} color="#8C8C8C" />
            Regenerate
          </Button>
          <Button type="button" size="lg" disabled={!canPublish} onClick={onPublish}>
            <TickCircle size={16} color="#FFFFFF" />
            {isPublishing
              ? "Publishing…"
              : noTeacherSubjects.length
                ? "Assign teachers to publish"
                : conflicts.length
                  ? "Resolve clashes to publish"
                  : "Publish timetable"}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ConflictPanelProps {
  conflicts: { day: string; teacherName: string; startTime: string; endTime: string; clashesWithClassName?: string; currentSubjectId?: string }[];
  suggestions: string[];
  onSuggestFix: () => void;
}

export const ConflictPanel = ({ conflicts, suggestions, onSuggestFix }: ConflictPanelProps) => {
  if (conflicts.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber400/40 bg-amber400/10 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-medium text-amber500">
          <Danger size={16} color="#FBBC05" />
          {conflicts.length} teacher clash{conflicts.length > 1 ? "es" : ""} found
        </p>
        <Button type="button" size="sm" variant="outline" onClick={onSuggestFix}>
          Suggest fix
        </Button>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {conflicts.slice(0, 12).map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber500" />
            <span className="text-gray600">
              <span className="font-medium text-gray900">{c.teacherName}</span> is booked{" "}
              {c.clashesWithClassName ? (
                <>
                  in <span className="font-medium">{c.clashesWithClassName}</span>
                </>
              ) : (
                <>twice</>
              )}{" "}
              on{" "}
              <span className="font-medium">{c.day.charAt(0) + c.day.slice(1).toLowerCase()}</span>{" "}
              <span className="tabular-nums">
                {c.startTime}–{c.endTime}
              </span>
              {c.currentSubjectId ? ` (${c.currentSubjectId})` : ""}
            </span>
          </li>
        ))}
      </ul>
      {suggestions.length > 0 && (
        <div className="mt-3 rounded-lg bg-white/60 px-3 py-2 text-xs text-gray600">
          <span className="font-medium text-gray900">Suggested:</span> {suggestions[0]}
        </div>
      )}
      {conflicts.length > 12 && (
        <p className="mt-2 text-xs text-placeholder">+{conflicts.length - 12} more</p>
      )}
    </div>
  );
};