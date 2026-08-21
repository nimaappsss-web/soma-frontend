export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string; error?: string };
    status?: number;
  };
  message?: string;
};

export type BroadcastComponent = {
  id: string;
  name: string;
  type: string;
  maxScore: number;
  sortOrder: number;
};

export type BroadcastCaComponent = {
  componentId: string | null;
  componentName: string;
  type: string;
  maxScore: number;
  score: number | null;
};

export type BroadcastSubjectRow = {
  subjectId: string;
  subjectName: string;
  caComponents: BroadcastCaComponent[];
  caTotal: number;
  caComplete: boolean;
  examScore: number | null;
  examMaxScore: number | null;
};

export type BroadcastStudent = {
  studentId: string;
  studentName: string;
  admissionNo: string;
  subjects: BroadcastSubjectRow[];
  caComplete: boolean;
  examComplete: boolean;
  caMissingComponents: { subjectName: string; componentNames: string[] }[];
  examMissingSubjects: string[];
};

export type ExamBroadcastStatus = "PENDING" | "APPROVED" | "REJECTED";

export type BroadcastStatusResponse = {
  classId: string;
  className: string;
  term: string;
  session: string;
  components: BroadcastComponent[];
  subjects: { id: string; name: string }[];
  students: BroadcastStudent[];
  hasCaSessions: boolean;
  hasExamSessions: boolean;
  caBroadcast: { componentIds: string[]; broadcastAt: string } | null;
  examBroadcast: {
    status: ExamBroadcastStatus;
    note: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
  examDeliveredStudentIds: string[];
};

export type BroadcastScope = {
  classId: string;
  term: string;
  session?: string;
};

export type BroadcastCaPayload = BroadcastScope & {
  componentIds: string[];
};

export type BroadcastCaResponse = {
  message: string;
  componentIds: string[];
  componentNames: string;
  sessionCount: number;
  studentCount: number;
  broadcastAt: string;
};

export type SubmitExamSheetPayload = BroadcastScope & {
  note?: string;
};

export type SubmitExamSheetResponse = {
  message: string;
  requestId: string;
  status: string;
};

export type ResendExamResultsPayload = BroadcastScope & {
  studentIds?: string[];
};

export type ResendExamResultsResponse = {
  message: string;
  count: number;
  studentIds: string[];
};

export type ExamSheetBroadcast = {
  id: string;
  status: ExamBroadcastStatus;
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
  term: string;
  session: string;
  examCount: number;
  scoreCount: number;
  studentCount: number;
  class: { id: string; name: string };
  teacher: { id: string; name: string; image: string | null } | null;
  reviewedBy: { id: string; name: string } | null;
};

export type ExamSheetBroadcastsResponse = {
  requests: ExamSheetBroadcast[];
};