import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "../../../contexts/AuthContext";

const ADMIN_MANAGER_ROLES = ["principal", "school_admin"];

const BURSAR_ALLOWED_PREFIXES = [
  "/admin/finance",
  "/admin/announcements",
  "/admin/settings",
  "/admin/profile",
];

export const AdminRoleRoute = () => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role?.toLowerCase() ?? "";
  const path = location.pathname;

  if (ADMIN_MANAGER_ROLES.includes(role)) {
    return <Outlet />;
  }

  if (role === "bursar") {
    const allowed = BURSAR_ALLOWED_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
    if (!allowed) {
      return <Navigate to="/admin/finance" replace />;
    }
    return <Outlet />;
  }

  return <Navigate to="/login" replace />;
};
