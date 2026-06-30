import { AlertCircle } from "lucide-react";
import React from "react";
import clsx from "clsx";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  iconClassName?: string;
  messageClassName?: string;
  buttonClassName?: string;
  icon?: React.ReactNode;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Failed to load data. Please try again.",
  onRetry,
  className,
  iconClassName,
  messageClassName,
  buttonClassName,
  icon,
}) => {
  return (
    <div
      className={clsx(
        "flex items-center justify-center w-full bg-white-3 mt-4 rounded-[15px]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 items-center justify-center max-w-md">
        {icon ? (
          <div
            className={clsx("flex items-center justify-center", iconClassName)}
          >
            {icon}
          </div>
        ) : (
          <div
            className={clsx("p-3 bg-red-500/10 rounded-full", iconClassName)}
          >
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        )}
        <p
          className={clsx("text-center text-gray-4 text-sm", messageClassName)}
        >
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={clsx(
              "px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 text-sm font-medium",
              buttonClassName,
            )}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
