import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DuplicateConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  highlight?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  children?: ReactNode;
  className?: string;
}

export const DuplicateConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  highlight,
  confirmLabel = "Add anyway",
  cancelLabel = "Cancel",
  onConfirm,
  children,
  className,
}: DuplicateConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent variant="middle" showClose={false} className={cn("z-[60]", className)}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="px-6 pb-6 space-y-4">
        {children}
        {highlight && <p className="text-xs text-gray500">{highlight}</p>}
        <div className="flex gap-3 pt-2">
          <Button onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            {cancelLabel}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
