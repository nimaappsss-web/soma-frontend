import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type ParentExamResultsCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";

interface ParentResultComponent {
  componentId: string | null;
  name: string;
  type: string;
  score: number;
  maxScore: number;
}

interface ParentResultSubject {
  subjectId: string;
  subjectName: string;
  components: ParentResultComponent[];
  caTotal: number;
  examScore: number | null;
  examMaxScore: number | null;
  total: number;
}

interface ParentResultChild {
  studentId: string;
  studentName: string;
  admissionNo: string | null;
  classId: string | null;
  className: string | null;
  subjects: ParentResultSubject[];
}

interface ParentExamResultsResponse {
  term: string;
  session: string;
  children: ParentResultChild[];
}

type AxiosErrorResponse = {
  response?: { data?: { message?: string }; status?: number };
  message?: string;
};

const parseCache = (cached: string | undefined): ParentExamResultsResponse | undefined => {
  if (!cached) return undefined;
  try {
    return JSON.parse(cached) as ParentExamResultsResponse;
  } catch {
    return undefined;
  }
};

export const useParentExamResults = ({ term }: { term: string }) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const cacheId = `${userId}:${term}`;

  const cached = useLiveQuery<ParentExamResultsCache | undefined>(
    () => {
      if (!userId || !term) return Promise.resolve(undefined);
      return db.parentExamResults.get(cacheId);
    },
    [cacheId, userId, term],
  );

  const query = useQuery<ParentExamResultsResponse, AxiosErrorResponse>({
    queryKey: ["parentExamResults", userId, term],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (term) params.set("term", term);
      const res = await fetchData<ParentExamResultsResponse>(
        `/parents/me/exam-results?${params.toString()}`,
        "GET",
      );
      if (userId && term) {
        await db.parentExamResults.put({
          id: cacheId,
          userId,
          term,
          resultsJson: JSON.stringify(res),
          updatedAt: Date.now(),
        });
      }
      return res;
    },
    enabled: !!userId && !!term,
    refetchOnMount: "always",
    staleTime: 5 * 60 * 1000,
  });

  const cachedData = parseCache(cached?.resultsJson);
  const data = cachedData ?? query.data;

  return {
    data,
    isLoading: cached === undefined && query.isLoading,
    isFetching: query.isFetching,
    error: data ? undefined : query.error,
  };
};

export type { ParentResultChild, ParentResultSubject, ParentResultComponent };