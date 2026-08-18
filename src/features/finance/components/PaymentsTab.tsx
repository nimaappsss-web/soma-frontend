import { useState } from "react";
import { CardAdd, Card, Add, Clock } from "iconsax-react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";
import { Button } from "../../../components/ui/button";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { EmptyState } from "../../../components/ui/EmptyState";
import { usePayments } from "../api";
import { formatNaira } from "../utils/currency";
import { CollectPaymentDialog } from "./CollectPaymentDialog";
import type { PaymentMethod, PaymentStatus } from "../types";

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

export const PaymentsTab = () => {
  const [status, setStatus] = useState("");
  const { data, isLoading } = usePayments({ limit: 50, status: (status || undefined) as PaymentStatus | undefined });
  const [collectOpen, setCollectOpen] = useState(false);

  const payments = data?.payments ?? [];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <SelectDropdown
            options={statusOptions}
            value={status}
            onChange={setStatus}
            placeholder="Filter by status"
            buttonClassName="min-w-[180px]"
          />
          <Link
            to="/admin/settings?tab=payments"
            className="text-xs font-medium text-gray-400 hover:text-gray-900"
          >
            Manage bank transfer details
          </Link>
        </div>
        <Button onClick={() => setCollectOpen(true)}>
          <Add size={15} color="#FFFFFF" />
          Collect Payment
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
          actionLabel={status ? undefined : "Collect Payment"}
          onAction={status ? undefined : () => setCollectOpen(true)}
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

      <CollectPaymentDialog open={collectOpen} onOpenChange={setCollectOpen} />
    </div>
  );
};