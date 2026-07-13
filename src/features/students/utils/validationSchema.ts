import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["M", "F"]).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  parentName: z.string().optional().or(z.literal("")),
  parentPhone: z
    .string()
    .optional()
    .or(z.literal("")),
  parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type CreateStudentFormData = z.infer<typeof createStudentSchema>;

export const editStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["M", "F"]).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  parentName: z.string().optional().or(z.literal("")),
  parentPhone: z.string().optional().or(z.literal("")),
  parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "TRANSFERRED", "WITHDRAWN", "GRADUATED"]).optional(),
  classId: z.string().min(1, "Class is required"),
});

export type EditStudentFormData = z.infer<typeof editStudentSchema>;
