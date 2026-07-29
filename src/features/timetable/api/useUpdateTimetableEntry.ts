import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { timetableKeys } from "../utils/query-keys";
import type { UpdateTimetableEntryPayload, TimetableEntry, AxiosErrorResponse } from "../types";

export const useUpdateTimetableEntry = () => {
  const queryClient = useQueryClient();

  return useMutation<TimetableEntry, AxiosErrorResponse, { id: string; data: UpdateTimetableEntryPayload }>({
    mutationFn: ({ id, data }) => fetchData(`/timetable/${id}`, "PUT", data),
    onSuccess: async () => {
      toast.success("Timetable entry updated!");
      queryClient.invalidateQueries({ queryKey: timetableKeys.lists() });
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });
};
