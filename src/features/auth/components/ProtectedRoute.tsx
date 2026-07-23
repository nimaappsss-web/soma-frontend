import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "../../../contexts/AuthContext";
import { getPostAuthPath, isFullyRegistered } from "../utils/routing";

const ONBOARDING_FLOW = ["/onboarding"];

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const currentPath = location.pathname;

  if (!isFullyRegistered(user)) {
    const target = getPostAuthPath(user);
    if (currentPath !== target.split("?")[0]) {
      return <Navigate to={target} replace />;
    }
    return <>{children}</>;
  }

  const rolePaths = ["/admin", "/teach", "/parent", "/staff"];
  if (!rolePaths.includes(currentPath) && !ONBOARDING_FLOW.some((p) => currentPath.startsWith(p))) {
    return <>{children}</>;
  }

  const dashboard = getPostAuthPath(user);
  if (currentPath !== dashboard) {
    return <Navigate to={dashboard} replace />;
  }

  return <>{children}</>;
};
