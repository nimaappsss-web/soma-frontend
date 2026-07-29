export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export type ExamType = "QUIZ" | "TEST" | "ASSIGNMENT" | "PROJECT" | "EXAM";
export type ExamStatus = "DRAFT" | "PUBLISHED" | "COMPLETED";

export interface Exam {
  id: string;
  name: string;
  type: ExamType;
  term: string;
  session: string;
  maxScore: number;
  subjectId: string;
  subjectName: string;
  date: string;
  status: ExamStatus;
  scoreCount: number;
}

export interface ExamListResponse {
  exams: Exam[];
}

export interface CreateExamPayload {
  name: string;
  type: ExamType;
  term: string;
  session: string;
  maxScore: number;
  subjectId: string;
  date: string;
  status: ExamStatus;
}

export interface UpdateExamPayload {
  name?: string;
  type?: ExamType;
  maxScore?: number;
  date?: string;
  status?: ExamStatus;
}

export interface ExamScore {
  studentId: string;
  studentName: string;
  admissionNo: string;
  score: number;
  remarks: string | null;
}

export interface ExamScoresResponse {
  examId: string;
  scores: ExamScore[];
}

export interface SubmitScoresPayload {
  scores: Array<{
    studentId: string;
    score: number;
    remarks?: string;
  }>;
}

export interface SubmitScoresResponse {
  message: string;
  count: number;
}

export interface ExamStudentScoreResponse {
  examId: string;
  examName: string;
  subjectName: string;
  student: { id: string; name: string; admissionNo: string };
  score: { score: number; remarks: string } | null;
}

export interface TermResultsResponse {
  classId: string;
  className: string;
  term: string;
  session: string;
  students: Array<{
    studentId: string;
    studentName: string;
    admissionNo: string;
    subjects: Array<{
      subjectId: string;
      subjectName: string;
      caScore: number;
      examScore: number;
      total: number;
      grade: string;
      teacherName: string;
    }>;
    totalScore: number;
    average: number;
    position: number;
    classSize: number;
    attendancePercentage: number;
  }>;
}
