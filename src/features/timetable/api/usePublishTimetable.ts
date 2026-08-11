import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { db, type TimetableEntryCache } from "../../../db/db";
import { addToQueue } from "../../../sync/syncQueue";
import { useAuth } from "../../../contexts/AuthContext";
import { timetableKeys } from "../utils/query-keys";
import type {
  PublishPayload,
  PublishedTimetable,
  TimetableBreak,
  TimetableEntry,
  AxiosErrorResponse,
} from "../types";

const toEntryCache = (
  userId: string,
  e: Pick<TimetableEntry, "id" | "classId" | "className" | "subjectId" | "subjectName" | "teacherId" | "teacherName" | "day" | "period" | "startTime" | "endTime">,
): TimetableEntryCache => ({
  id: e.id,
  userId,
  timetableId: "",
  classId: e.classId,
  className: e.className,
  subjectId: e.subjectId,
  subjectName: e.subjectName,
  teacherId: e.teacherId,
  teacherName: e.teacherName,
  day: e.day,
  period: e.period,
  startTime: e.startTime,
  endTime: e.endTime,
  updatedAt: Date.now(),
});

export const usePublishTimetable = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  return useMutation<PublishedTimetable & { queued: boolean }, AxiosErrorResponse, PublishPayload>({
    mutationFn: async (payload) => {
      if (!userId) throw new Error("Not authenticated");

      const classId = payload.classId;
      const className = payload.entries[0]?.className ?? "";
      const now = Date.now();

      const apiPayload = {
        classId,
        title: payload.title,
        breaks: payload.breaks ?? [],
        entries: payload.entries.map((e) => ({
          subjectId: e.subjectId,
          day: e.day,
          period: e.period,
          startTime: e.startTime,
          endTime: e.endTime,
        })),
      };

      // Offline/queued path: write the draft to the local cache immediately
      // (offline-first) so the view stays consistent until the queue syncs.
      const writeDraftCache = async () => {
        await db.transaction("rw", db.timetableEntries, db.timetables, async () => {
          await db.timetableEntries
            .where("userId")
            .equals(userId)
            .filter((e) => e.classId === classId)
            .delete();

          const cacheEntries = payload.entries.map((e, i) =>
            toEntryCache(userId, {
              id: `draft_${classId}_${now}_${i}`,
              classId,
              className: e.className ?? className,
              subjectId: e.subjectId,
              subjectName: e.subjectName ?? "",
              teacherId: e.teacherId ?? "",
              teacherName: e.teacherName ?? "",
              day: e.day,
              period: e.period,
              startTime: e.startTime,
              endTime: e.endTime,
            }),
          );

          if (cacheEntries.length) {
            await db.timetableEntries.bulkPut(cacheEntries);
          }

          await db.timetables.put({
            id: classId,
            userId,
            classId,
            className,
            title: payload.title,
            breaksJson: JSON.stringify((payload.breaks ?? []) as TimetableBreak[]),
            updatedAt: now,
          });
        });
      };

      const enqueue = () =>
        addToQueue({
          userId,
          table: "timetableEntries",
          recordId: classId,
          endpoint: "/timetable/publish",
          method: "POST",
          payload: apiPayload,
        });

      // Online: publish immediately so server validation errors (400/409) reach
      // the user instead of silently failing in the background sync queue.
      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const res = await fetchData<{ timetable: PublishedTimetable }>(
            "/timetable/publish",
            "POST",
            apiPayload,
          );
          const published = res.timetable;
          await writeDraftCache();

          // Supersede any earlier queued publish for this class.
          const stale = await db.syncQueue
            .where("userId")
            .equals(userId)
            .filter((i) => i.table === "timetableEntries" && i.recordId === classId)
            .toArray();
          for (const s of stale) await db.syncQueue.delete(s.id!);

          return { ...published, queued: false };
        } catch (error) {
          if ((error as AxiosErrorResponse)?.response) throw error;
          // Network dropped mid-flight — fall back to the offline queue.
          await writeDraftCache();
          await enqueue();
          return {
            id: classId,
            classId,
            className,
            title: payload.title,
            breaks: payload.breaks ?? [],
            entries: [],
            queued: true,
          };
        }
      }

      await writeDraftCache();
      await enqueue();
      return {
        id: classId,
        classId,
        className,
        title: payload.title,
        breaks: payload.breaks ?? [],
        entries: [],
        queued: true,
      };
    },
    onSuccess: async (data, payload) => {
      toast.success(data.queued ? "Timetable saved — will sync when online" : "Timetable published!");
      queryClient.invalidateQueries({ queryKey: timetableKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetableKeys.build(payload.classId) });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};