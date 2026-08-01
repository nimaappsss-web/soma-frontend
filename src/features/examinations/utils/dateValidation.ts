import type { AcademicTerm } from "../../calendar/types";
import type { ExamDateRejection } from "../types";

export interface ExamDateCheck {
  valid: boolean;
  reason: ExamDateRejection | null;
  message: string;
}

const parseLocalDate = (dateStr: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
};

export const isWeekendDate = (dateStr: string): boolean => {
  const d = parseLocalDate(dateStr);
  if (!d) return false;
  const day = d.getDay();
  return day === 0 || day === 6;
};

export const isHolidayDate = (dateStr: string, holidayDates: string[]): boolean =>
  holidayDates.some((h) => h === dateStr);

export const isInTerm = (dateStr: string, terms: AcademicTerm[]): boolean => {
  const d = parseLocalDate(dateStr);
  if (!d) return false;
  return terms.some((t) => {
    const s = parseLocalDate(t.startDate);
    const e = parseLocalDate(t.endDate);
    if (!s || !e) return false;
    return d >= s && d <= e;
  });
};

export const checkExamDate = (
  dateStr: string,
  opts: { holidayDates: string[]; terms: AcademicTerm[] },
): ExamDateCheck => {
  if (!dateStr) return { valid: false, reason: null, message: "Pick a date." };

  if (isWeekendDate(dateStr)) {
    return { valid: false, reason: "WEEKEND", message: "Exams can't be scheduled on weekends." };
  }

  if (isHolidayDate(dateStr, opts.holidayDates)) {
    return { valid: false, reason: "HOLIDAY", message: "That day is a school holiday." };
  }

  if (!isInTerm(dateStr, opts.terms)) {
    return { valid: false, reason: "OUT_OF_TERM", message: "That day is outside the current school terms." };
  }

  return { valid: true, reason: null, message: "" };
};

export const dateReasonMessage = (type: ExamDateRejection | undefined): string | null => {
  switch (type) {
    case "WEEKEND":
      return "This date falls on a weekend — pick a school day.";
    case "HOLIDAY":
      return "This date is a school holiday — pick another day.";
    case "OUT_OF_TERM":
      return "This date is outside the school terms.";
    default:
      return null;
  }
};
