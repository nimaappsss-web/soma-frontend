import { useState } from "react";
import { CardAdd, Card, Add, Clock } from "iconsax-react";

import { cn } from "@/lib/utils";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { MoneyInput } from "./MoneyInput";
import { usePayments, useRecordPayment, useInvoices } from "../api";
import { formatNaira } from "../utils/currency";
import type { PaymentMethod, PaymentStatus, RecordPaymentPayload } from "../types";

const methodOptions: { value: PaymentMethod; label: string }[] = [
  { value: "TRANSFER", label: "Transfer" },
  { value: "CASH", label: "Cash" },
  { value: "POS", label: "POS" },
  { value: "ONLINE", label: "Online" },
];

const methodLabel: Record<PaymentMethod, string> = {
  TRANSFER: "Transfer",
  CASH: "Cash",
  POS: "POS",
  ONLINE: "Online",
};

const statusOptions: { value: PaymentStatus; label: string }[] = [
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PENDING", label: "Waiting" },
  { value: "REJECTED", label: "Not accepted" },
];

const statusStyles: Record<PaymentStatus, string> = {
  CONFIRMED: "bg-green-50 text-green-600",
  PENDING: "bg-blue-50 text-azure500",
  REJECTED: "bg-red-50 text-red-500",
};

const statusLabel: Record<PaymentStatus, string> = {
  CONFIRMED: "Confirmed",
  PENDING: "Waiting for school",
  REJECTED: "Not accepted",
};

const initialForm: RecordPaymentPayload = {
  invoiceId: "",
  studentId: "",
  amount: 0,
  method: "TRANSFER",
  reference: "",
};

export const PaymentsTab = () => {
  const [status, setStatus] = useState("");
  const { data, isLoading } = usePayments({ limit: 50, status: (status || undefined) as PaymentStatus | undefined });
  const { data: invoicesData } = useInvoices({ limit: 100 });
  const recordMutation = useRecordPayment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<RecordPaymentPayload>(initialForm);

  const payments = data?.payments ?? [];
  const invoices = (invoicesData?.invoices ?? []).filter((i) => i.status !== "PAID");

  const invoiceOptions = invoices.map((i) => ({
    value: i.id,
    label: `${i.studentName} — ${i.feeName ?? "Fee"}`,
  }));

  const set = (patch: Partial<RecordPaymentPayload>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    if (!form.invoiceId || form.amount <= 0) return;
    const invoice = invoices.find((i) => i.id === form.invoiceId);
    recordMutation.mutate(
      { ...form, studentId: invoice?.studentId ?? form.studentId, reference: form.reference || undefined },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setForm(initialForm);
        },
      },
    );
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <SelectDropdown
          options={statusOptions}
          value={status}
          onChange={setStatus}
          placeholder="Filter by status"
          buttonClassName="min-w-[180px]"
        />
        <Button onClick={() => setDialogOpen(true)}>
          <Add size={15} color="#FFFFFF" />
          Record Payment
        </Button>
      </div>

      {!isLoading && payments.length === 0 ? (
        <EmptyState
          icon={<Card color="#0D0D0D" />}
          title={status ? "No payments with this status" : "No payments yet"}
          description={
            status
              ? "Try a different status filter."
              : "Record a payment when a parent pays a fee."
          }
          actionLabel={status ? undefined : "Record Payment"}
          onAction={status ? undefined : () => setDialogOpen(true)}
          actionIcon={<Add size={15} />}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  {p.status === "PENDING" ? (
                    <Clock size={16} variant="Bold" color="#4285F4" />
                  ) : (
                    <CardAdd size={16} variant="Bold" color="#0D0D0D" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray900 truncate">{p.studentName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {new Date(p.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}
                    {methodLabel[p.method]}
                    {p.reference ? ` · Ref: ${p.reference}` : ""}
                  </p>
                  {p.status === "REJECTED" && p.rejectedReason && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">{p.rejectedReason}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", statusStyles[p.status])}>
                  {statusLabel[p.status]}
                </span>
                <p className="text-sm font-semibold text-gray900 w-24 text-right">{formatNaira(p.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent variant="center" className="md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment a parent made toward an invoice.</DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray900">Invoice</p>
              <SelectDropdown
                options={invoiceOptions}
                value={form.invoiceId}
                onChange={(val) => {
                  const invoice = invoices.find((i) => i.id === val);
                  set({ invoiceId: val, studentId: invoice?.studentId ?? "" });
                }}
                placeholder="Select student invoice"
                searchable
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray900">Amount (₦)</p>
              <MoneyInput
                value={form.amount}
                onChange={(amount) => set({ amount })}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray900">Method</p>
              <SelectDropdown
                options={methodOptions}
                value={form.method}
                onChange={(val) => set({ method: val as PaymentMethod })}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray900">Reference (optional)</p>
              <Input
                type="text"
                placeholder="e.g. transfer reference"
                value={form.reference ?? ""}
                onChange={(e) => set({ reference: e.target.value })}
              />
            </div>

            <Button className="w-full rounded-full" onClick={handleSubmit} disabled={recordMutation.isPending}>
              {recordMutation.isPending ? "Recording…" : "Record Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};