import { z } from "zod";
import { SCHOOL_TYPES } from "../../../utils/schoolType";

export const createClassSchema = z.object({
  name: z.string().optional(),
  level: z.string().min(1, "Level is required"),
  arm: z.string().optional().or(z.literal("")),
  schoolType: z.string().optional(),
});

export const updateClassSchema = z.object({
  name: z.string().optional(),
  level: z.string().min(1, "Level is required"),
  arm: z.string().optional().or(z.literal("")),
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
  schoolType: z.array(z.enum(SCHOOL_TYPES)).min(1, "Select at least one school type"),
  address: z.string().optional().or(z.literal("")),
  arms: z.array(z.string()).optional(),
});

export type CreateClassFormData = z.infer<typeof createClassSchema>;
export type UpdateClassFormData = z.infer<typeof updateClassSchema>;
export type CreateSubjectFormData = z.infer<typeof createSubjectSchema>;
export type InviteTeacherFormData = z.infer<typeof inviteTeacherSchema>;
export type SchoolUpdateFormData = z.infer<typeof schoolUpdateSchema>;
