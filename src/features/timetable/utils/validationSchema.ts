import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const daySchema = z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);

// Step 1 — Schedule (title + Days & Periods configuration blocks)
export const scheduleBreakSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, "Label is required"),
  startTime: z.string().regex(timeRegex, "Invalid break start time"),
  durationMinutes: z.number().int().min(5, "At least 5 minutes").max(180, "At most 180 minutes"),
});

export const scheduleBlockSchema = z
  .object({
    id: z.string().min(1),
    days: z.array(daySchema).min(1, "Pick at least one day"),
    periodCount: z.number().int().min(1, "At least 1 period").max(12, "At most 12 periods"),
    startTime: z.string().regex(timeRegex, "Invalid start time"),
    endTime: z.string().regex(timeRegex, "Invalid end time"),
    breaks: z.array(scheduleBreakSchema).optional(),
    periods: z.array(z.object({ startTime: z.string(), endTime: z.string() })),
  })
  .refine((b) => b.periods.length === b.periodCount, {
    message: "Periods must be regenerated for the chosen count",
  });

export const scheduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  schedule: z.array(scheduleBlockSchema).min(1, "Add at least one configuration"),
});

// Step 2 — Subjects (selection + targets + double periods)
export const subjectsSchema = z.object({
  selectedSubjects: z.array(z.string()).min(1, "Select at least one subject"),
  targets: z.record(z.string(), z.number().int().min(0).max(20)).optional(),
  doublePeriods: z
    .array(
      z.object({
        subjectId: z.string().min(1),
        days: z.array(daySchema).min(1, "Pick at least one day"),
      }),
    )
    .optional(),
});

// Legacy flat payload (used by publish)
export const breakSchema = z.object({
  day: daySchema,
  label: z.string().min(1),
  start: z.string().regex(timeRegex),
  end: z.string().regex(timeRegex),
});

export const publishPayloadSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1),
  breaks: z.array(breakSchema),
  entries: z
    .array(
      z.object({
        subjectId: z.string().min(1),
        day: daySchema,
        period: z.number().int().min(1).max(12),
        startTime: z.string().regex(timeRegex),
        endTime: z.string().regex(timeRegex),
      }),
    )
    .min(1, "Add at least one entry"),
});

export type PublishPayloadInput = z.infer<typeof publishPayloadSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type SubjectsInput = z.infer<typeof subjectsSchema>;