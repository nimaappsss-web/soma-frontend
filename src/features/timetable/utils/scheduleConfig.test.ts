import { describe, expect, it } from "vitest";
import { scheduleConfigFromTimetable, schedulesEqual } from "./scheduleConfig";

const baseEntries = [
  { day: "MONDAY", startTime: "08:30", endTime: "09:15" },
  { day: "MONDAY", startTime: "09:15", endTime: "10:00" },
  { day: "TUESDAY", startTime: "08:30", endTime: "09:15" },
  { day: "TUESDAY", startTime: "09:15", endTime: "10:00" },
];

describe("scheduleConfigFromTimetable (D4: edit-mode reconstruction of published entries)", () => {
  it("groups days by period signature — irregular grids become 3 blocks(D4)", () => {
    const entries = [
      // Mon/Tue/Thu share an 08:30 grid
      { day: "MONDAY", startTime: "08:30", endTime: "09:15" },
      { day: "MONDAY", startTime: "09:15", endTime: "10:00" },
      { day: "TUESDAY", startTime: "08:30", endTime: "09:15" },
      { day: "TUESDAY", startTime: "09:15", endTime: "10:00" },
      { day: "THURSDAY", startTime: "08:30", endTime: "09:15" },
      { day: "THURSDAY", startTime: "09:15", endTime: "10:00" },
      // Wednesday starts at 09:15 (missing 08:30 — the old partial-fill bug)
      { day: "WEDNESDAY", startTime: "09:15", endTime: "10:00" },
      { day: "WEDNESDAY", startTime: "10:00", endTime: "10:45" },
      // Friday has its own 09:00 grid
      { day: "FRIDAY", startTime: "09:00", endTime: "09:30" },
      { day: "FRIDAY", startTime: "09:30", endTime: "10:00" },
      { day: "FRIDAY", startTime: "10:00", endTime: "10:30" },
    ];
    const cfg = scheduleConfigFromTimetable(entries);
    // 3 distinct day signatures -> 3 blocks (Mon/Tue/Thu, Wed, Fri)
    expect(cfg.length).toBe(3);
    const blockOf = (d: string) => cfg.find((b) => b.days.includes(d as never))!;
    expect(blockOf("MONDAY").days).toEqual(["MONDAY", "TUESDAY", "THURSDAY"]);
    expect(blockOf("WEDNESDAY").days).toEqual(["WEDNESDAY"]);
    expect(blockOf("FRIDAY").days).toEqual(["FRIDAY"]);
    // Wednesday's reconstructed periodCount is its distinct start-times (2)
    expect(blockOf("WEDNESDAY").periodCount).toBe(2);
  });

  it("clean uniform grids reconstruct to a single block", () => {
    const cfg = scheduleConfigFromTimetable(baseEntries);
    expect(cfg.length).toBe(1);
  });

  it("schedulesEqual detects structural difference (old 3-block vs clean config)", () => {
    const clean = scheduleConfigFromTimetable(baseEntries);
    const brokenEntries = [
      { day: "MONDAY", startTime: "08:30", endTime: "09:15" },
      { day: "WEDNESDAY", startTime: "09:15", endTime: "10:00" },
    ];
    const broken = scheduleConfigFromTimetable(brokenEntries);
    expect(schedulesEqual(clean, broken)).toBe(false);
  });
});