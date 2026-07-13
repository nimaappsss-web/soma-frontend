export interface SubjectAssignment {
  id: string;
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  classes: Array<{
    id: string;
    name: string;
    level: string;
    arm?: string;
  }>;
}

export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  formClassId?: string | null;
  formClass?: string | null;
  createdAt?: string;
}

export interface TeacherDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  formClassId?: string | null;
  formClass?: { id: string; name: string; level: string; arm?: string } | null;
  assignments: Array<{
    id: string;
    subject: { id: string; name: string; code?: string };
    classes: Array<{ id: string; name: string; level: string; arm?: string }>;
  }>;
}

export interface PendingInvite {
  id: string;
  email: string;
  status: "pending";
  expiresIn: number;
}

export interface UpdateTeacherPayload {
  name?: string;
  formClassId?: string | null;
  role?: string;
}

export interface TeachersResponse {
  teachers: Teacher[];
  pendingInvites: PendingInvite[];
}

export interface BulkInviteRequest {
  teachers: Array<{
    teacherEmail: string;
    role: string;
  }>;
}

export interface BulkInviteResponse {
  message: string;
  invited: number;
  failed: Array<{
    phone: string;
    reason: string;
  }>;
}

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  admissionNo?: string | null;
  status: AttendanceStatus;
  remarks?: string | null;
  date?: string;
  classId?: string;
}

export interface MarkAttendancePayload {
  classId: string;
  date: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }>;
}

export interface MarkAttendanceResponse {
  count: number;
  records: AttendanceRecord[];
}

export interface AttendanceQueryResponse {
  records: AttendanceRecord[];
  total: number;
  page: number;
  totalPages: number;
}
