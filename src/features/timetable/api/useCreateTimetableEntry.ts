import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { timetableKeys } from "../utils/query-keys";
import type { CreateTimetableEntryPayload, TimetableEntry, AxiosErrorResponse } from "../types";

export const useCreateTimetableEntry = () => {
  const queryClient = useQueryClient();

  return useMutation<TimetableEntry, AxiosErrorResponse, CreateTimetableEntryPayload>({
    mutationFn: (payload) => fetchData("/timetable", "POST", payload),
    onSuccess: async () => {
      toast.success("Timetable entry added!");
      queryClient.invalidateQueries({ queryKey: timetableKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
