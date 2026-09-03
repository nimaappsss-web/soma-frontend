import { z } from "zod";

const phoneRegex = /^\+?(0[789][01]\d{8}|234[789][01]\d{8}|[789][01]\d{8})$/;

const contactRules = (data: {
  parentPhone?: unknown;
  parentEmail?: unknown;
}, ctx: z.RefinementCtx) => {
  const phone = String(data.parentPhone ?? "").trim();
  const email = String(data.parentEmail ?? "").trim();

  // A parent must be reachable: require a phone when no email is provided.
  if (!email && !phone) {
    ctx.addIssue({
      code: "custom",
      path: ["parentPhone"],
      message: "A parent phone or email is required so the parent can be reached.",
    });
  }

  // Validate phone format (Nigerian) when provided.
  if (phone && !phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
    ctx.addIssue({
      code: "custom",
      path: ["parentPhone"],
      message: "Invalid phone number. Use a valid Nigerian number (e.g. 08123456789 or +2348123456789).",
    });
  }
};

const contactShape = {
  parentPhone: z.string().optional().or(z.literal("")),
  parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
} as const;

export const createStudentSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    gender: z.enum(["M", "F"]).optional().or(z.literal("")),
    dateOfBirth: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    parentName: z.string().optional().or(z.literal("")),
    ...contactShape,
  })
  .superRefine(contactRules);

export type CreateStudentFormData = z.infer<typeof createStudentSchema>;

export const editStudentSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    gender: z.enum(["M", "F"]).optional().or(z.literal("")),
    dateOfBirth: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    parentName: z.string().optional().or(z.literal("")),
    ...contactShape,
    status: z.enum(["ACTIVE", "TRANSFERRED", "WITHDRAWN", "GRADUATED"]).optional(),
    classId: z.string().min(1, "Class is required"),
  })
  .superRefine(contactRules);

export type EditStudentFormData = z.infer<typeof editStudentSchema>;
