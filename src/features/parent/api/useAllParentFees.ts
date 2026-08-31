import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import type { InvoiceListResponse, PaymentListResponse } from "../../finance/types";

export interface ParentFeesSummary {
  studentId: string;
  totalFee: number;
  paid: number;
  pending: number;
  outstanding: number;
  outstandingNetOfPending: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
}

export const useAllParentFees = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const invoicesQuery = useQuery<InvoiceListResponse>({
    queryKey: ["parentFees", "all-invoices", userId],
    queryFn: () => fetchData(`/finance/invoices?limit=100`, "GET"),
    enabled: !!userId,
  });

  const paymentsQuery = useQuery<PaymentListResponse>({
    queryKey: ["parentFees", "all-payments", userId],
    queryFn: () => fetchData(`/finance/payments?limit=100`, "GET"),
    enabled: !!userId,
  });

  const byStudent = useMemo(() => {
    const map = new Map<string, ParentFeesSummary>();
    const ensure = (studentId: string): ParentFeesSummary => {
      const existing = map.get(studentId);
      if (existing) return existing;
      const entry: ParentFeesSummary = {
        studentId,
        totalFee: 0,
        paid: 0,
        pending: 0,
        outstanding: 0,
        outstandingNetOfPending: 0,
        status: "UNPAID",
      };
      map.set(studentId, entry);
      return entry;
    };

    for (const inv of invoicesQuery.data?.invoices ?? []) {
      const entry = ensure(inv.studentId);
      entry.totalFee += inv.amount ?? 0;
    }

    for (const pay of paymentsQuery.data?.payments ?? []) {
      const entry = ensure(pay.studentId);
      if (pay.status === "CONFIRMED") entry.paid += pay.amount ?? 0;
      else if (pay.status === "PENDING") entry.pending += pay.amount ?? 0;
    }

    const summaries: ParentFeesSummary[] = [];
    for (const entry of map.values()) {
      entry.outstanding = Math.max(0, entry.totalFee - entry.paid);
      entry.outstandingNetOfPending = Math.max(0, entry.outstanding - entry.pending);
      if (entry.totalFee > 0 && entry.paid >= entry.totalFee) entry.status = "PAID";
      else if (entry.paid > 0 || entry.pending > 0) entry.status = "PARTIAL";
      summaries.push(entry);
    }
    return summaries;
  }, [invoicesQuery.data, paymentsQuery.data]);

  const totalFee = byStudent.reduce((s, f) => s + f.totalFee, 0);
  const paid = byStudent.reduce((s, f) => s + f.paid, 0);
  const pending = byStudent.reduce((s, f) => s + f.pending, 0);
  const outstanding = byStudent.reduce((s, f) => s + f.outstanding, 0);
  const outstandingNetOfPending = byStudent.reduce((s, f) => s + f.outstandingNetOfPending, 0);

  return {
    summaries: byStudent,
    totalFee,
    paid,
    pending,
    outstanding,
    outstandingNetOfPending,
    isLoading: invoicesQuery.isLoading || paymentsQuery.isLoading,
    error: invoicesQuery.error ?? paymentsQuery.error,
  };
};
