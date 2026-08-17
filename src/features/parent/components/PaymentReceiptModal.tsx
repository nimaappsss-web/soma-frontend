import { TickCircle, Copy } from "iconsax-react";

import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { formatNaira } from "../../finance/utils/currency";
import { useClipboard } from "../../../hooks/useClipboard";
import type { Payment } from "../../finance/types";

interface Props {
  payment: Payment;
  childName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const methodLabel: Record<Payment["method"], string> = {
  TRANSFER: "Transfer",
  CASH: "Cash",
  POS: "POS",
  ONLINE: "Online",
};

export const PaymentReceiptModal = ({ payment, childName, open, onOpenChange }: Props) => {
  const { copy, copied } = useClipboard();

  const rows = [
    { label: "Student", value: payment.studentName || childName },
    ...(payment.admissionNo ? [{ label: "Admission No", value: payment.admissionNo }] : []),
    { label: "Fee", value: payment.invoiceAmount !== undefined ? formatNaira(payment.invoiceAmount) : "—" },
    { label: "Amount paid", value: formatNaira(payment.amount) },
    { label: "Method", value: methodLabel[payment.method] },
    ...(payment.reference ? [{ label: "Transaction ID", value: payment.reference }] : []),
    {
      label: "Confirmed",
      value: payment.confirmedAt
        ? new Date(payment.confirmedAt).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
        : "—",
    },
    { label: "Receipt No", value: payment.id.toUpperCase().slice(0, 10) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="center" className="md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
          <DialogDescription>Your payment has been confirmed by the school.</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <TickCircle size={20} variant="Bold" color="#34A853" />
              </div>
              <p className="text-sm font-semibold text-springgreen600">Confirmed</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Paid</p>
              <p className="text-2xl font-bold text-gray900">{formatNaira(payment.amount)}</p>
            </div>

            <div className="h-px bg-gray-100 my-4" />

            <div className="space-y-2.5">
              {rows.map((r) => (
                <div key={r.label} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-gray-400 shrink-0">{r.label}</span>
                  <span className="text-gray900 font-medium text-right break-all">{r.value}</span>
                </div>
              ))}
            </div>

            {payment.reference && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full w-full mt-5"
                onClick={() => payment.reference && copy(payment.reference)}
              >
                <Copy size={14} color={copied ? "#34A853" : "#8C8C8C"} />
                {copied ? "Transaction ID copied" : "Copy transaction ID"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};