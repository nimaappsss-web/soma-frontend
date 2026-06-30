"use client";

import { Danger } from "iconsax-react";
import React from "react";

import { useHandleLogout } from "../../hooks/useLogout";

interface ErrorFullScreenProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorFullScreen: React.FC<ErrorFullScreenProps> = ({
  message = "Unable to load user data. Please try again.",
  onRetry,
}) => {
  const { handleLogout } = useHandleLogout();

  return (
    <div className="fixed inset-0 top-[0px] lg:top-[0px] z-[998] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black border border-white/10 rounded-2xl p-6 lg:p-8 max-w-md w-full shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 p-3 bg-red-50 rounded-full">
            <Danger size="48" color="#E03E17" variant="Bold" />
          </div>
          <h2 className="text-xl lg:text-2xl font-semibold text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-sm lg:text-base text-gray-600 mb-6">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition-all centered"
            >
              Try Again
            </button>
          )}
          <button className="text-white mt-4" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
