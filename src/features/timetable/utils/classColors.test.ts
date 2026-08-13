import { describe, expect, it } from "vitest";
import { buildClassColorMap, CLASS_COLORS } from "./classColors";
import { distinctClasses, lessonsForDate, lessonsPerClass } from "./timetableDates";
import { to12Hour } from "./todaySchedule";
import type { TimetableEntry } from "../types";

const entry = (id: string, day: string, className = "JSS 3 A"): TimetableEntry => ({
  id,
  className,
  classId: `c-${className}`,
  subjectId: "s1",
  subjectName: "Maths",
  teacherId: "t1",
  teacherName: "Teacher",
  day: day as TimetableEntry["day"],
  period: 1,
  startTime: "08:00",
  endTime: "08:40",
});

describe("classColors", () => {
  it("assigns unique, deterministic swatches by sorted class name", () => {
    const map = buildClassColorMap(["Zebra", "Apple", "Mango"]);
    expect(map.get("Apple")).toBe(CLASS_COLORS[0]);
    expect(map.get("Mango")).toBe(CLASS_COLORS[1]);
    expect(map.get("Zebra")).toBe(CLASS_COLORS[2]);
    // Deterministic across calls.
    const again = buildClassColorMap(["Zebra", "Apple", "Mango"]);
    expect(again.get("Zebra")).toBe(map.get("Zebra"));
  });

  it("dedupes repeated names and ignores empties", () => {
    const map = buildClassColorMap(["A", "A", "", "  ", "B"]);
    expect(map.size).toBe(2);
    expect(map.has("")).toBe(false);
  });

  it("cycles past the palette for many classes without crashing", () => {
    const many = Array.from({ length: CLASS_COLORS.length + 5 }, (_, i) => `C${i}`);
    const map = buildClassColorMap(many);
    expect(map.size).toBe(many.length);
  });
});

describe("timetableDates", () => {
  it("lessonsForDate resolves a weekday date to that weekday's lessons", () => {
    const entries = [entry("1", "MONDAY"), entry("2", "TUESDAY")];
    const monday = new Date(2026, 7, 10); // Monday 10 Aug 2026
    expect(lessonsForDate(entries, monday).map((e) => e.id)).toEqual(["1"]);
  });

  it("lessonsForDate returns [] on weekends", () => {
    const entries = [entry("1", "MONDAY")];
    const saturday = new Date(2026, 7, 15); // Saturday
    expect(lessonsForDate(entries, saturday)).toEqual([]);
  });

  it("distinctClasses keeps first-seen order and dedupes", () => {
    const entries = [entry("1", "MONDAY", "JSS 2"), entry("2", "TUESDAY", "JSS 3"), entry("3", "WEDNESDAY", "JSS 2")];
    expect(distinctClasses(entries)).toEqual(["JSS 2", "JSS 3"]);
  });

  it("lessonsPerClass counts weekly lessons per class", () => {
    const entries = [entry("1", "MONDAY", "JSS 2"), entry("2", "TUESDAY", "JSS 2"), entry("3", "WEDNESDAY", "JSS 3")];
    const counts = lessonsPerClass(entries);
    expect(counts.get("JSS 2")).toBe(2);
    expect(counts.get("JSS 3")).toBe(1);
  });
});

describe("to12Hour", () => {
  it("converts 24-hour to 12-hour with AM/PM", () => {
    expect(to12Hour("08:00")).toBe("8:00 AM");
    expect(to12Hour("13:05")).toBe("1:05 PM");
    expect(to12Hour("00:00")).toBe("12:00 AM");
    expect(to12Hour("12:30")).toBe("12:30 PM");
  });

  it("passes through malformed input", () => {
    expect(to12Hour("")).toBe("");
    expect(to12Hour("nope")).toBe("nope");
  });
});
