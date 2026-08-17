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

  const navItems: NavItem[] = useMemo(
    () =>
      teacherNavItems
        .filter((item) => isFormTeacher || item.to !== "/teach/attendance")
        .map((item) => {
          if (!item.children) return item;
          return {
            ...item,
            children: isFormTeacher
              ? item.children
              : item.children.filter((child) => child.to !== "/teach/ca-and-exams/my-class"),
          };
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