import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
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

export const useParentExamResults = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  return useQuery<ParentExamResultsResponse>({
    queryKey: ["parentExamResults", userId],
    queryFn: () => fetchData<ParentExamResultsResponse>("/parents/me/exam-results", "GET"),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export type { ParentResultChild, ParentResultSubject, ParentResultComponent };
