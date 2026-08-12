import { describe, expect, it } from "vitest";
import {
  allocateTimetable,
  allocateWithRetry,
  computePeriodTimes,
  deriveDaySchedule,
  gridRowsFromTimes,
} from "./allocate";
import type { AllocateInput } from "./allocate";
import type {
  BusyTeacher,
  DayOfWeek,
  DayPeriodBlock,
  DoublePeriodConfig,
  SubjectTeacherRow,
} from "../types";

const DAY5: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const subject = (id: string): SubjectTeacherRow => ({
  subjectId: id,
  name: `Subject ${id}`,
  code: null,
  teacherId: `t${id}`,
  teacherName: `Teacher ${id}`,
});

const times = (periodCount: number, startTime: string) =>
  computePeriodTimes(periodCount, startTime).map(({ start, end }) => ({ startTime: start, endTime: end }));

const block = (days: DayOfWeek[], periodCount = 9, startTime = "08:00"): DayPeriodBlock => ({
  id: "b",
  days,
  periodCount,
  startTime,
  endTime: "17:00",
  breaks: [],
  periods: times(periodCount, startTime),
});

const baseSubjects = (ids: string[]): SubjectTeacherRow[] => ids.map(subject);

const baseInput = (over: Partial<AllocateInput> = {}): AllocateInput => ({
  subjects: baseSubjects(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]),
  targets: { a: 4, b: 4, c: 4, d: 4, e: 4, f: 4, g: 4, h: 4, i: 4, j: 4 },
  doublePeriods: [],
  schedule: [block(DAY5, 9, "08:00")],
  busyTeachers: [],
  ...over,
});

const dayPeriodsOf = (result: { entries: { subjectId: string; day: string; period: number }[] }, day: string, subjectId: string) =>
  result.entries
    .filter((e) => e.day === day && e.subjectId === subjectId)
    .map((e) => e.period)
    .sort((p, q) => p - q);

