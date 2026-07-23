import type { User } from "../types";

function normalizeRole(role: string): string {
  return role?.toLowerCase() ?? "";
}

export function getPostAuthPath(user: User): string {
  if (user.emailVerified === false) return "/onboarding";
  if (user.hasSchool === false) return "/admin";

  switch (normalizeRole(user.role)) {
    case "principal": return "/admin";
    case "teacher": return "/teach";
    case "parent": return "/parent";
    case "staff": return "/staff";
    default: return "/admin";
  }
}

export function isFullyRegistered(user: User): boolean {
  return user.emailVerified !== false;
}

export function getRoleDashboard(role: string): string {
  switch (normalizeRole(role)) {
    case "principal": return "/admin";
    case "teacher": return "/teach";
    case "parent": return "/parent";
    case "staff": return "/staff";
    default: return "/admin";
  }
}
