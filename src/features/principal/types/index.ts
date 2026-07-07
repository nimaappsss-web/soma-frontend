import type { User } from "../../auth/types";

export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export interface InviteInfo {
  teacherPhone: string;
  schoolName: string;
  subjects: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string }>;
}

export interface AcceptInviteRequest {
  token: string;
  name: string;
  password: string;
  assignments: Array<{
    subjectId: string;
    classIds: string[];
  }>;
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
