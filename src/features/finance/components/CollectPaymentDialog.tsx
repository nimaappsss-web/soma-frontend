import { useMemo, useState } from "react";
import { ArrowLeft2, SearchNormal1, TickCircle } from "iconsax-react";

import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { SelectDropdown, type SelectOption } from "../../../components/ui/select-dropdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { MoneyInput } from "./MoneyInput";
import { useAllStudents } from "../../students/api";
import { useInvoices } from "../api/useInvoices";
import { usePayments } from "../api/usePayments";
import { useRecordPayment } from "../api/useRecordPayment";
import { formatNaira } from "../utils/currency";
import type { PaymentMethod } from "../types";

type Step = "student" | "invoice" | "pay" | "done";

const methodOptions: SelectOption[] = [
  { value: "CASH", label: "Cash" },
  { value: "POS", label: "POS" },
  { value: "TRANSFER", label: "Transfer" },
];

const methodLabel: Record<PaymentMethod, string> = {
  CASH: "Cash",
  POS: "POS",
  TRANSFER: "Transfer",
  ONLINE: "Online",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CollectPaymentDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const { data: students, isLoading: studentsLoading } = useAllStudents(userId);

  const [step, setStep] = useState<Step>("student");
  const [search, setSearch] = useState("");
  const [student, setStudent] = useState<{
    id: string;
    name: string;
    admissionNo?: string;
  } | null>(null);
  const [invoice, setInvoice] = useState<{
    id: string;
    feeName?: string;
    amount: number;
    outstanding: number;
  } | null>(null);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");

  const recordMutation = useRecordPayment();

  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({
    studentId: student?.id,
    limit: 100,
  });
  const { data: paymentsData } = usePayments({ studentId: student?.id, limit: 200 });

  const outstandingInvoices = useMemo(() => {
    if (!invoicesData) return [];
    const confirmed = (paymentsData?.payments ?? []).filter((p) => p.status === "CONFIRMED");
    return (invoicesData.invoices ?? [])
      .filter((i) => i.status !== "PAID")
      .map((i) => {
        const paid = confirmed
          .filter((p) => p.invoiceId === i.id)
          .reduce((sum, p) => sum + (p.amount ?? 0), 0);
        return {
          id: i.id,
          feeName: i.feeName ?? "School fees",
          amount: i.amount,
          outstanding: Math.max(0, i.amount - paid),
        };
      })
      .filter((i) => i.outstanding > 0)
      .sort((a, b) => a.outstanding - b.outstanding);
  }, [invoicesData, paymentsData]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (students ?? []).filter((s) => s.status === "ACTIVE");
    if (!term) return list.slice(0, 30);
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.admissionNo ?? "").toLowerCase().includes(term),
    );
  }, [students, search]);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("student");
      setSearch("");
      setStudent(null);
      setInvoice(null);
      setAmount(0);
      setMethod("CASH");
      setReference("");
    }, 200);
  };

  const pickStudent = (s: { id: string; name: string; admissionNo?: string }) => {
    setStudent(s);
    setStep("invoice");
  };

  const pickInvoice = (i: { id: string; feeName?: string; amount: number; outstanding: number }) => {
    setInvoice(i);
    setAmount(i.outstanding);
    setStep("pay");
  };

  const amountClamped = invoice ? amount > invoice.outstanding : false;
  const sendAmount = invoice ? Math.min(amount || 0, invoice.outstanding) : 0;

  const handleConfirm = () => {
    if (!student || !invoice || sendAmount <= 0) return;
    recordMutation.mutate(
      {
        invoiceId: invoice.id,
        studentId: student.id,
        amount: sendAmount,
        method,
        reference: reference.trim() || undefined,
      },
      { onSuccess: () => setStep("done") },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent variant="center" className="md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "done"
              ? "Payment recorded"
              : step === "student"
                ? "Collect payment"
                : step === "invoice"
                  ? `Fees for ${student?.name ?? ""}`
                  : "Confirm payment"}
          </DialogTitle>
          <DialogDescription>
            {step === "done"
              ? "The receipt has been issued and the parent notified."
              : step === "student"
                ? "Search for the student paying. Cash, POS, or transfer — confirmed on the spot."
                : step === "invoice"
                  ? "Choose what this payment is for."
                  : "Check everything before confirming."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {step === "student" && (
            <div className="space-y-3">
              <div className="relative">
                <SearchNormal1
                  size={16}
                  color="#8C8C8C"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                />
                <Input
                  type="text"
                  placeholder="Search name or admission no."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {studentsLoading ? (
                <div className="py-6">
                  <SomaLoader label="Loading students" className="h-8 w-8" descriptions={["Finding your students…", "Almost there…"]} />
                </div>
              ) : filteredStudents.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  {search ? "No student matches your search." : "No active students yet."}
                </p>
              ) : (
                <div className="max-h-[40vh] overflow-y-auto divide-y divide-gray-50">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => pickStudent({ id: s.id, name: s.name, admissionNo: s.admissionNo })}
                      className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray900 text-sm font-medium text-white">
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray900">{s.name}</span>
                        {s.admissionNo && (
                          <span className="block text-xs text-gray-400">{s.admissionNo}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "invoice" && (
            <div className="space-y-3">
              {invoicesLoading ? (
                <div className="py-6">
                  <SomaLoader label="Loading fees" className="h-8 w-8" descriptions={["Pulling your child's fee breakdown…", "Almost there…"]} />
                </div>
              ) : outstandingInvoices.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm font-medium text-gray900">No outstanding fees</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {student?.name} has no unpaid invoices for this session.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {outstandingInvoices.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => pickInvoice(i)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left transition-colors hover:border-gray-200 hover:bg-gray-50 active:bg-gray-100"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray900">{i.feeName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Fee: {formatNaira(i.amount)} · Outstanding: {formatNaira(i.outstanding)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray900 px-3 py-1 text-xs font-medium text-white">
                        {formatNaira(i.outstanding)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <Button variant="ghost" className="w-full rounded-full" onClick={() => setStep("student")}>
                <ArrowLeft2 size={14} color="#0D0D0D" />
                Choose a different student
              </Button>
            </div>
          )}

          {step === "pay" && invoice && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Student</span>
                  <span className="text-gray900 font-medium">{student?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Fee</span>
                  <span className="text-gray900 font-medium">{invoice.feeName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Outstanding</span>
                  <span className="text-gray900 font-semibold">{formatNaira(invoice.outstanding)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray900">Amount received (₦)</p>
                <MoneyInput value={amount} onChange={setAmount} autoFocus />
                {amountClamped && (
                  <p className="text-xs text-amber-600">
                    This is more than the outstanding fee — we'll record {formatNaira(sendAmount)}.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray900">Method</p>
                <SelectDropdown
                  options={methodOptions}
                  value={method}
                  onChange={(val) => setMethod(val as PaymentMethod)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray900">Reference (optional)</p>
                <Input
                  type="text"
                  placeholder="e.g. transfer reference or POS receipt no."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              <Button
                className="w-full rounded-full"
                onClick={handleConfirm}
                disabled={recordMutation.isPending || sendAmount <= 0}
              >
                {recordMutation.isPending ? "Recording…" : `Confirm ${methodLabel[method]} of ${formatNaira(sendAmount)}`}
              </Button>
              <Button variant="ghost" className="w-full rounded-full" onClick={() => setStep("invoice")}>
                <ArrowLeft2 size={14} color="#0D0D0D" />
                Back
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <TickCircle size={28} variant="Bold" color="#34A853" />
                </div>
                <p className="text-sm font-medium text-gray900">
                  {formatNaira(sendAmount)} recorded for {student?.name}.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Receipt issued and the parent has been notified.
                </p>
              </div>
              <Button className="w-full rounded-full" onClick={close}>
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};