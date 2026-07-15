import { z } from "zod";

export const principalFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const schoolFormSchema = z.object({
  name: z.string().min(2, "School name is required"),
  state: z.string().min(1, "State is required"),
  lga: z.string().min(1, "LGA is required"),
  schoolType: z.array(z.enum(["creche", "kg", "primary", "secondary"])).min(1, "School type is required"),
  address: z.string().optional(),
  schoolCode: z
    .string()
    .max(10, "School code must be at most 10 characters")
    .regex(/^[A-Z0-9]*$/, "Only letters and numbers allowed")
    .optional()
    .or(z.literal("")),
  arms: z.string().optional().or(z.literal("")),
});

export const loginPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSendOTPSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const loginVerifyOTPSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const completeRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type PrincipalFormData = z.infer<typeof principalFormSchema>;
export type SchoolFormData = z.infer<typeof schoolFormSchema>;
export type LoginPasswordFormData = z.infer<typeof loginPasswordSchema>;
export type LoginSendOTPFormData = z.infer<typeof loginSendOTPSchema>;
export type LoginVerifyOTPFormData = z.infer<typeof loginVerifyOTPSchema>;
export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type CompleteRegistrationFormData = z.infer<typeof completeRegistrationSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
