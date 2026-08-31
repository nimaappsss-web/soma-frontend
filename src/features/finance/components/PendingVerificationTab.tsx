import { useState } from "react";
import { Clock, TickCircle, CloseCircle } from "iconsax-react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { CollapsibleCard } from "../../../components/mobile/CollapsibleCard";
import { MoneyInput } from "./MoneyInput";
import { usePayments, useConfirmPayment, useRejectPayment } from "../api";
import { formatNaira } from "../utils/currency";
import type { Payment } from "../types";

export const PendingVerificationTab = () => {
  const { data, isLoading } = usePayments({ status: ["PENDING"], limit: 100 });
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
        <>
          <div className="hidden md:block bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
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

          <div className="md:hidden space-y-3.5">
            {pending.map((p) => (
              <CollapsibleCard
                key={p.id}
                collapsed={
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
                      <Clock size={19} variant="Bold" color="#4285F4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[15px] font-semibold text-gray900 leading-snug truncate">
                          {p.studentName}
                        </p>
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray900 mt-1">
                        {formatNaira(p.amount)}
                      </p>
                    </div>
                  </div>
                }
                expanded={
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400">Admission</p>
                        <p className="text-[13px] font-medium text-gray-700 mt-0.5">
                          {p.admissionNo || "—"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400">Submitted</p>
                        <p className="text-[13px] font-medium text-gray-700 mt-0.5">
                          {p.submittedAt ? new Date(p.submittedAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400">Method</p>
                        <p className="text-[13px] font-medium text-gray-700 mt-0.5">
                          {p.method === "CASH" ? "Cash" : p.method === "POS" ? "POS" : p.method === "ONLINE" ? "Online" : "Transfer"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400">Fee on invoice</p>
                        <p className="text-[13px] font-medium text-gray-700 mt-0.5">
                          {formatNaira(p.invoiceAmount ?? 0)}
                        </p>
                      </div>
                    </div>

                    {p.reference && (
                      <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wider text-gray-400">Reference</p>
                        <p className="text-[13px] font-medium text-gray-700 mt-0.5 break-all leading-snug">
                          {p.reference}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <Button
                        variant="outline"
                        className="h-[46px] rounded-full px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReject(p);
                        }}
                      >
                        <CloseCircle size={16} color="#CD432F" />
                        Decline
                      </Button>
                      <Button
                        className="h-[46px] rounded-full px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfirm(p);
                        }}
                      >
                        <TickCircle size={16} color="#FFFFFF" />
                        Confirm
                      </Button>
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        </>
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