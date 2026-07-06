import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "../../contexts/AuthContext";
import { getPostAuthPath } from "../../features/auth/utils/routing";

const COMPLETE_REGISTRATION_PATH = "/complete-registration";

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

  const target = getPostAuthPath(user);
  if (target !== "/dashboard" && location.pathname !== target.split("?")[0]) {
    return <Navigate to={target} replace />;
  }

  if (target === COMPLETE_REGISTRATION_PATH && location.pathname !== COMPLETE_REGISTRATION_PATH) {
    return <Navigate to={COMPLETE_REGISTRATION_PATH} replace />;
  }

  return <>{children}</>;
};
