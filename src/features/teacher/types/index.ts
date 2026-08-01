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
  phone?: string | null;
  address?: string | null;
  gender?: "M" | "F" | null;
  dateOfBirth?: string | null;
  profilePictureUrl?: string | null;
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
  phone?: string | null;
  address?: string | null;
  gender?: "M" | "F" | null;
  dateOfBirth?: string | null;
  profilePictureUrl?: string | null;
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

export type AttendanceBlockedType = "HOLIDAY" | "WEEKEND" | "OUT_OF_TERM" | "FUTURE";

export interface AttendanceReason {
  available: boolean;
  type?: AttendanceBlockedType;
  message?: string;
}

export interface AttendanceQueryResponse {
  records: AttendanceRecord[];
  total: number;
  page: number;
  totalPages: number;
  reason?: AttendanceReason;
}

export interface AttendanceAvailability {
  date: string;
  available: boolean;
  reason?: {
    type: AttendanceBlockedType;
    message: string;
  };
}

export interface TeacherStats {
  total: number;
  active: number;
  pendingInvites: number;
  byGender: { male: number; female: number };
}

export interface AttendanceSummaryByClass {
  classId: string;
  className: string;
  total: number;
  present: number;
  absent: number;
}

export interface AttendanceSummary {
  date: string;
  isHoliday: boolean;
  totalStudents: number;
  present: number;
  absent: number;
  percentage: number;
  byClass: AttendanceSummaryByClass[];
}

export interface DailyStat {
  present: number;
  absent: number;
  total: number;
}

export interface AttendanceClassSummary {
  classId: string;
  className: string;
  from: string;
  to: string;
  totalStudents: number;
  present: number;
  absent: number;
  percentage: number;
  schoolDays: number;
  dailyStats: Record<string, DailyStat>;
}

export interface AttendanceTeacherSummary {
  teacherId: string;
  teacherName: string;
  from: string;
  to: string;
  totalMarked: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface AttendanceCalendarDay {
  date: string;
  dayOfWeek: string;
  isSchoolDay: boolean;
  isHoliday: boolean;
  isWeekend?: boolean;
  isOutOfTerm?: boolean;
  blockedType?: AttendanceBlockedType;
  blockedReason?: string;
  present: number;
  absent: number;
  percentage: number;
}

export interface AttendanceCalendar {
  month: number;
  year: number;
  schoolDays: number;
  days: AttendanceCalendarDay[];
}

export interface ClearAttendanceRequest {
  classId: string;
  date: string;
}

export interface ClearAttendanceResponse {
  message: string;
  count: number;
}
