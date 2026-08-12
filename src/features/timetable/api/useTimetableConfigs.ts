import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { transformError } from "../../../utils/transformError";
import { useAuth } from "../../../contexts/AuthContext";
import { db, type TimetableConfigCache } from "../../../db/db";
import { timetableKeys } from "../utils/query-keys";
import type { AxiosErrorResponse, TimetableConfigDto, TimetableConfigsResponse } from "../types";

const parse = (c: TimetableConfigCache | undefined): Record<string, TimetableConfigDto> | undefined => {
  if (!c) return undefined;
  try {
    return { [c.configType]: { id: c.id, configType: c.configType as TimetableConfigDto["configType"], name: c.name, ...JSON.parse(c.dataJson) } };
  } catch {
    return undefined;
  }
};

/**
 * Offline-first read of the school's shared timetable configurations (one per
 * school-type batch). Returns the Dexie cache instantly and rehydrates from the
 * server in the background whenever online.
 */
export const useTimetableConfigs = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [cached, setCached] = useState<Record<string, TimetableConfigDto> | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;
    const sub = liveQuery(() => db.timetableConfigs.where("userId").equals(userId).toArray()).subscribe({
      next: (rows) => {
        setCached(
          rows.length === 0
            ? {}
            : Object.assign({}, ...rows.map((r) => parse(r) ?? {})),
        );
      },
    });
    return () => sub.unsubscribe();
  }, [userId]);

  const query = useQuery<TimetableConfigsResponse, AxiosErrorResponse>({
    queryKey: timetableKeys.configs(),
    queryFn: async () => {
      const res = await fetchData<TimetableConfigsResponse>("/timetable/configs", "GET");
      if (userId && res.configs?.length) {
        await db.transaction("rw", db.timetableConfigs, async () => {
          await db.timetableConfigs.where("userId").equals(userId).delete();
          await db.timetableConfigs.bulkPut(
            res.configs.map((c: TimetableConfigDto) => ({
              id: c.id,
              userId,
              configType: c.configType,
              name: c.name,
              dataJson: JSON.stringify({ schedule: c.schedule, subjectIds: c.subjectIds, targets: c.targets, doublePeriods: c.doublePeriods }),
              updatedAt: c.updatedAt ? new Date(c.updatedAt).getTime() : Date.now(),
            })),
          );
        });
      }
      return res;
    },
    enabled: !!userId,
    staleTime: 30_000,
    retry: 1,
  });

  const data = useMemo<Record<string, TimetableConfigDto>>(() => {
    const server: Record<string, TimetableConfigDto> = {};
    for (const c of query.data?.configs ?? []) server[c.configType] = c;
    // Server is the source of truth: a stale Dexie cache (e.g. a pre-config
    // 3-block schedule) must never override freshly-fetched server data.
    return cached && Object.keys(cached).length > 0 ? { ...cached, ...server } : server;
  }, [cached, query.data]);

  const isEmpty = Object.keys(cached ?? {}).length === 0;

  return {
    data,
    isLoading: cached === undefined || (isEmpty && query.isLoading),
    error: query.error ?? undefined,
  };
};

/** Save a configuration (upsert keyed by configType). Updates Dexie on success. */
export const useSaveTimetableConfig = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  return useMutation<TimetableConfigDto, AxiosErrorResponse, TimetableConfigDto>({
    mutationFn: (config) =>
      fetchData<TimetableConfigDto>(`/timetable/configs/${config.configType}`, "PUT", {
        ...config,
      }),
    onSuccess: async (saved, config) => {
      toast.success(`Saved "${config.name}"`);
      if (userId) {
        await db.timetableConfigs.put({
          id: saved.id ?? config.id,
          userId,
          configType: config.configType,
          name: config.name,
          dataJson: JSON.stringify({ schedule: config.schedule, subjectIds: config.subjectIds, targets: config.targets, doublePeriods: config.doublePeriods }),
          updatedAt: Date.now(),
        });
      }
      queryClient.invalidateQueries({ queryKey: timetableKeys.configs() });
    },
    onError: (error) => toast.error(transformError(error)),
  });
};

/** Delete a configuration. */
export const useDeleteTimetableConfig = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  return useMutation<{ ok: boolean }, AxiosErrorResponse, string>({
    mutationFn: (configType) => fetchData(`/timetable/configs/${configType}`, "DELETE"),
    onSuccess: async (_res, configType) => {
      toast.success("Configuration deleted");
      if (userId) {
        const rows = await db.timetableConfigs.where("userId").equals(userId).toArray();
        await db.timetableConfigs.bulkDelete(
          rows.filter((r) => r.configType === configType).map((r) => r.id),
        );
      }
      queryClient.invalidateQueries({ queryKey: timetableKeys.configs() });
    },
    onError: (error) => toast.error(transformError(error)),
  });
};