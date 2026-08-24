import { useLiveQuery } from "dexie-react-hooks";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/utils/toast";
import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { addToQueue } from "../../../sync/syncQueue";
import { notifyIfOffline } from "../../../utils/offlineNotice";
import { broadcastKeys } from "../utils/query-keys";
import {
  getCachedStatus,
  saveCachedStatus,
  updateCachedStatus,
  hasPendingBroadcastWrite,
  scopeKey,
} from "../utils/cache";
import type {
  AxiosErrorResponse,
  BroadcastStatusResponse,
  BroadcastScope,
  BroadcastCaPayload,
  BroadcastCaResponse,
  SubmitExamSheetPayload,
  SubmitExamSheetResponse,
  ResendExamResultsPayload,
  ResendExamResultsResponse,
} from "../types";

/**
 * Offline-first read of the class broadcast status. The status blob is cached in
 * Dexie per class scope so the Broadcast page renders instantly offline. While a
 * broadcast write is still queued (pending), the cached blob is preserved so the
 * optimistic state the teacher saw isn't clobbered by a stale server fetch.
 */
export const useBroadcastStatus = ({ classId, term, session }: BroadcastScope) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const resolvedSession = session ?? "";

  const cached = useLiveQuery(
    () =>
      db.broadcastStatus
        .where("userId")
        .equals(userId)
        .filter((r) => r.classId === classId && r.term === term)
        .toArray(),
    [userId, classId, term],
  );

  const params = new URLSearchParams();
  params.set("classId", classId);
  params.set("term", term);
  if (session) params.set("session", session);

  const query = useQuery<BroadcastStatusResponse, AxiosErrorResponse>({
    queryKey: broadcastKeys.status(classId, term, resolvedSession),
    queryFn: async () => {
      const res = await fetchData<BroadcastStatusResponse>(
        `/results/broadcast/status?${params.toString()}`,
        "GET",
      );

      const hasPending = await hasPendingBroadcastWrite(userId);
      if (hasPending) {
        // A broadcast write is still queued — keep serving the optimistic
        // cached state so the fresh fetch doesn't revert what the user saw.
        const cachedRow = await getCachedStatus(userId, classId, term);
        return cachedRow?.status ?? res;
      }

      await saveCachedStatus(userId, classId, term, res.session ?? resolvedSession, res);
      return res;
    },
    enabled: !!userId && !!classId && !!term,
    staleTime: 5 * 60 * 1000,
  });

  const record = cached?.[0];
  const parsed = record ? (JSON.parse(record.statusJson) as BroadcastStatusResponse) : null;

  // Fresh server data wins once fetched; the Dexie blob is the instant
  // offline/offline-first fallback and covers failed refetches.
  const data = query.data ?? parsed ?? null;

  return {
    data,
    isLoading: cached === undefined || (cached.length === 0 && query.isLoading),
    error: data ? undefined : (query.error ?? undefined),
    refetch: query.refetch,
  };
};

const readScopePayload = (payload: BroadcastScope) => ({
  classId: payload.classId,
  term: payload.term,
  session: payload.session ?? "",
});

/**
 * CA broadcast — offline-first. Flips the cached status's caBroadcast state
 * optimistically so the teacher sees the confirmation immediately, then queues
 * the POST for replay when back online.
 */
