import type { User } from "../../auth/types";

export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export interface InviteInfo {
  email: string;
  role: string;
  schoolId: string;
}

export interface AcceptInviteRequest {
  token: string;
  name: string;
  password: string;
  assignments: Array<{
    subjectId: string;
    classIds: string[];
  }>;
  formClassId?: string;
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
}
