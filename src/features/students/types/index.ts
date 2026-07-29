export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export type StudentStatus = "ACTIVE" | "TRANSFERRED" | "WITHDRAWN" | "GRADUATED";

export interface Student {
  id: string;
  name: string;
  admissionNo?: string;
  classId: string;
  gender?: "M" | "F" | null;
  dateOfBirth?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  status: StudentStatus;
}

export interface CreateStudentPayload {
  name: string;
  admissionNo?: string;
  classId: string;
  gender?: "M" | "F";
  dateOfBirth?: string;
  address?: string;
  imageUrl?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface UpdateStudentPayload {
  name?: string;
  admissionNo?: string;
  classId?: string;
  gender?: "M" | "F";
  dateOfBirth?: string;
  address?: string;
  imageUrl?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  status?: StudentStatus;
}

export interface BulkCreatePayload {
  students: CreateStudentPayload[];
}

export interface BulkCreateResponse {
  created: number;
  failed: Array<{
    index: number;
    reason: string;
  }>;
}

export interface StudentStats {
  total: number;
  active: number;
  byClass: Array<{ classId: string; className: string; count: number }>;
  byGender: { male: number; female: number };
  byStatus: { active: number; transferred: number; withdrawn: number; graduated: number };
}

export interface TimelineEvent {
  id: string;
  type: "ADMISSION" | "PROMOTION" | "STATUS_CHANGE" | "CLASS_TRANSFER";
  description: string;
  date: string;
}

export interface StudentTimeline {
  studentId: string;
  events: TimelineEvent[];
}

export interface SubjectScore {
  subjectId: string;
  subjectName: string;
  scores: Array<{ type: string; score: number; maxScore: number }>;
  caTotal: number;
  examScore: number;
  total: number;
  grade: string;
  teacherName: string;
}

export interface StudentAcademics {
  studentId: string;
  term: string;
  session: string;
  average: number;
  bestSubject: { name: string; score: number };
  worstSubject: { name: string; score: number };
  attendancePercentage: number;
  subjects: SubjectScore[];
  position: number;
  classSize: number;
}

export interface MonthlyAttendanceDay {
  date: string;
  status: "present" | "absent" | "holiday";
}

export interface StudentMonthlyAttendance {
  studentId: string;
  month: number;
  year: number;
  schoolDays: number;
  present: number;
  absent: number;
  percentage: number;
  days: MonthlyAttendanceDay[];
}

export interface ReserveBatchRequest {
  count: number;
  classId: string;
}

export interface ReserveBatchResponse {
  reservedAdmissions: string[];
}
