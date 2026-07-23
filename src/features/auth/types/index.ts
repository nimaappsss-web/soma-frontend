export interface CheckIdentifierRequest {
  identifier: string;
}

export interface CheckIdentifierResponse {
  exists: boolean;
  name?: string;
  hasPassword: boolean;
}

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
  schoolType: string[];
  address?: string;
  logoUrl?: string;
  schoolCode?: string;
  arms?: string[];
}

export interface RegisterSchoolResponse {
  message: string;
  school: {
    id: string;
    name: string;
    logo?: string;
    state: string;
    lga: string;
  schoolType: string[];
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
  phone?: string | null;
  role: string;
  active?: boolean;
  schoolId?: string;
  schoolName?: string;
  image?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  hasSchool?: boolean;
  needsRegistration?: boolean;
  needsSchoolSetup?: boolean;
  needsPhoneSetup?: boolean;
  formClassId?: string;
  formClass?: string;
  assignments?: Array<{
    id: string;
    type: "subject";
    subject: {
      id: string;
      name: string;
    };
    classes: Array<{
      id: string;
      name: string;
      level: string;
      arm?: string;
    }>;
  }>;
}

export interface CompleteRegistrationRequest {
  name: string;
  password: string;
  assignments: Array<{
    subjectId: string;
    classIds: string[];
  }>;
  formClassId?: string;
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

export interface AcceptParentInviteRequest {
  token: string;
  password: string;
}

export interface StartRegistrationRequest {
  email: string;
}

export interface StartRegistrationResponse {
  message: string;
  expiresIn: number;
}

export interface VerifyRegistrationOTPRequest {
  email: string;
  code: string;
}

export interface VerifyRegistrationOTPResponse {
  message: string;
  registrationToken: string;
}

export interface CompleteProfileRequest {
  registrationToken: string;
  name: string;
  phone: string;
  password: string;
}

export interface CompleteProfileResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface GoogleAuthRequest {
  idToken: string;
  deviceId?: string;
  deviceName?: string;
}

export interface GoogleAuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string; error?: string };
    status?: number;
  };
  message?: string;
};