describe("Scenario A — allocation determinism & retry", () => {
  it("A1: same seed yields byte-identical results (deterministic RNG)", () => {
    const input = baseInput();
    const a = allocateTimetable(input, 7);
    const b = allocateTimetable(input, 7);
    expect(a.entries).toEqual(b.entries);
    expect(a.occupiedSlots).toBe(b.occupiedSlots);
    expect(a.conflicts).toEqual(b.conflicts);
    expect(a.unmet).toEqual(b.unmet);
  });

  it("A2: allocateWithRetry is also deterministic for a fixed base seed", () => {
    const input = baseInput();
    const a = allocateWithRetry(input, 1);
    const b = allocateWithRetry(input, 1);
    expect(a.entries).toEqual(b.entries);
  });

  it("A3: a well-provisioned class fills the full grid cleanly (no gaps, no clashes)", () => {
    const input = baseInput();
    const result = allocateWithRetry(input);
    expect(result.unmet).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.overflow).toBe(false);
    expect(result.tooFewSlots).toBe(false);
    expect(result.occupiedSlots).toBe(result.totalSlots);
    expect(result.totalSlots).toBe(45);
    // Slot uniqueness: never two lessons on the same day/period.
    const keys = result.entries.map((e) => `${e.day}|${e.period}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("A4: never double-books a teacher's overlapping slots within a class", () => {
    const result = allocateWithRetry(baseInput());
    for (const teacherId of ["ta", "tb"] as const) {
      const byDay = new Map<string, { startTime: string; endTime: string }[]>();
      for (const e of result.entries) {
        if (e.teacherId !== teacherId) continue;
        const arr = byDay.get(e.day) ?? [];
        arr.push({ startTime: e.startTime, endTime: e.endTime });
        byDay.set(e.day, arr);
      }
      for (const slots of byDay.values()) {
        for (let i = 0; i < slots.length; i++) {
          for (let j = i + 1; j < slots.length; j++) {
            const a = slots[i];
            const b = slots[j];
            const ao = (s: string) => s.split(":").map(Number)[0] * 60 + Number(s.split(":")[1]);
            const noOverlap = ao(a.endTime) <= ao(b.startTime) || ao(b.endTime) <= ao(a.startTime);
            expect(noOverlap).toBe(true);
          }
        }
      }
    }
  });
});

describe("Scenario B — busy-teacher walls degrade gracefully", () => {
  it("B1: a teacher walled on every slot is never placed and reports unmet, without crashing", () => {
    const fullWall: BusyTeacher[] = DAY5.map((day) => ({
      teacherId: "ta",
      teacherName: "Teacher a",
      classId: "other",
      className: "Other",
      day,
      startTime: "00:00",
      endTime: "23:59",
    }));
    const result = allocateWithRetry(baseInput({ busyTeachers: fullWall }));
    expect(result.entries.some((e) => e.teacherId === "ta")).toBe(false);
    expect(result.conflicts).toEqual([]);
    expect(result.unmet.some((u) => u.name === "Subject a")).toBe(true);
    expect(result.occupiedSlots).toBeLessThanOrEqual(result.totalSlots);
  });

  it("B2: a teacher busy only on Monday is placed Tue–Fri, never Monday", () => {
    const mondayWall: BusyTeacher[] = [
      { teacherId: "ta", teacherName: "Teacher a", classId: "other", className: "Other", day: "MONDAY", startTime: "00:00", endTime: "23:59" },
    ];
    const result = allocateWithRetry(baseInput({ busyTeachers: mondayWall }));
    expect(result.entries.filter((e) => e.teacherId === "ta" && e.day === "MONDAY")).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.entries.some((e) => e.teacherId === "ta")).toBe(true);
  });
});

describe("Scenario C — schedule/period geometry", () => {
  it("C1: deriveDaySchedule yields exactly periodCount periods ending at endTime", () => {
    const r = deriveDaySchedule("08:00", "16:00", 10, [{ startTime: "12:00", durationMinutes: 40 }]);
    expect(r.periods.length).toBe(10);
    const last = r.periods[r.periods.length - 1];
    expect(last.endTime).toBe("16:00");
    // No period overlaps the lunch break 12:00–12:40.
    for (const p of r.periods) {
      const s = p.startTime;
      const e = p.endTime;
      const overlapsBreak = s < "12:40" && e > "12:00";
      expect(overlapsBreak).toBe(false);
    }
  });

  it("C2: shortened Friday keeps Friday lessons inside the Friday grid", () => {
    const friday = block(["FRIDAY"], 8, "08:30");
    friday.periods = times(8, "08:30");
    const schedule: DayPeriodBlock[] = [block(DAY5.filter((d) => d !== "FRIDAY") as DayOfWeek[], 8, "08:30"), friday];
    const result = allocateWithRetry(baseInput({ schedule }));
    // Every Friday lesson must use an allowed Friday period time.
    const allowed = new Set(friday.periods.map((p) => `${p.startTime}|${p.endTime}`));
    for (const e of result.entries) {
      if (e.day !== "FRIDAY") continue;
      expect(allowed.has(`${e.startTime}|${e.endTime}`)).toBe(true);
    }
    expect(result.conflicts).toEqual([]);
    expect(result.entries.every((e) => e.period <= 8)).toBe(true);
  });

  it("C3: lessons never land inside a break window", () => {
    const lunch = deriveDaySchedule("08:00", "16:00", 10, [{ startTime: "12:00", durationMinutes: 40 }]);
    const schedule: DayPeriodBlock[] = [
      {
        id: "bb",
        days: DAY5,
        periodCount: 10,
        startTime: "08:00",
        endTime: "16:00",
        breaks: [{ id: "lunch", label: "Lunch", startTime: "12:00", durationMinutes: 40 }],
        periods: lunch.periods,
      },
    ];
    const result = allocateWithRetry(
      baseInput({
        schedule,
        subjects: baseSubjects(["a", "b", "c", "d", "e"]),
        targets: { a: 10, b: 10, c: 10, d: 10, e: 10 },
      }),
    );
    expect(result.conflicts).toEqual([]);
    for (const e of result.entries) {
      const overlapsBreak = e.startTime < "12:40" && e.endTime > "12:00";
      expect(overlapsBreak).toBe(false);
    }
  });

  it("C4: gridRowsFromTimes labels rows 1..N by start time and keeps the last end", () => {
    const rows = gridRowsFromTimes(
      [{ startTime: "09:00", endTime: "09:40" }, { startTime: "08:00", endTime: "08:40" }],
      [{ start: "10:00", end: "10:10" }],
    );
    expect(rows.map((r) => r.period)).toEqual([1, 2, 3]);
    expect(rows[0].start).toBe("08:00");
    expect(rows[2].isBreak).toBe(true);
  });
});

describe("Scenario E — phantom ids, targets, doublePeriods", () => {
  it("E1: a target for a subject not in the list is ignored without crashing", () => {
    const result = allocateWithRetry(
      baseInput({ targets: { a: 4, b: 4, ghost: 40 } }),
    );
    expect(result.entries.some((e) => e.subjectId === "ghost" || e.subjectId === undefined)).toBe(false);
    expect(result.conflicts).toEqual([]);
    // Overflow reflects targetSum > slots (existing contract), but no crash.
    expect(typeof result.overflow).toBe("boolean");
  });

  it("E2: doublePeriods for a phantom subject are silently ignored", () => {
    const doubles: DoublePeriodConfig[] = [{ subjectId: "ghost", days: ["MONDAY", "TUESDAY"] }];
    const result = allocateWithRetry(baseInput({ doublePeriods: doubles }));
    expect(result.entries.some((e) => e.subjectId === "ghost")).toBe(false);
  });

  it("E3a: doublePeriods place adjacent pairs on the configured day (isolated)", () => {
    const schedule: DayPeriodBlock[] = [block(["MONDAY"], 4, "08:00")];
    const doubles: DoublePeriodConfig[] = [{ subjectId: "a", days: ["MONDAY"] }];
    const result = allocateWithRetry(
      { subjects: [subject("a")], targets: { a: 2 }, doublePeriods: doubles, schedule, busyTeachers: [] },
    );
    const monday = dayPeriodsOf(result, "MONDAY", "a");
    expect(monday.length).toBe(2);
    expect(monday[1]).toBe(monday[0] + 1);
    expect(result.entries.filter((e) => e.subjectId === "a").length).toBe(2);
  });

  it("E3b: a configured double day keeps both halves on that day even when Phase 4 fills tightly", () => {
    // Strict: subject `a` is doug on MONDAY+TUESDAY in a full 10-subject grid.
    const doubles: DoublePeriodConfig[] = [{ subjectId: "a", days: ["MONDAY", "TUESDAY"] }];
    const result = allocateWithRetry(
      baseInput({ targets: { a: 4, b: 4, c: 4, d: 4, e: 4, f: 4, g: 4, h: 4, i: 4, j: 4 }, doublePeriods: doubles }),
    );
    expect(dayPeriodsOf(result, "MONDAY", "a").length).toBe(2);
    expect(dayPeriodsOf(result, "TUESDAY", "a").length).toBe(2);
    // Once-per-day invariant intact elsewhere.
    for (const day of DAY5) {
      expect(dayPeriodsOf(result, day, "a").length).toBeLessThanOrEqual(2);
    }
  });

  it("E3c: eviction never splits a configured double (regression: scatter bug)", () => {
    // Reproduction of the real bug: sparse class (3 targeted + 7 to-fill) where
    // `placeWithEviction` relocated one half of subject `a`'s Tuesday double to
    // another day. Without the atomic-double guard this tripped in 10/60 seeds.
    const doubles: DoublePeriodConfig[] = [{ subjectId: "a", days: ["MONDAY", "TUESDAY"] }];
    const input = baseInput({ targets: { a: 4, b: 2, c: 2 }, doublePeriods: doubles });
    const violations: string[] = [];
    for (let seed = 1; seed <= 30; seed++) {
      const r = allocateTimetable(input, seed);
      const monday = dayPeriodsOf(r, "MONDAY", "a");
      const tuesday = dayPeriodsOf(r, "TUESDAY", "a");
      if (monday.length !== 2 || tuesday.length !== 2) {
        violations.push(
          `seed ${seed}: Mon=${monday.length} Tue=${tuesday.length} unmet=${JSON.stringify(r.unmet.map((u) => `${u.name}:${u.remaining}`))}`,
        );
      }
    }
    expect(violations).toEqual([]);
  });

  it("E4: targets may exceed available slots — overflow is flagged, never a crash", () => {
    const result = allocateWithRetry(
      baseInput({ targets: { a: 50, b: 40, c: 30, d: 20, e: 10, f: 5 } }),
    );
    expect(result.overflow).toBe(true);
    expect(Array.isArray(result.entries)).toBe(true);
    expect(result.occupiedSlots).toBeLessThanOrEqual(result.totalSlots);
  });
});