import { useMemo } from "react";
import { Navigate, useLocation } from "react-router";
import { AppShell } from "../components/layout";
import type { NavChild, NavItem } from "../components/layout/types";
import { useAuth } from "../contexts/AuthContext";
import { teacherNavItems, teacherSettingsItem } from "../components/layout/nav/teacherNav";
import { useMyFormClass } from "../features/teacher/api/useMyFormClass";

export const TeacherLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { data: formClassInfo } = useMyFormClass(user?.id ?? "");
  const isFormTeacher = !!formClassInfo?.formClassId;

  // The teach area is for teachers only — keep admins/principals out even if
  // they type a /teach URL directly.
  const role = user?.role?.toLowerCase() ?? "";
  if (role === "principal" || role === "school_admin" || role === "bursar") {
    return <Navigate to="/admin" replace />;
  }

  const navItems: NavItem[] = useMemo(
    () =>
      teacherNavItems
        .filter((item) => isFormTeacher || item.to !== "/teach/attendance")
        .map((item) => {
          if (!item.children) return item;
          if (isFormTeacher) return item;

          // Subject teachers (no form class) don't broadcast or review their
          // own class — drop those destinations entirely.
          const remaining = item.children.filter(
            (child) =>
              child.to !== "/teach/ca-and-exams/my-class" &&
              child.to !== "/teach/ca-and-exams/broadcast",
          );

          // Collapse into a plain link when only one destination is left.
          if (remaining.length <= 1 && remaining[0]) {
            return { label: item.label, to: remaining[0].to, Icon: item.Icon };
          }
          return { ...item, children: remaining };
        }),
    [isFormTeacher],
  );

  const isLocked =
    user?.role?.toLowerCase() === "teacher" &&
    (user?.approvalStatus === "PENDING" || user?.approvalStatus === "REJECTED");
  if (isLocked && location.pathname !== "/teach") {
    return <Navigate to="/teach" replace />;
  }

  const isChildActive = (children: NavChild[]) => {
    if (children.some((child) => child.to.startsWith("/teach/ca-and-exams"))) {
      return location.pathname.startsWith("/teach/ca-and-exams");
    }
    return children.some((child) => location.pathname.startsWith(child.to));
  };

  return (
    <AppShell
      nav={[{ items: navItems }]}
      settings={teacherSettingsItem}
      disabled={isLocked}
      autoExpandActive
      isChildActive={isChildActive}
    />
  );
};