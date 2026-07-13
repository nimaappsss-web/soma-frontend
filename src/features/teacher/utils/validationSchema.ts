import { z } from "zod";

export const editTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  formClassId: z.string().optional(),
});

export type EditTeacherFormData = z.infer<typeof editTeacherSchema>;
