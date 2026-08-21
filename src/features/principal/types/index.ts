import type { User } from "../../auth/types";

export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export interface InviteInfo {
  email: string | null;
  role: string;
  schoolId: string;
  schoolName?: string;
}

export interface AcceptInviteRequest {
  token: string;
  name: string;
  password: string;
  assignments?: Array<{
    subjectId: string;
    classIds: string[];
  }>;
  formClassId?: string;
  email?: string;
  registrationToken?: string;
}

export interface GenerateInviteLinkResponse {
  token: string;
  link: string;
  expiresAt: string;
}

export interface AcceptInviteResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface InviteTeacherRequest {
  teacherEmail: string;
  role: string;
}

export interface InviteTeacherResponse {
  message: string;
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

export interface TeachersResponse {
  teachers: Teacher[];
  pendingInvites: PendingInvite[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ParentStudent {
  id: string;
  name: string;
  admissionNo: string;
  classId?: string;
  className?: string;
  teacherName?: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  hasAccount: boolean;
  image?: string | null;
  /** Present on active parents who haven't set a password yet — lets admin resend the invite link */
  inviteId?: string;
  status: "active" | "pending";
  /** Present when the parent has linked children; may be absent on pending invites */
  students?: ParentStudent[];
  createdAt: string;
  updatedAt: string;
  /** Present on pending (invited) parents */
  invitedAt?: string;
  expiresAt?: string;
  expiresIn?: number;
  emailFailed?: boolean;
  emailError?: string | null;
}

export interface ParentsResponse {
  parents: Parent[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ParentStats {
  total: number;
  active: number;
  pending: number;
}

export interface InviteParentRequest {
  name: string;
  email: string;
  studentId: string;
  phone?: string;
}

export interface InviteParentResponse {
  invite: {
    id: string;
    invitedName: string;
    invitedEmail: string;
    role: string;
    expiresAt: string;
  };
}

export interface ClassDetail {
  id: string;
  name: string;
  level: string;
  arm?: string;
  studentCount: number;
  formTeacher: { id: string; name: string; email?: string; phone?: string } | null;
  subjects?: { id: string; name: string; code?: string | null }[];
}

export interface ClassDetailResponse {
  class: ClassDetail;
}

export interface UpdateClassPayload {
  name?: string;
  level?: string;
  arm?: string;
  formTeacherId?: string;
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
}

export interface DashboardStats {
  students: { total: number; active: number; male: number; female: number };
  teachers: { total: number; active: number; pendingInvites: number };
  classes: { total: number };
  parents: { total: number; active: number; pending: number };
  subjects: { total: number };
  attendance: { today: { present: number; absent: number; percentage: number; dayOfWeek: string }; isHoliday: boolean };
  finance: { collectedThisTerm: number; outstanding: number; paymentRate: number };
}

export interface SchoolInfo {
  id: string;
  name: string;
  logo?: string;
  state: string;
  lga: string;
  schoolType: string[];
  address?: string;
  arms?: string[];
  admissionPattern?: string;
  schoolCode?: string;
  admissionCounter?: number;
  assessmentMode?: "standard" | "thirdTermAverage";
}
