import { z } from "zod";

export const editTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  formClassId: z.string().optional(),
});

export type EditTeacherFormData = z.infer<typeof editTeacherSchema>;
