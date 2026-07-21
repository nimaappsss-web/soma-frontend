import { cn } from "@/lib/utils";
import { AlertCircle, X } from "lucide-react";

interface ErrorMessageProps {
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  action?: React.ReactNode;
}

export const ErrorMessage = ({ children, onDismiss, className, action }: ErrorMessageProps) => {
  if (!children) return null;

  return (
    <div
      className={cn(
        "rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="flex-1">{children}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-full p-0.5 hover:bg-red-500/20 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
