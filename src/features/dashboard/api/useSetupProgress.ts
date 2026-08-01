import { useAcademicTerms } from "../../calendar/api";
import { useAllStudents } from "../../students/api";
import { useTeachers } from "../../teacher/api";
import { useClasses, useSubjects, useParents } from "../../principal/api";
import { useAuth } from "../../../contexts/AuthContext";
import { getStoredProgress, setStoredProgress } from "../utils/setupProgress";

export interface SetupProgress {
  completed: {
    terms: boolean;
    subjects: boolean;
    classes: boolean;
    teachers: boolean;
    studentsParents: boolean;
  };
  percentage: number;
  storedPercentage: number;
  markSeen: () => void;
}

export const useSetupProgress = (): SetupProgress => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const { data: termsData } = useAcademicTerms();
  const { data: subjects } = useSubjects();
  const { data: classesData } = useClasses();
  const { data: teachersData } = useTeachers();
  const { data: students } = useAllStudents(userId);
  const { data: parentsData } = useParents();

  const completed = {
    terms: (termsData?.terms?.length ?? 0) > 0,
    subjects: (subjects?.length ?? 0) > 0,
    classes: (classesData?.classes?.length ?? 0) > 0,
    teachers:
      (teachersData?.teachers?.length ?? 0) > 0 ||
      (teachersData?.pendingInvites?.length ?? 0) > 0,
    studentsParents:
      (students?.length ?? 0) > 0 || (parentsData?.parents?.length ?? 0) > 0,
  };

  const doneCount = Object.values(completed).filter(Boolean).length;
  const percentage = doneCount * 20;
  const storedPercentage = userId ? getStoredProgress(userId) : 0;

  const markSeen = () => {
    if (userId) setStoredProgress(userId, percentage);
  };

  return { completed, percentage, storedPercentage, markSeen };
};
