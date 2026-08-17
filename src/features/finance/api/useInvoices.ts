import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type InvoiceCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import { financeKeys } from "../utils/query-keys";
import type { Invoice, InvoiceListResponse, FeeItem, AxiosErrorResponse, InvoiceStatus } from "../types";

interface UseInvoicesParams {
  classId?: string;
  status?: InvoiceStatus;
  studentId?: string;
  page?: number;
  limit?: number;
}

const fromCache = (c: InvoiceCache): Invoice => ({
  id: c.id,
  studentId: c.studentId,
  studentName: c.studentName ?? "",
  admissionNo: c.admissionNo,
  feeStructureId: c.feeStructureId,
  feeName: c.feeName,
  groupId: c.groupId,
  amount: c.amount,
  items: c.itemsJson ? (JSON.parse(c.itemsJson) as FeeItem[]) : [],
  status: c.status as InvoiceStatus,
  term: c.term,
  session: c.session,
  dueDate: c.dueDate,
  issuedByName: c.issuedByName,
  createdAt: c.createdAt,
});

export const useInvoices = ({ classId, status, studentId, page = 1, limit = 20 }: UseInvoicesParams = {}) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as InvoiceCache[]);
      return db.invoices.where("userId").equals(userId).toArray();
    },
    [userId],
  );

  const query = useQuery<InvoiceListResponse, AxiosErrorResponse>({
    queryKey: [...financeKeys.invoices(), page, status, classId, studentId].filter(Boolean),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (classId) params.set("classId", classId);
      if (status) params.set("status", status);
      if (studentId) params.set("studentId", studentId);
      const res = await fetchData<InvoiceListResponse>(`/finance/invoices?${params.toString()}`, "GET");

      const hasPending = await db.syncQueue
        .where("userId")
        .equals(userId)
        .filter((i) => i.table === "invoices" && i.status === "pending")
        .count();

      await db.transaction("rw", db.invoices, async () => {
        if (hasPending === 0 && page === 1 && !classId && !status && !studentId) {
          await db.invoices.where("userId").equals(userId).delete();
        }
        if (res.invoices?.length) {
          await db.invoices.bulkPut(
            res.invoices.map((inv: Invoice) => ({
              id: inv.id,
              userId,
              studentId: inv.studentId,
              studentName: inv.studentName,
              admissionNo: inv.admissionNo,
              feeStructureId: inv.feeStructureId ?? "",
              feeName: inv.feeName,
              groupId: inv.groupId,
              amount: inv.amount,
              itemsJson: inv.items ? JSON.stringify(inv.items) : "[]",
              issuedByName: inv.issuedByName ?? null,
              status: inv.status,
              term: inv.term,
              session: inv.session,
              dueDate: inv.dueDate ?? null,
              createdAt: inv.createdAt,
            }) as InvoiceCache),
          );
        }
      });

      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const students = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as Array<{ id: string; classId: string }>);
      return db.students.where("userId").equals(userId).toArray();
    },
    [userId],
  );

  const studentClassMap = new Map((students ?? []).map((s) => [s.id, s.classId]));

  const cachedList = cached?.map(fromCache) ?? [];
  let filtered = cachedList;
  if (classId) filtered = filtered.filter((i) => studentClassMap.get(i.studentId) === classId);
  if (status) filtered = filtered.filter((i) => i.status === status);
  if (studentId) filtered = filtered.filter((i) => i.studentId === studentId);

  return {
    data: cached !== undefined ? { invoices: filtered, total: filtered.length, page, totalPages: Math.ceil(filtered.length / limit) } : (query.data ?? { invoices: [], total: 0, page, totalPages: 0 }),
    isLoading: cached === undefined || (Array.isArray(cached) && cached.length === 0 && query.isLoading),
    error: query.error ?? undefined,
  };
};