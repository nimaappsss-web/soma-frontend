import { computePeriodTimes, DEFAULT_PERIOD_MINUTES, overlaps } from "./allocate";
import type { BusyTeacher, DayPeriodBlock, DoublePeriodConfig, SubjectTeacherRow } from "../types";

export interface TeacherCapacityRow {
  teacherId: string;
  teacherName: string;
  /** Weekly period-slots in THIS class's schedule already blocked by the
   * teacher's committed windows in other classes (deduped, overlap-aware). */
  committed: number;
  /** Weekly period-slots this class asks this teacher for (targets, doubles
   * counting 2 per double day, and ≥1 for any unpicked subject). */
  pending: number;
  /** committed + pending — the teacher's board-level weekly load. */
  needed: number;
  /** Total weekly period-slots in this class's schedule. */
  capacity: number;
  /** capacity − committed — the slots the teacher could still take here. */
  available: number;
}

/**
 * Structural teacher-capacity pre-check, computed from data the wizard already
 * has — no allocator run needed. A teacher can only be in one class per period,
 * so if this class's `pending` demand exceeds the teacher's `available` slots in
 * this class's grid (capacity minus the windows committed to OTHER classes), the
 * combination is provably impossible and no seed/re-roll can fix it.
 *
 * Committed slots are computed per grid-slot (overlap-aware and deduped), so a
 * busy window spanning two of this class's periods blocks both, while two busy
 * windows overlapping the same period still count once, and committed windows
 * outside this class's schedule don't reduce capacity.
 */
export const computeTeacherCapacity = (input: {
  subjects: SubjectTeacherRow[];
  selectedSubjectIds: string[];
  targets: Record<string, number>;
  doublePeriods?: DoublePeriodConfig[];
  busyTeachers?: BusyTeacher[];
  schedule: DayPeriodBlock[];
}): { rows: TeacherCapacityRow[]; over: TeacherCapacityRow[]; weeklySlots: number } => {
  const { subjects, selectedSubjectIds, targets, doublePeriods = [], busyTeachers = [], schedule } = input;

  const slots: Array<{ day: string; startTime: string; endTime: string }> = [];
  const slotKeys = new Set<string>();
  for (const block of schedule) {
    const times = block.periods?.length
      ? block.periods.map((p) => ({ startTime: p.startTime, endTime: p.endTime }))
      : computePeriodTimes(block.periodCount, block.startTime, DEFAULT_PERIOD_MINUTES).map((t) => ({
          startTime: t.start,
          endTime: t.end,
        }));
    for (const day of block.days) {
      for (const t of times) {
        const key = `${day}|${t.startTime}|${t.endTime}`;
        if (slotKeys.has(key)) continue;
        slotKeys.add(key);
        slots.push({ day, startTime: t.startTime, endTime: t.endTime });
      }
    }
  }
  const weeklySlots = slots.length;

  const busyFor = (teacherId: string) => busyTeachers.filter((b) => b.teacherId === teacherId);

  // How many slots the allocator WILL place for a selected subject: double-days
  // always consume 2 slots each (Phase 1 places them regardless of target), a
  // targeted subject gets its target, and an untargeted subject gets ≥1.
  const requiredFor = (subjectId: string): number => {
    const doubleDays = doublePeriods.filter((d) => d.subjectId === subjectId).reduce(
      (acc, d) => acc + d.days.length,
      0,
    );
    const target = targets[subjectId] ?? 0;
    return Math.max(doubleDays * 2, target > 0 ? target : 1);
  };

  // Pending per teacher from this class's selected subjects.
  const pendingFor = new Map<string, { name: string; pending: number }>();
  for (const s of subjects) {
    if (!selectedSubjectIds.includes(s.subjectId)) continue;
    if (!s.teacherId) continue; // "No teacher assigned" is a separate blocker
    const cur = pendingFor.get(s.teacherId) ?? { name: s.teacherName, pending: 0 };
    cur.pending += requiredFor(s.subjectId);
    pendingFor.set(s.teacherId, cur);
  }

  const rows: TeacherCapacityRow[] = [];
  for (const [teacherId, { name, pending }] of pendingFor) {
    const busy = busyFor(teacherId);
    const committed = slots.filter(
      (slot) =>
        busy.some(
          (b) => b.day === slot.day && overlaps(b.startTime, b.endTime, slot.startTime, slot.endTime),
        ),
    ).length;
    const available = weeklySlots - committed;
    rows.push({
      teacherId,
      teacherName: name,
      committed,
      pending,
      needed: committed + pending,
      capacity: weeklySlots,
      available,
    });
  }

  rows.sort(
    (a, b) => b.pending / Math.max(1, b.available) - a.pending / Math.max(1, a.available),
  );

  return { rows, over: rows.filter((r) => r.pending > r.available), weeklySlots };
};


