import type { User } from "../types";

export function getPostAuthPath(user: User): string {
  if (!user.emailVerified) return "/onboarding?step=2";
  if (!user.hasSchool) return "/onboarding?step=3";
  if (user.needsRegistration) return "/complete-registration";
  return "/dashboard";
}
