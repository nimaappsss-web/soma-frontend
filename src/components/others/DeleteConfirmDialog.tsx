import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmInputPlaceholder: string;
  confirmInputLabel: string;
  confirmInputValue: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmInputPlaceholder,
  confirmInputLabel,
  confirmInputValue,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
}: DeleteConfirmDialogProps) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (open) setInputValue("");
  }, [open]);

  const canConfirm = inputValue.trim() === confirmInputValue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="middle" showClose={false} className="z-[60]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div>
            <p className="text-sm text-gray900 mb-2">{confirmInputLabel}</p>
            <Input
              placeholder={confirmInputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onConfirm}
              disabled={!canConfirm}
              className="flex-1"
              variant={canConfirm ? "default" : "outline"}
            >
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
};
