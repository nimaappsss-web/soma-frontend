import { useState } from "react";
import { CardAdd, Card, Add, Clock } from "iconsax-react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";
import { Button } from "../../../components/ui/button";
import { MultiSelect } from "../../../components/ui/multi-select";
import { EmptyState } from "../../../components/ui/EmptyState";
import { CollapsibleCard } from "../../../components/mobile/CollapsibleCard";
import { SomaLoader } from "../../../components/ui/SomaLoader";
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

const paymentsLoadingDescriptions = [
  "Loading your payments…",
  "Checking records…",
  "Almost there…",
];

export const PaymentsTab = () => {
  const [status, setStatus] = useState<string[]>([]);
  const { data, isLoading } = usePayments({ limit: 50, status: status.length > 0 ? status as PaymentStatus[] : undefined });
  const [collectOpen, setCollectOpen] = useState(false);

  const payments = data?.payments ?? [];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <MultiSelect
            options={statusOptions}
            selected={status}
            onChange={setStatus}
            placeholder="Filter by status"
            className="min-w-[180px]"
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

      {isLoading ? (
        <div className="flex min-h-[calc(100dvh-190px)] w-full items-center justify-center rounded-2xl border border-gray100 bg-white px-6 py-14">
          <SomaLoader label="Loading payments" descriptions={paymentsLoadingDescriptions} />
        </div>
      ) : !isLoading && payments.length === 0 ? (
        <EmptyState
          icon={<Card color="#0D0D0D" />}
          title={status.length > 0 ? "No payments with this status" : "No payments yet"}
          description={
            status.length > 0
              ? "Try a different status filter."
              : "Record a payment when a parent pays a fee."
          }
          actionLabel={status.length > 0 ? undefined : "Collect Payment"}
          onAction={status.length > 0 ? undefined : () => setCollectOpen(true)}
          actionIcon={<Add size={15} />}
        />
      ) : (
        <>
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
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

        <div className="md:hidden space-y-3.5">
          {payments.map((p) => (
            <CollapsibleCard
              key={p.id}
              collapsed={
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center shrink-0">
                    {p.status === "PENDING" ? (
                      <Clock size={19} variant="Bold" color="#4285F4" />
                    ) : (
                      <CardAdd size={19} variant="Bold" color="#0D0D0D" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[15px] font-semibold text-gray900 leading-snug truncate">
                        {p.studentName}
                      </p>
                      <span className={cn("shrink-0 text-xs font-medium px-2.5 py-1 rounded-full", statusStyles[p.status])}>
                        {statusLabel[p.status]}
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
                      <p className="text-[11px] uppercase tracking-wider text-gray-400">Date</p>
                      <p className="text-[13px] font-medium text-gray-700 mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-gray-400">Method</p>
                      <p className="text-[13px] font-medium text-gray-700 mt-0.5">
                        {methodLabel[p.method]}
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

                  {p.status === "REJECTED" && p.rejectedReason && (
                    <div className="rounded-lg bg-red-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-red-400">Reason not accepted</p>
                      <p className="text-[13px] font-medium text-red-600 mt-0.5 leading-snug break-words">
                        {p.rejectedReason}
                      </p>
                    </div>
                  )}
                </div>
              }
            />
          ))}
        </div>
        </>
      )}

      <CollectPaymentDialog open={collectOpen} onOpenChange={setCollectOpen} />
    </div>
  );
};