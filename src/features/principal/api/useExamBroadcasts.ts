import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/utils/toast";
import { transformError } from "../../../utils/transformError";
import { fetchData } from "../../../utils/fetchData";
import { useAuth } from "../../../contexts/AuthContext";
import type { AxiosErrorResponse } from "../types";

export interface ExamBroadcast {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
  teacher: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  reviewedBy: { id: string; name: string } | null;
  exam: {
    id: string;
    name: string;
    type: string;
    term: string;
    session: string;
    maxScore: number;
    date: string;
    visibleToParents: boolean;
    scoreCount: number;
    subject: { id: string; name: string };
    class: { id: string; name: string } | null;
    component: { id: string; name: string; type: string } | null;
  };
}

interface ListBroadcastsResponse {
  requests: ExamBroadcast[];
}

export const useExamBroadcasts = (status?: "PENDING" | "APPROVED" | "REJECTED") => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryKey = ["examBroadcasts", userId, status ?? "all"];

  return useQuery<ListBroadcastsResponse, AxiosErrorResponse>({
    queryKey,
    queryFn: () => {
      const q = status ? `?status=${status}` : "";
      return fetchData<ListBroadcastsResponse>(`/exams/broadcasts${q}`, "GET");
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
};

export const useReviewExamBroadcast = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["examBroadcasts", userId] });
  };

  const approve = useMutation<
    { message: string; requestId: string; status: string },
    AxiosErrorResponse,
    string
  >({
    mutationFn: (requestId) =>
      fetchData(`/exams/broadcasts/${requestId}/approve`, "POST"),
    onSuccess: async () => {
      toast.success("Approved. Parents can now see this exam result.");
      invalidate();
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });

  const reject = useMutation<
    { message: string; requestId: string; status: string },
    AxiosErrorResponse,
    string
  >({
    mutationFn: (requestId) =>
      fetchData(`/exams/broadcasts/${requestId}/reject`, "POST"),
    onSuccess: async () => {
      toast.success("Rejected. Parents won't see this exam result.");
      invalidate();
    },
    onError: async (error) => {
      toast.error(transformError(error));
    },
  });

  return { approve, reject };
};