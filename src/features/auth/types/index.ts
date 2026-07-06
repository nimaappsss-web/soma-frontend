export interface LoginRequest {
  identifier: string;
  password: string;
  deviceId: string;
  deviceName: string;
}

export interface RegisterPrincipalRequest {
  principalName: string;
  principalPhone: string;
  password: string;
  principalEmail?: string;
  imageUrl?: string;
}

export interface RegisterPrincipalResponse {
  message: string;
  principalId: string;
  phone: string;
  expiresIn: number;
}

export interface SendOTPRequest {
  phone: string;
}

export interface VerifyOTPRequest {
  phone: string;
  code: string;
  deviceId?: string;
  deviceName?: string;
}

export interface VerifyOTPResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterSchoolRequest {
  schoolName: string;
  state: string;
  lga: string;
  schoolType: string;
  address?: string;
  logoUrl?: string;
}

export interface RegisterSchoolResponse {
  message: string;
  school: {
    id: string;
    name: string;
    logo?: string;
    state: string;
    lga: string;
    schoolType: string;
    address?: string;
  };
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  schoolId?: string;
  schoolName?: string;
  image?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  hasSchool?: boolean;
  needsRegistration?: boolean;
  assignments?: Array<{
    id: string;
    type: "form" | "subject";
    classId: string;
    subjectId?: string;
  }>;
}

export interface CompleteRegistrationRequest {
  name: string;
  password: string;
  assignments: Array<{
    subjectId: string;
    classIds: string[];
  }>;
}

export interface CompleteRegistrationResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};
