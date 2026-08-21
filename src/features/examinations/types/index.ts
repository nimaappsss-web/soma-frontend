export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string; error?: string };
    status?: number;
  };
  message?: string;
};

export type AssessmentMode = "standard" | "thirdTermAverage";

export type ExamComponentType =
  | "TEST"
  | "ASSIGNMENT"
  | "PROJECT"
  | "PRACTICAL"
  | "EXAM"
  | "PHYSICAL"
  | "OTHER";

export type ExamType = ExamComponentType;

export type ExamStatus = "DRAFT" | "PUBLISHED" | "COMPLETED";

export interface ExamComponent {
  id: string;
  name: string;
  type: ExamComponentType;
  maxScore: number;
  sortOrder: number;
}

export interface ExamSchemeInfo {
  schemeId: string | null;
  schoolTypes: string[];
  components: ExamComponent[];
  schemeTotal: number;
  complete: boolean;
  warning: string | null;
}

export interface ExamSchemesResponse {
  term: string;
  session: string;
  schemes: ExamSchemeInfo[];
}

export interface ExamScheme {
  term: string;
  session: string;
  schemeId?: string | null;
  schoolTypes?: string[];
  components?: ExamComponent[];
  schemeTotal?: number;
  complete?: boolean;
  warning?: string | null;
  schemes?: ExamSchemeInfo[];
}

export interface CreateScoreSchemePayload {
  term: string;
  session?: string;
  schoolTypes: string[];
}

export interface CreateExamComponentPayload {
  term: string;
  name: string;
  type: ExamComponentType;
  maxScore: number;
  sortOrder: number;
  session?: string;
  schemeId?: string;
  schoolTypes?: string[];
}

export type UpdateExamComponentPayload = Partial<
  Pick<ExamComponent, "name" | "type" | "maxScore" | "sortOrder">
>;

export interface UpdateSchemePayload {
  id: string;
  schoolTypes: string[];
  term: string;
  session?: string;
}

export interface DeleteSchemePayload {
  id: string;
  term: string;
  session?: string;
}

export interface DeleteComponentPayload {
  id: string;
  term: string;
  session?: string;
}

export interface UpdateComponentPayload {
  id: string;
  data: UpdateExamComponentPayload;
  term: string;
  session?: string;
}

export interface ComponentMutationResponse {
  component: ExamComponent;
  schemeTotal: number;
  complete: boolean;
  warning: string | null;
}

export interface CopySchemePayload {
  term: string;
  session?: string;
  fromSession?: string;
}

export interface CopySchemeResponse {
  message: string;
  session: string;
  components: ExamComponent[];
  schemeTotal: number;
  complete: boolean;
  warning: string | null;
}

export interface Exam {
  id: string;
  name: string;
  type: ExamType;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  componentId?: string | null;
  componentName?: string | null;
  term: string;
  session: string;
  maxScore: number;
  date: string;
  status: ExamStatus;
  scoreCount: number;
}

export interface ExamListResponse {
  exams: Exam[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateExamPayload {
  name: string;
  type: ExamType;
  subjectId: string;
  classId: string;
  componentId?: string;
  term: string;
  session?: string;
  maxScore?: number;
  date: string;
}

export interface UpdateExamPayload {
  name?: string;
  type?: ExamType;
  subjectId?: string;
  classId?: string;
  componentId?: string | null;
  term?: string;
  session?: string;
  maxScore?: number;
  date?: string;
  status?: ExamStatus;
}

export interface EnsureExamSessionPayload {
  subjectId: string;
  classId: string;
  componentId: string;
  term: string;
  session?: string;
}

export interface EnsureExamSessionResponse {
  exam: {
    id: string;
    name: string;
    subjectId: string;
    subjectName: string;
    classId: string | null;
    className: string | null;
    componentId: string | null;
    componentName: string | null;
    maxScore: number;
    status: ExamStatus;
    date: string;
  };
}

export type ExamDateRejection = "WEEKEND" | "HOLIDAY" | "OUT_OF_TERM";

export interface ExamDateError {
  error?: string;
  reason?: { type: ExamDateRejection; message: string };
}

export interface ExamRosterStudent {
  studentId: string;
  studentName: string;
  admissionNo: string;
  score: number | null;
  remarks: string | null;
}

export interface ExamRosterResponse {
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  componentId: string | null;
  componentName: string | null;
  maxScore: number;
  status: ExamStatus;
  date: string;
  roster: ExamRosterStudent[];
}

export interface SaveStudentScorePayload {
  score: number;
  remarks?: string;
}

export interface SaveStudentScoreResponse {
  studentId: string;
  studentName: string;
  admissionNo: string;
  score: number;
  remarks: string | null;
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

export interface SubmitScoresBulkPayload {
  subjectId: string;
  classId: string;
  componentId: string;
  term: string;
  session?: string;
  scores: Array<{
    studentId: string;
    score: number;
    remarks?: string;
  }>;
}

export interface SubmitScoresBulkResponse {
  message: string;
  count: number;
  examId: string;
}

export interface GetScoresBulkResponse {
  message: string;
  examId: string;
  visibleToParents?: boolean;
  broadcastStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  scores: Array<{
    studentId: string;
    score: number;
    remarks: string | null;
  }>;
}

export interface PublishScoresResponse {
  message: string;
  examId: string;
  name: string;
  type: string;
  visibleToParents: boolean;
}

export interface SubmitForApprovalResponse {
  message: string;
  requestId: string;
  status: string;
}

export interface ScoresBulkScope {
  subjectId: string;
  classId: string;
  componentId: string;
  term: string;
  session?: string;
}

export interface TermResultsResponse {  classId: string;
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

export interface StudentAcademicsResponse {
  studentId: string;
  term: string;
  session: string;
  average: number;
  bestSubject: { name: string; score: number } | null;
  worstSubject: { name: string; score: number } | null;
  attendancePercentage: number;
  position: number;
  classSize: number;
  components?: Array<{
    id: string;
    name: string;
    type: string;
    maxScore: number;
    sortOrder: number;
  }>;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    scores: Array<{ type: string; score: number; maxScore: number; componentId?: string }>;
    caTotal: number;
    examScore: number;
    total: number;
    grade: string;
    teacherName: string;
  }>;
}
