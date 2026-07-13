import { type ReactNode } from "react";
import { Navigate } from "react-router";

import { useAuth } from "../../../contexts/AuthContext";
import { getPostAuthPath, isFullyRegistered } from "../utils/routing";

export const OnboardingRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (isAuthenticated && user && isFullyRegistered(user)) {
    return <Navigate to={getPostAuthPath(user)} replace />;
  }

  return <>{children}</>;
};
