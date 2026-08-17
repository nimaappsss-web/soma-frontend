import { useState } from "react";
import { Clock, TickCircle, CloseCircle } from "iconsax-react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { MoneyInput } from "./MoneyInput";
import { usePayments, useConfirmPayment, useRejectPayment } from "../api";
import { formatNaira } from "../utils/currency";
import type { Payment } from "../types";

export const PendingVerificationTab = () => {
  const { data, isLoading } = usePayments({ status: "PENDING", limit: 100 });
  const confirmMutation = useConfirmPayment();
  const rejectMutation = useRejectPayment();

  const [selected, setSelected] = useState<Payment | null>(null);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"confirm" | "reject">("confirm");

  const pending = data?.payments ?? [];
  const invoiceTotal = selected?.invoiceAmount ?? 0;
  const remainingAfter = selected ? Math.max(0, invoiceTotal - (selected.amount ?? 0)) : 0;

  const openConfirm = (p: Payment) => {
    setSelected(p);
    setAmount(p.amount ?? 0);
    setReason("");
    setMode("confirm");
  };

  const openReject = (p: Payment) => {
    setSelected(p);
    setReason("");
    setMode("reject");
  };

  const close = () => {
    setSelected(null);
    setReason("");
  };

  const handleConfirm = () => {
    if (!selected) return;
    confirmMutation.mutate(
      { id: selected.id, amount: amount || undefined },
      { onSuccess: close },
    );
  };

  const handleReject = () => {
    if (!selected || !reason.trim()) return;
    rejectMutation.mutate({ id: selected.id, reason: reason.trim() }, { onSuccess: close });
  };

  const amountClamped = selected && amount > invoiceTotal;

  return (
    <div>
      <p className="text-sm text-gray-400 mb-5">
        Payments parents submitted are waiting for your confirmation.
      </p>

      {!isLoading && pending.length === 0 ? (
        <EmptyState
          icon={<Clock color="#0D0D0D" />}
          title="Nothing waiting for verification"
          description="Payments parents submit will appear here for you to confirm or decline."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {pending.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Clock size={16} variant="Bold" color="#4285F4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray900 truncate">{p.studentName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {p.admissionNo} · submitted {p.submittedAt ? new Date(p.submittedAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""}
                    {p.reference ? ` · Ref: ${p.reference}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-sm font-semibold text-gray900 mr-2">{formatNaira(p.amount)}</p>
                <Button variant="outline" size="sm" className="rounded-full px-3" onClick={() => openReject(p)}>
                  <CloseCircle size={14} color="#CD432F" />
                  Decline
                </Button>
                <Button size="sm" className="rounded-full px-3" onClick={() => openConfirm(p)}>
                  <TickCircle size={14} color="#FFFFFF" />
                  Confirm
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && close()}>
        <DialogContent variant="center" className="md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "confirm" ? "Confirm Payment" : "Decline Payment"}</DialogTitle>
            <DialogDescription>
              {mode === "confirm"
                ? `Verify the transfer for ${selected?.studentName}.`
                : `Tell the parent why this payment isn't accepted.`}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {mode === "confirm" && selected && (
              <>
                <div className="rounded-xl bg-gray-50 py-4 pr-4 pl-2">
                  <p className="text-sm font-medium text-gray-500">Transaction reference</p>
                  <p className="text-xl font-bold text-gray900 mt-1 break-all">{selected.reference || "—"}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray900">Amount (₦)</p>
                  <MoneyInput
                    value={amount}
                    onChange={setAmount}
                  />
                  <p className="text-xs text-gray-400">
                    Fee on invoice: <span className="text-gray900 font-medium">{formatNaira(invoiceTotal)}</span>
                    {remainingAfter > 0 && (
                      <>
                        {" · "}Left after this payment:{" "}
                        <span className="text-gray900 font-medium">{formatNaira(remainingAfter)}</span>
                      </>
                    )}
                  </p>
                  {amountClamped && (
                    <p className="text-xs text-amber-600">
                      This is more than the fee of {formatNaira(invoiceTotal)} — we'll only record {formatNaira(invoiceTotal)}.
                    </p>
                  )}
                </div>

                <Button
                  className="w-full rounded-full"
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending || amount <= 0}
                >
                  {confirmMutation.isPending ? "Confirming…" : "Confirm Payment"}
                </Button>
              </>
            )}

            {mode === "reject" && (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-gray900">Reason</p>
                  <Input
                    type="text"
                    placeholder="e.g. Reference not found, wrong amount"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <Button
                  variant="default"
                  className="w-full rounded-full"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !reason.trim()}
                >
                  {rejectMutation.isPending ? "Declining…" : "Decline Payment"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};