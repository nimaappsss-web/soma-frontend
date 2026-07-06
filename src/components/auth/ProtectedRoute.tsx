import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "../../contexts/AuthContext";

const COMPLETE_REGISTRATION_PATH = "/complete-registration";
const ONBOARDING_PATH = "/onboarding";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isLoading, needsRegistration } = useAuth();
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

  if (user) {
    if (!user.emailVerified && location.pathname !== ONBOARDING_PATH) {
      return <Navigate to={`${ONBOARDING_PATH}?step=2`} replace />;
    }
    if (!user.schoolId && location.pathname !== ONBOARDING_PATH) {
      return <Navigate to={`${ONBOARDING_PATH}?step=3`} replace />;
    }
  }

  return <>{children}</>;
};
