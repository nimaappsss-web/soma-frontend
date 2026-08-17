import { useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import type { BulkGeneratePayload, AxiosErrorResponse } from "../types";

export const useBulkGenerateInvoices = () => {
  const { user } = useAuth();

  return useMutation<{ generated: number; skipped: number; students: number; feeStructures: number; classes: number; session: string }, AxiosErrorResponse, BulkGeneratePayload>({
    mutationFn: async (payload) => {
      const res = await fetchData<{ generated: number; skipped: number; students: number; feeStructures: number; classes: number; session: string }, BulkGeneratePayload>(
        "/finance/invoices/bulk",
        "POST",
        payload,
      );

      if (user && res.generated > 0) {
        const targetClassIds = payload.classIds?.length ? payload.classIds : payload.classId ? [payload.classId] : [];
        try {
          const params = new URLSearchParams({ page: "1", limit: "100" });
          if (targetClassIds.length === 1) params.set("classId", targetClassIds[0]);
          const invRes = await fetchData<{ invoices: Array<{ id: string; studentId: string; amount: number; status: string; createdAt: string; dueDate: string | null }> }>(
            `/finance/invoices?${params.toString()}`,
            "GET",
          );
          if (invRes.invoices?.length) {
            await db.invoices.bulkPut(
              (invRes.invoices ?? []).map((inv: { id: string; studentId: string; amount: number; status: string; createdAt: string; dueDate: string | null }) => ({
                id: inv.id,
                userId: user.id,
                studentId: inv.studentId,
                amount: inv.amount,
                status: inv.status,
                createdAt: inv.createdAt,
                dueDate: inv.dueDate,
                feeStructureId: "",
                itemsJson: "[]",
                issuedByName: null,
              })),
            );
          }
        } catch {
          // Best-effort cache refresh; list hook will re-sync later.
        }
      }

      return res;
    },
    onSuccess: (data) => {
      toast.success(`${data.generated} invoice${data.generated === 1 ? "" : "s"} generated!`);
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};