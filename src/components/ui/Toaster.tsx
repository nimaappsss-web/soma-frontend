import { TickCircle, CloseCircle } from "iconsax-react";

import { cn } from "@/lib/utils";
import { useToasts, type ToastType } from "@/utils/toast";

const STYLES: Record<ToastType, { icon: typeof TickCircle; color: string; bg: string }> = {
  success: { icon: TickCircle, color: "#34A853", bg: "bg-green-50" },
  error: { icon: CloseCircle, color: "#CD432F", bg: "bg-red-50" },
};

const ToastItem = ({ id, type, message, leaving }: { id: number; type: ToastType; message: string; leaving?: boolean }) => {
  const style = STYLES[type];
  const Icon = style.icon;

  return (
    <div
      key={id}
      role="status"
      className={cn(
        "flex items-center gap-3 rounded-full border border-gray-100 bg-white py-2 pl-2 pr-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out",
        leaving ? "translate-x-6 opacity-0" : "translate-x-0 opacity-100",
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", style.bg)}>
        <Icon size={18} variant="Bold" color={style.color} />
      </div>
      <p className="text-sm font-medium text-gray-900 leading-snug">{message}</p>
    </div>
  );
};

export const Toaster = () => {
  const toasts = useToasts();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
};