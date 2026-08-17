import { useAcademicTerms } from "../../calendar/api";
import { useAllStudents } from "../../students/api";
import { useTeachers } from "../../teacher/api";
import { useClasses, useSubjects, useParents } from "../../principal/api";
import { useSchoolSettings } from "../../settings/api/useSchoolSettings";
import { useAuth } from "../../../contexts/AuthContext";
import { getStoredProgress, setStoredProgress } from "../utils/setupProgress";

export interface SetupProgress {
  completed: {
    terms: boolean;
    subjects: boolean;
    classes: boolean;
    teachers: boolean;
    studentsParents: boolean;
    bankDetails: boolean;
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
  const { data: settings } = useSchoolSettings();

  const bankSetting = settings?.find((s) => s.key === "manualBankDetails");
  const bank = bankSetting?.value as
    | { bankName?: string; accountName?: string; accountNumber?: string }
    | undefined;
  const hasBankDetails = !!(bank?.bankName?.trim() && bank?.accountName?.trim() && bank?.accountNumber?.trim());

  const completed = {
    terms: (termsData?.terms?.length ?? 0) > 0,
    subjects: (subjects?.length ?? 0) > 0,
    classes: (classesData?.classes?.length ?? 0) > 0,
    teachers:
      (teachersData?.teachers?.length ?? 0) > 0 ||
      (teachersData?.pendingInvites?.length ?? 0) > 0,
    studentsParents:
      (students?.length ?? 0) > 0 || (parentsData?.parents?.length ?? 0) > 0,
    bankDetails: hasBankDetails,
  };

  const doneCount = Object.values(completed).filter(Boolean).length;
  const percentage = Math.round(doneCount * (100 / 6));
  const storedPercentage = userId ? getStoredProgress(userId) : 0;

  const markSeen = () => {
    if (userId) setStoredProgress(userId, percentage);
  };

  return { completed, percentage, storedPercentage, markSeen };
};
