import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["HOLIDAY", "EVENT", "EXAM", "MEETING", "SPORTS"]),
  audience: z.enum(["ALL", "TEACHERS", "PARENTS", "STAFF"]),
});

export const createHolidaySchema = z.object({
  date: z.string().min(1, "Date is required"),
  reason: z.string().min(2, "Reason must be at least 2 characters"),
});

export const createAcademicTermSchema = z.object({
  term: z.string().min(1, "Term is required"),
  session: z.string().min(1, "Session is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type CreateHolidayFormData = z.infer<typeof createHolidaySchema>;
export type CreateAcademicTermFormData = z.infer<typeof createAcademicTermSchema>;
