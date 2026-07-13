import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  level: z.string().min(1, "Level is required"),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional().or(z.literal("")),
});

export const inviteTeacherSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const schoolUpdateSchema = z.object({
  name: z.string().min(2, "School name is required"),
  admissionPattern: z.string().optional().or(z.literal("")),
  state: z.string().min(1, "State is required"),
  lga: z.string().min(1, "LGA is required"),
  schoolType: z.string().min(1, "School type is required"),
  address: z.string().optional().or(z.literal("")),
  arms: z.string().optional().or(z.literal("")),
});

export type CreateClassFormData = z.infer<typeof createClassSchema>;
export type CreateSubjectFormData = z.infer<typeof createSubjectSchema>;
export type InviteTeacherFormData = z.infer<typeof inviteTeacherSchema>;
export type SchoolUpdateFormData = z.infer<typeof schoolUpdateSchema>;