export const useBroadcastCa = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useMutation<BroadcastCaResponse, AxiosErrorResponse, BroadcastCaPayload>({
    mutationFn: async (payload) => {
      const { classId, term, session } = readScopePayload(payload);
      const nowIso = new Date().toISOString();

      const cachedRow = await getCachedStatus(userId, classId, term);
      const current = cachedRow?.status ?? null;

      const componentNames =
        current?.components
          .filter((c) => payload.componentIds.includes(c.id))
          .map((c) => c.name)
          .join(", ") ?? "";

      const sessionSet = new Set<string>();
      const scoredStudents = new Set<string>();
      if (current) {
        for (const s of current.students) {
          let scored = false;
          for (const subj of s.subjects) {
            for (const c of subj.caComponents) {
              if (c.componentId && payload.componentIds.includes(c.componentId)) {
                sessionSet.add(`${subj.subjectId}:${c.componentId}`);
                if (c.score !== null) scored = true;
              }
            }
          }
          if (scored) scoredStudents.add(s.studentId);
        }
      }

      if (current) {
        await updateCachedStatus(userId, classId, term, {
          ...current,
          caBroadcast: { componentIds: payload.componentIds, broadcastAt: nowIso },
        });
      }

      await addToQueue({
        userId,
        table: "broadcastStatus",
        recordId: `${scopeKey(classId, term, session)}:ca`,
        endpoint: "/results/broadcast/ca",
        method: "POST",
        payload: { classId, term, session, componentIds: payload.componentIds },
      });

      notifyIfOffline(
        "No internet — CA results are saved and will broadcast to parents automatically once you reconnect.",
      );

      return {
        message: "CA results broadcast to parents",
        componentIds: payload.componentIds,
        componentNames,
        sessionCount: sessionSet.size,
        studentCount: scoredStudents.size,
        broadcastAt: nowIso,
      };
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};

/**
 * Submit exam sheet — offline-first. Sets the cached status's examBroadcast to
 * PENDING optimistically, then queues the POST for replay when online.
 */
export const useSubmitExamSheet = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useMutation<SubmitExamSheetResponse, AxiosErrorResponse, SubmitExamSheetPayload>({
    mutationFn: async (payload) => {
      const { classId, term, session } = readScopePayload(payload);
      const nowIso = new Date().toISOString();

      const cachedRow = await getCachedStatus(userId, classId, term);
      const current = cachedRow?.status ?? null;

      if (current) {
        await updateCachedStatus(userId, classId, term, {
          ...current,
          examBroadcast: {
            status: "PENDING",
            note: payload.note ?? null,
            createdAt: nowIso,
            reviewedAt: null,
          },
        });
      }

      await addToQueue({
        userId,
        table: "broadcastStatus",
        recordId: `${scopeKey(classId, term, session)}:exam`,
        endpoint: "/results/broadcast/exam",
        method: "POST",
        payload: { classId, term, session, note: payload.note ?? null },
      });

      notifyIfOffline(
        "No internet — the exam sheet is saved and will be sent for approval automatically once you reconnect.",
      );

      return {
        message: "Exam sheet submitted for principal approval",
        requestId: scopeKey(classId, term, session),
        status: "PENDING",
      };
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};

/**
 * Resend exam results — offline-first. Marks the target students as delivered in
 * the cached status optimistically, then queues the POST for replay when online.
 */
export const useResendExamResults = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useMutation<ResendExamResultsResponse, AxiosErrorResponse, ResendExamResultsPayload>({
    mutationFn: async (payload) => {
      const { classId, term, session } = readScopePayload(payload);

      const cachedRow = await getCachedStatus(userId, classId, term);
      const current = cachedRow?.status ?? null;

      let targetIds: string[] = [];
      if (payload.studentIds && payload.studentIds.length > 0) {
        targetIds = payload.studentIds;
      } else if (current) {
        const delivered = new Set(current.examDeliveredStudentIds ?? []);
        targetIds = current.students
          .filter((s) => s.examComplete && !delivered.has(s.studentId))
          .map((s) => s.studentId);
      }

      if (current) {
        const delivered = new Set(current.examDeliveredStudentIds ?? []);
        for (const id of targetIds) delivered.add(id);
        await updateCachedStatus(userId, classId, term, {
          ...current,
          examDeliveredStudentIds: [...delivered],
        });
      }

      await addToQueue({
        userId,
        table: "broadcastStatus",
        recordId: `${scopeKey(classId, term, session)}:resend:${[...targetIds].sort().join(",")}`,
        endpoint: "/results/broadcast/exam/resend",
        method: "POST",
        payload: { classId, term, session, studentIds: targetIds },
      });

      notifyIfOffline(
        "No internet — the resend is saved and will reach parents automatically once you reconnect.",
      );

      return {
        message: `Exam results sent to ${targetIds.length} parent${targetIds.length === 1 ? "" : "s"}`,
        count: targetIds.length,
        studentIds: targetIds,
      };
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(transformError(error));
    },
  });
};