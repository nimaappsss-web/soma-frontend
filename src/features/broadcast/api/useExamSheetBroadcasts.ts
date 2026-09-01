import { useLiveQuery } from "dexie-react-hooks";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";
import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { addToQueue } from "../../../sync/syncQueue";
import { broadcastKeys } from "../utils/query-keys";
import { hasPendingBroadcastWrite } from "../utils/cache";
import type {
  AxiosErrorResponse,
  ExamSheetBroadcastsResponse,
  ExamBroadcastStatus,
  ExamSheetBroadcast,
} from "../types";

/**
 * Offline-first read of the principal's exam-sheet approval list. The full list
 * is cached in Dexie per user and filtered client-side by status, so the
 * approvals page renders instantly offline. While an approve/reject is still
 * queued (pending), the cached list is preserved so the optimistic status the
 * principal saw isn't clobbered by a stale server fetch.
 */
export const useExamSheetBroadcasts = (status?: ExamBroadcastStatus) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => db.examSheetBroadcastList.where("userId").equals(userId).toArray(),
    [userId],
  );

  const query = useQuery<ExamSheetBroadcastsResponse, AxiosErrorResponse>({
    queryKey: broadcastKeys.sheetBroadcasts(status),
    queryFn: async () => {
      const res = await fetchData<ExamSheetBroadcastsResponse>(
        "/exams/sheet-broadcasts",
        "GET",
      );

      const hasPending = await hasPendingBroadcastWrite(userId);
      if (!hasPending) {
        await db.examSheetBroadcastList.put({
          id: userId,
          userId,
          listJson: JSON.stringify(res),
          updatedAt: Date.now(),
        });
      }

      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const record = cached?.[0];
  const parsed = record
    ? (JSON.parse(record.listJson) as ExamSheetBroadcastsResponse)
    : null;

  // Dexie is the source of truth for offline-first reads (see OFFLINE_CRUD.md).
  // It stays in lockstep with server fetches and additionally reflects optimistic
  // review writes (applyReview flips status to APPROVED/REJECTED). Preferring it
  // means approving a request removes it from the PENDING list immediately via
  // useLiveQuery — no invalidateQueries needed. query.data is the fallback for the
  // instant before the Dexie record arrives.
  const all = parsed ?? query.data ?? { requests: [] };
  const data: ExamSheetBroadcastsResponse = status
    ? { requests: (all.requests ?? []).filter((r) => r.status === status) }
    : all;

  return {
    data,
    isLoading: cached === undefined || (cached.length === 0 && query.isLoading),
    error: parsed ? undefined : (query.error ?? undefined),
  };
};

interface ReviewResponse {
  message: string;
  requestId: string;
  status: string;
  deliveredCount?: number;
}

const REVIEW_METHODS = {
  approve: {
    endpoint: (id: string) => `/exams/sheet-broadcasts/${id}/approve`,
    message: (count?: number) =>
      count
        ? `Approved. Parents of ${count} student${count === 1 ? "" : "s"} notified.`
        : "Approved. Parents can now see these exam results.",
    status: "APPROVED" as const,
  },
  reject: {
    endpoint: (id: string) => `/exams/sheet-broadcasts/${id}/reject`,
    message: () => "Rejected. Parents won't see these exam results.",
    status: "REJECTED" as const,
  },
} as const;

const applyReview = async (
  userId: string,
  requestId: string,
  action: keyof typeof REVIEW_METHODS,
) => {
  const { endpoint, status } = REVIEW_METHODS[action];

  const row = await db.examSheetBroadcastList.get(userId);
  const current: ExamSheetBroadcastsResponse = row
    ? (JSON.parse(row.listJson) as ExamSheetBroadcastsResponse)
    : { requests: [] };

  const reviewedAt = new Date().toISOString();
  const requests = (current.requests ?? []).map((r: ExamSheetBroadcast) =>
    r.id === requestId ? { ...r, status, reviewedAt } : r,
  );

  await db.examSheetBroadcastList.put({
    id: userId,
    userId,
    listJson: JSON.stringify({ requests }),
    updatedAt: Date.now(),
  });

  await addToQueue({
    userId,
    table: "examSheetBroadcastList",
    recordId: `${userId}:${requestId}:${action}`,
    endpoint: endpoint(requestId),
    method: "POST",
    payload: {},
  });

  const target = requests.find((r) => r.id === requestId);
  return {
    message: REVIEW_METHODS[action].message(
      action === "approve" ? target?.studentCount : undefined,
    ),
    requestId,
    status,
    deliveredCount: action === "approve" ? target?.studentCount : undefined,
  } as ReviewResponse;
};

export const useReviewExamSheet = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const approve = useMutation<ReviewResponse, AxiosErrorResponse, string>({
    mutationFn: (requestId) => applyReview(userId, requestId, "approve"),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });

  const reject = useMutation<ReviewResponse, AxiosErrorResponse, string>({
    mutationFn: (requestId) => applyReview(userId, requestId, "reject"),
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });

  return { approve, reject };
};