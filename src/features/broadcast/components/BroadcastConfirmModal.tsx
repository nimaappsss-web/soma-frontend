import { type ReactNode } from "react";
import { InfoCircle } from "iconsax-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface BroadcastConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  eyebrow?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  busyLabel?: string;
  onConfirm: () => void;
  confirmVariant?: "default" | "outline" | "success";
}

export const BroadcastConfirmModal = ({
  open,
  onOpenChange,
  title,
  eyebrow,
  children,
  confirmLabel,
  busy,
  busyLabel,
  onConfirm,
  confirmVariant = "default",
}: BroadcastConfirmModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        {eyebrow && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray400">
            {eyebrow}
          </div>
        )}
        <DialogTitle className="pr-10 text-xl pt-1">{title}</DialogTitle>
        <DialogDescription className="pt-1 text-sm leading-relaxed text-gray500">
          {children}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-wrap items-center gap-2 px-6 pb-6 md:pb-0">
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant={confirmVariant}
          disabled={busy}
          onClick={() => {
            onConfirm();
          }}
        >
          {busy ? busyLabel ?? "Working…" : confirmLabel}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export const BroadcastNote = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start gap-2.5 rounded-xl border border-amber500/30 bg-amber500/5 px-3.5 py-3">
    <InfoCircle size={16} variant="Bold" color="#F59E0B" className="shrink-0 mt-0.5" />
    <p className="text-sm text-gray600">{children}</p>
  </div>
);