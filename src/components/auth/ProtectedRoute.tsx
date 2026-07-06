import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "../../contexts/AuthContext";

const COMPLETE_REGISTRATION_PATH = "/complete-registration";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading, needsRegistration } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (needsRegistration && location.pathname !== COMPLETE_REGISTRATION_PATH) {
    return <Navigate to={COMPLETE_REGISTRATION_PATH} replace />;
  }

  return <>{children}</>;
};
