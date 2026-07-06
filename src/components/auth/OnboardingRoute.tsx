import { type ReactNode } from "react";
import { Navigate } from "react-router";

import { useAuth } from "../../contexts/AuthContext";
import { getPostAuthPath } from "../../features/auth/utils/routing";

export const OnboardingRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (isAuthenticated && user && getPostAuthPath(user) === "/dashboard") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
