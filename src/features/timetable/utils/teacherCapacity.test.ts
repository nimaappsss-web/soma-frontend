import { describe, expect, it } from "vitest";
import { computeTeacherCapacity } from "./teacherCapacity";
import type { BusyTeacher, DayOfWeek, DayPeriodBlock, SubjectTeacherRow } from "../types";

const DAY5: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

const subject = (id: string, teacherId = "t" + id): SubjectTeacherRow => ({
  subjectId: id,
  name: `Subject ${id}`,
  code: null,
  teacherId,
  teacherName: `Teacher ${teacherId}`,
});

const block = (days: DayOfWeek[], periodCount = 8, startTime = "08:00"): DayPeriodBlock => ({
  id: "b",
  days,
  periodCount,
  startTime,
  endTime: "16:00",
  breaks: [],
  periods: Array.from({ length: periodCount }, (_, i) => ({
    startTime: `${String(8 + i).padStart(2, "0")}:00`,
    endTime: `${String(9 + i).padStart(2, "0")}:00`,
  })),
});

const schedule = [block(DAY5)]; // 40 weekly slots

describe("computeTeacherCapacity", () => {
  it("reports no over-capacity when committed + pending fit the week", () => {
    const busy: BusyTeacher[] = [
      { teacherId: "ta", teacherName: "Teacher ta", classId: "x", className: "X", day: "MONDAY", startTime: "08:00", endTime: "09:00" },
    ];
    const res = computeTeacherCapacity({
      subjects: [subject("a", "ta")],
      selectedSubjectIds: ["a"],
      targets: { a: 5 },
      busyTeachers: busy,
      schedule,
    });
    expect(res.weeklySlots).toBe(40);
    expect(res.over).toEqual([]);
  });

  it("flags a teacher whose committed + pending exceeds weekly slots as impossible", () => {
    // Teacher booked every slot of the week in other classes → 0 available here.
    const busy: BusyTeacher[] = DAY5.flatMap((day) => {
      const time = block([day], 8, "08:00").periods;
      return time.map((p) => ({
        teacherId: "ta",
        teacherName: "Teacher ta",
        classId: "x",
        className: "X",
        day,
        startTime: p.startTime,
        endTime: p.endTime,
      }));
    });
    const res = computeTeacherCapacity({
      subjects: [subject("a", "ta")],
      selectedSubjectIds: ["a"],
      targets: { a: 1 },
      busyTeachers: busy,
      schedule,
    });
    expect(res.over.length).toBe(1);
    expect(res.over[0].teacherId).toBe("ta");
    expect(res.rows[0].available).toBe(0);
  });

  it("counts an untargeted selected subject as needing at least 1 slot", () => {
    const res = computeTeacherCapacity({
      subjects: [subject("a", "ta"), subject("b", "ta")],
      selectedSubjectIds: ["a", "b"],
      targets: { a: 38 }, // 38 + b's guaranteed 1 = 39 of 40 → fits
      schedule,
    });
    expect(res.over).toEqual([]);
  });

  it("dedupes overlapping committed windows so a double-booking counts once", () => {
    const busy: BusyTeacher[] = [
      { teacherId: "ta", teacherName: "Teacher ta", classId: "x", className: "X", day: "MONDAY", startTime: "08:00", endTime: "09:00" },
      { teacherId: "ta", teacherName: "Teacher ta", classId: "y", className: "Y", day: "MONDAY", startTime: "08:00", endTime: "09:00" },
    ];
    const res = computeTeacherCapacity({
      subjects: [subject("a", "ta")],
      selectedSubjectIds: ["a"],
      targets: { a: 39 },
      busyTeachers: busy,
      schedule,
    });
    // One available slot lost to the duplicate window, not two.
    expect(res.rows[0].committed).toBe(1);
    expect(res.over).toEqual([]);
  });

  it("treats double periods (2 slots) as part of the demand even with no target", () => {
    const res = computeTeacherCapacity({
      subjects: [subject("a", "ta")],
      selectedSubjectIds: ["a"],
      targets: {},
      doublePeriods: [{ subjectId: "a", days: ["MONDAY", "TUESDAY"] }],
      schedule,
    });
    // 2 double days × 2 slots, no target → 4 pending.
    const row = res.rows[0];
    expect(row.pending).toBe(4);
    expect(res.over).toEqual([]);
  });
});