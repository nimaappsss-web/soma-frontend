import { z } from "zod";

export const createStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  gender: z.enum(["M", "F"], { message: "Gender is required" }),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
});

export type CreateStaffFormData = z.infer<typeof createStaffSchema>;
