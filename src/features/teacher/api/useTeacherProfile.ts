import { useAuth } from "../../../contexts/AuthContext";
import { useMyFormClass } from "./useMyFormClass";
import { useMyAssignments } from "./useMyAssignments";
import type { SubjectAssignment } from "../types";

interface TeacherProfile {
  formClass: string | null;
  name: string;
  email: string;
  schoolName: string;
  role: string;
  assignments: SubjectAssignment[];
  isLoading: boolean;
  error: Error | null;
}

const toFormClassString = (fc: unknown): string | null => {
  if (!fc) return null;
  if (typeof fc === "string") return fc;
  if (typeof fc === "object" && fc !== null && "name" in fc)
    return String((fc as { name: unknown }).name);
  return null;
};

export const useTeacherProfile = (): TeacherProfile => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const formClassQuery = useMyFormClass(userId);
  const assignmentsQuery = useMyAssignments(userId);

  const isLoading = formClassQuery.isLoading || assignmentsQuery.isLoading;
  const error = formClassQuery.error ?? assignmentsQuery.error;

  return {
    formClass:
      toFormClassString(formClassQuery.data) ??
      toFormClassString(user?.formClass),
    name: user?.name ?? "",
    email: user?.email ?? "",
    schoolName: user?.schoolName ?? "",
    role: user?.role ?? "",
    assignments: assignmentsQuery.data ?? [],
    isLoading,
    error,
  };
};
