import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import type {
  Invoice,
  InvoiceListResponse,
  Payment,
  PaymentListResponse,
} from "../../finance/types";

export interface ParentTermFees {
  term: string;
  totalFee: number;
  paid: number;
  pending: number;
  outstanding: number;
  outstandingNetOfPending: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  invoices: Invoice[];
  history: Payment[];
}

export const useParentFees = (studentId: string) => {
  const { user } = useAuth();

  const invoicesQuery = useQuery<InvoiceListResponse>({
    queryKey: ["parentFees", "invoices", user?.id, studentId],
    queryFn: () => fetchData(`/finance/invoices?studentId=${studentId}&limit=100`, "GET"),
    enabled: !!user?.id && !!studentId,
  });

  const paymentsQuery = useQuery<PaymentListResponse>({
    queryKey: ["parentFees", "payments", user?.id, studentId],
    queryFn: () => fetchData(`/finance/payments?studentId=${studentId}&limit=100`, "GET"),
    enabled: !!user?.id && !!studentId,
  });

  const terms = useMemo(() => {
    const invoiceTerm = new Map<string, string>();
    for (const inv of invoicesQuery.data?.invoices ?? []) {
      invoiceTerm.set(inv.id, inv.term ?? "first");
    }

    const byTerm = new Map<string, ParentTermFees>();
    const ensure = (term: string): ParentTermFees => {
      const existing = byTerm.get(term);
      if (existing) return existing;
      const entry: ParentTermFees = {
        term,
        totalFee: 0,
        paid: 0,
        pending: 0,
        outstanding: 0,
        outstandingNetOfPending: 0,
        status: "UNPAID",
        invoices: [],
        history: [],
      };
      byTerm.set(term, entry);
      return entry;
    };

    for (const inv of invoicesQuery.data?.invoices ?? []) {
      const entry = ensure(inv.term ?? "first");
      entry.invoices.push(inv);
      entry.totalFee += inv.amount ?? 0;
    }

    for (const pay of paymentsQuery.data?.payments ?? []) {
      const term = invoiceTerm.get(pay.invoiceId) ?? "first";
      const entry = ensure(term);
      entry.history.push(pay);
      if (pay.status === "CONFIRMED") entry.paid += pay.amount ?? 0;
      else if (pay.status === "PENDING") entry.pending += pay.amount ?? 0;
    }

    const terms: ParentTermFees[] = [];
    for (const entry of byTerm.values()) {
      entry.outstanding = Math.max(0, entry.totalFee - entry.paid);
      entry.outstandingNetOfPending = Math.max(0, entry.outstanding - entry.pending);
      if (entry.totalFee > 0 && entry.paid >= entry.totalFee) entry.status = "PAID";
      else if (entry.paid > 0) entry.status = "PARTIAL";
      entry.history.sort((a, b) =>
        (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt),
      );
      terms.push(entry);
    }

    const order = ["first", "second", "third"];
    terms.sort((a, b) => order.indexOf(a.term) - order.indexOf(b.term));
    return terms;
  }, [invoicesQuery.data, paymentsQuery.data]);

  return {
    terms,
    isLoading: invoicesQuery.isLoading || paymentsQuery.isLoading,
    error: invoicesQuery.error ?? paymentsQuery.error,
  };
};