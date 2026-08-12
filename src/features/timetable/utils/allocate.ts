import {
  dayOrder,
  type BusyTeacher,
  type DayOfWeek,
  type DayPeriodBlock,
  type DoublePeriodConfig,
  type DraftEntry,
  type SubjectTeacherRow,
  type TimetableConflict,
} from "../types";

export const MAX_PERIODS = 12;
export const DEFAULT_PERIOD_MINUTES = 40;

const toMin = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const pad = (n: number) => String(n).padStart(2, "0");

export const timeToMin = toMin;

export const toHHMM = (minutes: number): string =>
  `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;

/** Period times for a day/window: contiguous from startTime by intervalMinutes. */
export const computePeriodTimes = (
  periodCount: number,
  startTime = "08:00",
  intervalMinutes = 40,
): { period: number; start: string; end: string }[] =>
  Array.from({ length: periodCount }, (_, i) => {
    const start = toHHMM(toMin(startTime) + intervalMinutes * i);
    const end = toHHMM(toMin(start) + intervalMinutes);
    return { period: i + 1, start, end };
  });

export interface GridRow {
  period: number;
  start: string;
  end: string;
  isBreak: boolean;
}

/**
 * Build the rows shown by the timetable grid from the times that are actually
 * used (lesson entries + break windows), sorted by start time. This keeps the
 * grid aligned to the real schedule: breaks appear as their own aligned rows
 * and the last row ends at the configured end of the day instead of a fixed
 * 08:00 + N×40min shortcut. Falls back to `computePeriodTimes` when nothing
 * is scheduled yet.
 */
export const gridRowsFromTimes = (
  entries: Array<{ startTime?: string; endTime?: string }>,
  breaks: Array<{ start?: string; end?: string }>,
  fallbackPeriodCount = 9,
): GridRow[] => {
  const byStart = new Map<string, { end: number; isBreak: boolean }>();
  const push = (start: string, end: string, isBreak: boolean) => {
    const s = timeToMin(start);
    const en = Math.max(timeToMin(end), s + 1);
    const cur = byStart.get(start);
    byStart.set(start, {
      end: Math.max(cur?.end ?? 0, en),
      isBreak: cur ? cur.isBreak || isBreak : isBreak,
    });
  };
  for (const e of entries) if (e.startTime && e.endTime) push(e.startTime, e.endTime, false);
  for (const b of breaks) if (b.start && b.end) push(b.start, b.end, true);

  const rows = [...byStart.entries()]
    .map(([start, { end, isBreak }]) => ({ start, end: toHHMM(end), isBreak }))
    .sort((a, b) => timeToMin(a.start) - timeToMin(b.start))
    .map((r, i) => ({ period: i + 1, start: r.start, end: r.end, isBreak: r.isBreak }));

  if (rows.length) return rows;
  const count = Math.max(1, Math.min(Math.floor(fallbackPeriodCount) || 1, MAX_PERIODS));
  return computePeriodTimes(count).map((t) => ({
    period: t.period,
    start: t.start,
    end: t.end,
    isBreak: false,
  }));
};

export interface BreakInput {
  startTime: string;
  durationMinutes: number;
}

export interface DerivedDaySchedule {
  periodCount: number;
  periods: { startTime: string; endTime: string }[];
  breakSlots: { startTime: string; endTime: string }[];
}

/**
 * Derive uniform-ish period times for a school day that spans `startTime`–`endTime`
 * with `periodCount` periods and the given break windows. The non-break time is
 * divided among the periods; periods before a break fit exactly up to the break,
 * and the rest share the remaining time until the end of the day.
 */
export const deriveDaySchedule = (
  startTime: string,
  endTime: string,
  periodCount: number,
  breaks: BreakInput[] = [],
): DerivedDaySchedule => {
  const start = toMin(startTime);
  const end = Math.max(toMin(endTime), start);
  const clamped = Math.max(1, Math.min(MAX_PERIODS, Math.floor(periodCount) || 1));

  // normalize + sort breaks that sit inside the day
  const sorted = breaks
    .filter((b) => Math.floor(b.durationMinutes) > 0)
    .map((b) => {
      const bs = Math.max(start, Math.min(end - 1, toMin(b.startTime)));
      const be = Math.min(end, bs + Math.floor(b.durationMinutes));
      return { startTime: bs, endTime: be };
    })
    .sort((a, b) => a.startTime - b.startTime);

  // teaching segments: the day with break windows removed
  const segments: Array<{ start: number; end: number }> = [];
  let cursor = start;
  for (const b of sorted) {
    if (b.startTime > cursor) segments.push({ start: cursor, end: Math.min(b.startTime, end) });
    cursor = Math.max(cursor, b.endTime);
  }
  if (cursor < end) segments.push({ start: cursor, end });

  const usable = segments.filter((s) => s.end > s.start);
  const totalRemaining = usable.reduce((sum, s) => sum + (s.end - s.start), 0);

  // Distribute periods across segments so the counts ALWAYS sum to `clamped`.
  // Largest-remainder (Hare quota) sharing: each block gets its fair floor, then
  // surplus periods go to the blocks with the biggest fractional remainders.
  const counts: number[] = segments.map((s) =>
    s.end > s.start ? Math.floor(((s.end - s.start) * clamped) / (totalRemaining || 1)) : 0,
  );
  const positiveCount = segments.filter((s) => s.end > s.start).length;

  if (clamped <= positiveCount) {
    // Too few periods for every block: give 1 period to the earliest blocks only.
    let assigned = 0;
    segments.forEach((s, i) => {
      if (s.end > s.start && assigned < clamped) {
        counts[i] = 1;
        assigned++;
      }
    });
  } else {
    // Guarantee every non-empty block keeps at least 1 period.
    let left = clamped - counts.reduce((a, b) => a + b, 0);
    for (let i = 0; i < segments.length && left > 0; i++) {
      if (segments[i].end > segments[i].start && counts[i] === 0) {
        counts[i] = 1;
        left--;
      }
    }
    // Hand out the leftovers by largest fractional remainder.
    const raw = segments.map((s) =>
      s.end > s.start ? ((s.end - s.start) * clamped) / (totalRemaining || 1) : 0,
    );
    const frac = segments.map((_, i) => raw[i] - Math.floor(raw[i]));
    const order = segments.map((_, i) => i).sort((a, b) => frac[b] - frac[a]);
    for (const i of order) {
      if (left <= 0) break;
      if (segments[i].end > segments[i].start) {
        counts[i] += 1;
        left--;
      }
    }
  }

  // lay out periods so each segment is filled exactly (breaks become real gaps)
  const periods: { startTime: string; endTime: string }[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const count = counts[i] ?? 0;
    if (count <= 0) continue;
    const segLen = seg.end - seg.start;
    const base = Math.floor(segLen / count);
    const extra = segLen - base * count;
    let pos = seg.start;
    for (let j = 0; j < count; j++) {
      const len = base + (j < extra ? 1 : 0);
      if (len <= 0) continue;
      const s = toHHMM(pos);
      const e = toHHMM(pos + len);
      periods.push({ startTime: s, endTime: e });
      pos += len;
    }
  }

  return {
    periodCount: clamped,
    periods: periods.slice(0, clamped),
    breakSlots: sorted.map((b) => ({
      startTime: toHHMM(b.startTime),
      endTime: toHHMM(Math.max(b.startTime, b.endTime)),
    })),
  };
};

export const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  toMin(aStart) < toMin(bEnd) && toMin(aEnd) > toMin(bStart);

/** Which 1-based period indices of a computed grid a teacher-time window overlaps. */
export const periodsForWindow = (
  start: string,
  end: string,
  periodTimes: { period: number; start: string; end: string }[],
): number[] =>
  periodTimes
    .filter((t) => overlaps(t.start, t.end, start, end))
    .map((t) => t.period);

// ----------------------------- scheduling core -----------------------------

export interface AllocateInput {
  subjects: SubjectTeacherRow[];
  targets: Record<string, number>;
  doublePeriods: DoublePeriodConfig[];
  schedule: DayPeriodBlock[];
  busyTeachers: BusyTeacher[];
}

export interface AllocationResult {
  entries: DraftEntry[];
  conflicts: TimetableConflict[];
  suggestions: string[];
  unmet: Array<{ name: string; remaining: number }>;
  occupiedSlots: number;
  totalSlots: number;
  overflow: boolean;
  tooFewSlots: boolean;
}

// mulberry32 — deterministic per seed; "Regenerate" passes a new seed.
const mulberry32 = (seed: number) => () => {
  let a = seed |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

interface Slot {
  day: DayOfWeek;
  period: number;
  startTime: string;
  endTime: string;
}

const dayPeriodMap = (schedule: DayPeriodBlock[]): Map<DayOfWeek, Slot[]> => {
  const map = new Map<DayOfWeek, Slot[]>();
  for (const block of schedule) {
    const times = block.periods?.length
      ? block.periods.map((p) => ({ startTime: p.startTime, endTime: p.endTime }))
      : computePeriodTimes(block.periodCount, block.startTime, DEFAULT_PERIOD_MINUTES).map((t) => ({
          startTime: t.start,
          endTime: t.end,
        }));
    for (const day of block.days) {
      map.set(
        day,
        times.map((t, i) => ({ day, period: i + 1, startTime: t.startTime, endTime: t.endTime })),
      );
    }
  }
  return map;
};

const teacherBusyAt = (busy: BusyTeacher[], teacherId: string, slot: Slot): boolean =>
  busy.some(
    (b) =>
      b.teacherId === teacherId &&
      b.day === slot.day &&
      overlaps(b.startTime, b.endTime, slot.startTime, slot.endTime),
  );

export const allocateTimetable = (
  input: AllocateInput,
  seed = 1,
  withSuggestions = true,
): AllocationResult => {
  const { subjects, targets, doublePeriods, schedule, busyTeachers } = input;
  const rand = mulberry32(seed);
  const byDay = dayPeriodMap(schedule);

  const days = [...byDay.keys()].sort((a, b) => dayOrder[a] - dayOrder[b]);
  let totalSlots = 0;
  for (const day of days) totalSlots += byDay.get(day)?.length ?? 0;

  const taken = new Set<string>();
  const slotKey = (s: Slot) => `${s.day}|${s.period}`;
  const freeOn = (day: DayOfWeek): Slot[] =>
    (byDay.get(day) ?? []).filter((s) => !taken.has(slotKey(s)));

  const doubleDaysFor = new Map<string, DayOfWeek[]>();
  for (const dc of doublePeriods) {
    const set = new Set<DayOfWeek>();
    for (const d of dc.days) set.add(d);
    if (set.size) doubleDaysFor.set(dc.subjectId, [...set].sort((a, b) => dayOrder[a] - dayOrder[b]));
  }

  const teacherFor = new Map(subjects.map((s) => [s.subjectId, s] as const));

  const entries: DraftEntry[] = [];
  let occupied = 0;

  // Teacher occupancy tracked in-memory during generation so the same teacher is
  // never placed at two overlapping slots within this class (in addition to the
  // server-provided `busyTeachers` for their other classes).
  const teacherSlots = new Map<string, Slot[]>();

  const record = (slot: Slot, subjectId: string) => {
    const picked = teacherFor.get(subjectId);
    taken.add(slotKey(slot));
    occupied++;
    if (picked?.teacherId) {
      teacherSlots.set(picked.teacherId, [...(teacherSlots.get(picked.teacherId) ?? []), slot]);
    }
    entries.push({
      id: `draft_${seed}_${slot.day}_${slot.period}_${Math.floor(rand() * 1e6)}`,
      subjectId,
      subjectName: picked?.name ?? "",
      teacherId: picked?.teacherId ?? "",
      teacherName: picked?.teacherName ?? "",
      day: slot.day,
      period: slot.period,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  };

  const teacherAvailableAt = (teacherId: string, slot: Slot): boolean => {
    if (!teacherId) return true;
    if (teacherBusyAt(busyTeachers, teacherId, slot)) return false;
    const booked = teacherSlots.get(teacherId) ?? [];
    return !booked.some((s) => s.day === slot.day && overlaps(s.startTime, s.endTime, slot.startTime, slot.endTime));
  };

  // Hard rule: a subject appears at most once per day (a double period counts as
  // its one appearance). Single placements only ever use days the subject isn't
  // booked on yet, so leftover target periods go to `unmet` instead of repeating.
  const tryPlaceSingle = (subjectId: string, preferDays?: DayOfWeek[]): boolean => {
    const picked = teacherFor.get(subjectId);
    const usedDays = new Set(entries.filter((e) => e.subjectId === subjectId).map((e) => e.day));
    const candidateDays = (preferDays && preferDays.length ? preferDays : days)
      .filter((d) => !usedDays.has(d))
      .filter((d) => freeOn(d).length > 0)
      .sort(() => rand() - 0.5);
    for (const day of candidateDays) {
      const free = freeOn(day);
      const startIdx = Math.floor(rand() * free.length);
      for (let i = 0; i < free.length; i++) {
        const slot = free[(startIdx + i) % free.length];
        if (!teacherAvailableAt(picked?.teacherId ?? "", slot)) continue;
        record(slot, subjectId);
        return true;
      }
    }
    return false;
  };

  const tryPlaceDouble = (subjectId: string, day: DayOfWeek): boolean => {
    const picked = teacherFor.get(subjectId);
    if (entries.some((e) => e.subjectId === subjectId && e.day === day)) return false;
    const slots = byDay.get(day) ?? [];
    for (let i = 0; i + 1 < slots.length; i++) {
      const a = slots[i];
      const b = slots[i + 1];
      if (taken.has(slotKey(a)) || taken.has(slotKey(b))) continue;
      if (!teacherAvailableAt(picked?.teacherId ?? "", a)) continue;
      if (!teacherAvailableAt(picked?.teacherId ?? "", b)) continue;
      record(a, subjectId);
      record(b, subjectId);
      return true;
    }
    return false;
  };

  // Phase 2.5 repair: a subject that still has unmet target (no unused day with
  // a free slot left) may extend an existing single into a double — grab an
  // adjacent free slot next to a slot it already occupies. A double is still a
  // single daily appearance, so the once-per-day invariant is preserved. The
  // slot still has to pass teacher availability (other classes + this class).
  const tryExtendToDouble = (subjectId: string): boolean => {
    const picked = teacherFor.get(subjectId);
    const subjectEntries = entries.filter((e) => e.subjectId === subjectId);
    const dayPeriods = new Map<DayOfWeek, number[]>();
    for (const e of subjectEntries) {
      dayPeriods.set(e.day as DayOfWeek, [...(dayPeriods.get(e.day as DayOfWeek) ?? []), e.period]);
    }
    const candidates: { day: DayOfWeek; period: number; slot: Slot }[] = [];
    for (const [day, periods] of dayPeriods) {
      if (periods.length !== 1) continue; // already a double — nothing to extend
      const slots = byDay.get(day) ?? [];
      const p = periods[0];
      const prev = slots[p - 2];
      const next = slots[p];
      for (const slot of [prev, next]) {
        if (!slot) continue;
        if (taken.has(slotKey(slot))) continue;
        if (!teacherAvailableAt(picked?.teacherId ?? "", slot)) continue;
        candidates.push({ day, period: p, slot });
      }
    }
    if (candidates.length === 0) return false;
    candidates.sort(() => rand() - 0.5);
    for (const c of candidates) {
      if (taken.has(slotKey(c.slot))) continue;
      if (!teacherAvailableAt(picked?.teacherId ?? "", c.slot)) continue;
      record(c.slot, subjectId);
      return true;
    }
    return false;
  };

  // Remove a placed entry (slot occupancy, teacher booking, entries list) so
  // its slot can be given to a subject that needs it.
  const release = (entry: DraftEntry) => {
    const picked = teacherFor.get(entry.subjectId);
    if (picked?.teacherId) {
      teacherSlots.set(
        picked.teacherId,
        (teacherSlots.get(picked.teacherId) ?? []).filter(
          (s) => !(s.day === (entry.day as DayOfWeek) && s.period === entry.period),
        ),
      );
    }
    taken.delete(`${entry.day}|${entry.period}`);
    occupied--;
    entries.splice(entries.indexOf(entry), 1);
  };

  // Eviction repair (chained BFS): place a subject onto an occupied slot by
  // relocating every occupant in a chain that ends at a free slot. Each move
  // respects the moved subject's own once-per-day + teacher availability, so
  // the grid stays conflict-free. Bounded depth avoids pathological runs.
  const placeWithEviction = (subjectId: string): boolean => {
    const picked = teacherFor.get(subjectId);
    const usedDays = new Set(entries.filter((e) => e.subjectId === subjectId).map((e) => e.day));
    const candidates: Slot[] = [];
    for (const day of days) {
      if (usedDays.has(day)) continue;
      for (const slot of byDay.get(day) ?? []) {
        if (teacherAvailableAt(picked?.teacherId ?? "", slot)) candidates.push(slot);
      }
    }
    candidates.sort(() => rand() - 0.5);

    const occupant = (slot: Slot) =>
      entries.find((e) => e.day === slot.day && e.period === slot.period);
    const legalMoves = (occ: DraftEntry, forbidden: Set<string>): Slot[] => {
      const occPicked = teacherFor.get(occ.subjectId);
      return days
        .filter((d) => d !== occ.day && !entries.some((e) => e.subjectId === occ.subjectId && e.day === d))
        .flatMap((d) => (byDay.get(d) ?? []))
        .filter((t) => !forbidden.has(slotKey(t)))
        .filter((t) => teacherAvailableAt(occPicked?.teacherId ?? "", t))
        .sort(() => rand() - 0.5);
    };

    for (const slot of candidates) {
      if (!taken.has(slotKey(slot))) {
        record(slot, subjectId);
        return true;
      }
      // BFS for an eviction chain ending at a free slot.
      type Step = { from: Slot; to: Slot };
      const queue: { from: Slot; chain: Step[] }[] = [{ from: slot, chain: [] }];
      const visited = new Set<string>([slotKey(slot)]);
      let qi = 0;
      let found: Step[] | null = null;
      while (qi < queue.length) {
        const { from, chain } = queue[qi++];
        const occ = occupant(from);
        if (chain.length >= 6) break;
        if (!occ) {
          found = chain;
          break;
        }
        const forbidden = new Set([...visited, slotKey(from)]);
        for (const t of legalMoves(occ, forbidden)) {
          if (!taken.has(slotKey(t))) {
            found = [...chain, { from, to: t }];
            break;
          }
          const k = slotKey(t);
          if (visited.has(k)) continue;
          visited.add(k);
          queue.push({ from: t, chain: [...chain, { from, to: t }] });
        }
        if (found) break;
      }
      if (!found) continue;
      for (const step of [...found].reverse()) {
        const occ2 = occupant(step.from);
        if (!occ2) continue;
        if (!taken.has(slotKey(step.to)) && teacherAvailableAt(teacherFor.get(occ2.subjectId)?.teacherId ?? "", step.to)) {
          release(occ2);
          record(step.to, occ2.subjectId);
        }
      }
      record(slot, subjectId);
      return true;
    }
    return false;
  };

  const unmet: Array<{ name: string; remaining: number }> = [];

  const setSubjects = subjects.filter((s) => (targets[s.subjectId] ?? 0) > 0);
  const setIds = new Set(setSubjects.map((s) => s.subjectId));
  const unsetSubjects = subjects
    .filter((s) => !setIds.has(s.subjectId))
    .sort(() => rand() - 0.5);

  // Phase 1 — place ALL configured double periods first. A double occupies two
  // adjacent slots on a fixed day, so it has to win its pair before targeted
  // singles scatter into the same slots. Doubles already count toward a
  // subject's target (validation enforces target >= 2 × double days).
  const doubleSubjects = subjects.filter(
    (s) => (doubleDaysFor.get(s.subjectId) ?? []).length > 0,
  );
  const doubleOrder = [
    ...doubleSubjects.filter((s) => setIds.has(s.subjectId)),
    ...doubleSubjects.filter((s) => !setIds.has(s.subjectId)).sort(() => rand() - 0.5),
  ];
  for (const subj of doubleOrder) {
    for (const day of doubleDaysFor.get(subj.subjectId) ?? []) {
      tryPlaceDouble(subj.subjectId, day);
    }
  }

  // Phase 2 — fill the remaining target periods (whatever the doubles left).
  // Higher targets first: a subject at its once-per-day cap (e.g. English 7 =
  // 5 days + 2 double-days) must claim its days before smaller subjects scatter
  // into them, otherwise it loses a day and its target goes unmet.
  const phase2Order = [...setSubjects].sort(
    (a, b) => (targets[b.subjectId] ?? 0) - (targets[a.subjectId] ?? 0),
  );
  for (const subj of phase2Order) {
    const placed = entries.filter((e) => e.subjectId === subj.subjectId).length;
    let remaining = Math.max(0, (targets[subj.subjectId] ?? 0) - placed);
    let guard = 0;
    while (remaining > 0 && guard < totalSlots) {
      if (!tryPlaceSingle(subj.subjectId)) break;
      remaining--;
      guard++;
    }
    if (remaining > 0) unmet.push({ name: subj.name, remaining });
  }

  // Phase 2.5 — repair unmet targets that couldn't get a new day: extend an
  // existing single into a double (adjacent free slot). Still one appearance per
  // day, still teacher-checked. Only subjects still short from Phase 2.
  for (const u of [...unmet]) {
    let remaining = u.remaining;
    let guard = 0;
    while (remaining > 0 && guard < totalSlots) {
      const subj = setSubjects.find((s) => s.name === u.name);
      if (!subj) break;
      if (!tryExtendToDouble(subj.subjectId)) break;
      remaining--;
      guard++;
    }
    if (remaining > 0) {
      u.remaining = remaining;
    } else {
      unmet.splice(unmet.indexOf(u), 1);
    }
  }

  // Phase 3 — every unset subject gets >= 1 slot (randomized order); a double
  // already placed in Phase 1 satisfies this.
  for (const subj of unsetSubjects) {
    const placed = entries.filter((e) => e.subjectId === subj.subjectId).length;
    if (placed === 0 && !tryPlaceSingle(subj.subjectId)) {
      unmet.push({ name: subj.name, remaining: 1 });
    }
  }

  // Phase 4 — finish subjects still short of their target FIRST, then auto-fill
  // any genuinely extra slots. Free slots are NEVER handed to a subject that
  // already met its target while another subject is still short — that produced
  // "40/40 occupied yet unmet" schedules. Short subjects try a new single, then
  // extend an existing single into a double, then evict-and-relocate (chained).
  // A failed placement only drops that subject from the round's candidate pool —
  // every other subject is still tried, so the fill keeps going until truly
  // nothing can be placed (a full grid, not a stalled one).
  const countFor = (sid: string) => entries.filter((e) => e.subjectId === sid).length;
  const deficit = (sid: string) => Math.max(0, (targets[sid] ?? 0) - countFor(sid));
  const canStillPlace = (s: SubjectTeacherRow) =>
    days.some((d) => !entries.some((e) => e.subjectId === s.subjectId && e.day === d));
  let guard2 = 0;
  while (occupied < totalSlots && guard2 < totalSlots * 24) {
    guard2++;

    // 1st priority: every subject still short of its target (randomized order).
    const short = subjects
      .filter((s) => deficit(s.subjectId) > 0 && canStillPlace(s))
      .sort(() => rand() - 0.5);
    let placedShort = false;
    for (const subj of short) {
      if (tryPlaceSingle(subj.subjectId)) {
        placedShort = true;
        break;
      }
      if (tryExtendToDouble(subj.subjectId)) {
        placedShort = true;
        break;
      }
      if (placeWithEviction(subj.subjectId)) {
        placedShort = true;
        break;
      }
    }
    if (placedShort) continue;

    // 2nd priority: no short subject could place — top up with any subject that
    // still has a free day. Try every candidate rather than one random pick so
    // a single fully-booked subject can't stall the rest of the grid.
    const pool = subjects.filter(canStillPlace).sort(() => rand() - 0.5);
    let placedAny = false;
    for (const subj of pool) {
      if (tryPlaceSingle(subj.subjectId)) {
        placedAny = true;
        break;
      }
      if (tryExtendToDouble(subj.subjectId)) {
        placedAny = true;
        break;
      }
      if (placeWithEviction(subj.subjectId)) {
        placedAny = true;
        break;
      }
    }
    if (!placedAny) break;
  }

  // Rebuild `unmet` from the final placements (Phase 4 may have satisfied some).
  unmet.splice(
    0,
    unmet.length,
    ...subjects.flatMap((s) => {
      const placed = countFor(s.subjectId);
      const needed = setIds.has(s.subjectId) ? (targets[s.subjectId] ?? 0) : placed > 0 ? 0 : 1;
      return placed < needed ? [{ name: s.name, remaining: needed - placed }] : [];
    }),
  );

  // Sort by day then period.
  entries.sort(
    (a, b) => (dayOrder[a.day as DayOfWeek] ?? 99) - (dayOrder[b.day as DayOfWeek] ?? 99) || a.period - b.period,
  );

  const conflicts = detectConflicts(entries, busyTeachers);
  const targetSum = Object.values(targets).reduce((a, b) => a + (b || 0), 0);
  const overflow = targetSum > totalSlots;
  const tooFewSlots = totalSlots < subjects.length;

  return {
    entries,
    conflicts,
    suggestions: withSuggestions ? suggestFixes(input, seed) : [],
    unmet,
    occupiedSlots: occupied,
    totalSlots,
    overflow,
    tooFewSlots,
  };
};

/** Re-run with a fresh seed → re-rolls the scatter (Phases 2–3) only. */
export const regenerate = (input: AllocateInput, seed: number): AllocationResult =>
  allocateTimetable(input, seed);

const allocScore = (r: AllocationResult): number =>
  r.unmet.reduce((a, u) => a + u.remaining, 0) * 100 + r.conflicts.length * 10 + (r.overflow ? 5 : 0) + (r.tooFewSlots ? 5 : 0);

/**
 * Randomized-search wrapper: `allocateTimetable` is greedy and only finds a
 * complete, conflict-free arrangement some of the time (a busy teacher in
 * another class can box a subject in). Rerunning with fresh seeds until a fully
 * valid result appears turns that ~30–50% hit rate into a near-certainty, and
 * returns the best partial schedule if no full one exists.
 */
export const allocateWithRetry = (
  input: AllocateInput,
  baseSeed = 1,
  attempts = 24,
): AllocationResult => {
  let best = allocateTimetable(input, baseSeed);
  let bestScore = allocScore(best);
  for (let i = 1; i < attempts; i++) {
    const r = allocateTimetable(input, baseSeed + i * 31);
    if (!r.unmet.length && r.conflicts.length === 0 && !r.overflow && !r.tooFewSlots) return r;
    const s = allocScore(r);
    if (s < bestScore) {
      best = r;
      bestScore = s;
    }
  }
  return best;
};

// ----------------------------- conflict detection -----------------------------

export const detectConflicts = (
  entries: DraftEntry[],
  busyTeachers: BusyTeacher[],
): TimetableConflict[] => {
  const conflicts: TimetableConflict[] = [];
  const list = entries || [];
  const byTeacherDay = new Map<string, DraftEntry[]>();
  for (const e of list) {
    const k = `${e.teacherId}|${e.day}`;
    byTeacherDay.set(k, [...(byTeacherDay.get(k) ?? []), e]);
  }
  for (const teacherDay of byTeacherDay.values()) {
    if (teacherDay.length < 2) continue;
    for (let i = 0; i < teacherDay.length; i++) {
      for (let j = i + 1; j < teacherDay.length; j++) {
        const a = teacherDay[i];
        const b = teacherDay[j];
        if (overlaps(a.startTime, a.endTime, b.startTime, b.endTime)) {
          conflicts.push({
            kind: "teacher-clash",
            day: a.day,
            startTime: a.startTime,
            endTime: a.endTime,
            teacherId: a.teacherId,
            teacherName: a.teacherName ?? "",
            currentSubjectId: a.subjectName,
          });
        }
      }
    }
  }
  for (const e of list) {
    for (const b of busyTeachers || []) {
      if (
        b.teacherId === e.teacherId &&
        b.day === e.day &&
        overlaps(b.startTime, b.endTime, e.startTime, e.endTime)
      ) {
        conflicts.push({
          kind: "teacher-clash",
          day: e.day,
          startTime: e.startTime,
          endTime: e.endTime,
          teacherId: e.teacherId,
          teacherName: e.teacherName ?? "",
          currentSubjectId: e.subjectName,
          clashesWithClassId: b.classId,
          clashesWithClassName: b.className,
        });
      }
    }
  }
  const seen = new Set<string>();
  return conflicts.filter((c) => {
    const k = `${c.day}|${c.startTime}|${c.endTime}|${c.currentSubjectId}|${c.clashesWithClassName ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// ----------------------------- suggestions -----------------------------

const suggestFixes = (
  input: AllocateInput,
  seed: number,
): string[] => {
  const result = allocateTimetable(input, seed + 1013, false);
  if (result.conflicts.length === 0) return [];
  const suggestions: string[] = [];
  for (const c of result.conflicts.slice(0, 6)) {
    suggestions.push(
      `Swap ${c.currentSubjectId ?? "the lesson"} on ${c.day} ${c.startTime}–${c.endTime} to a free slot.`,
    );
  }
  return suggestions;
};