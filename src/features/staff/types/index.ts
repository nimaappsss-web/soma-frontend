export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export type StaffStatus = "ACTIVE" | "INVITED" | "INACTIVE";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  gender: "M" | "F" | null;
  role: string;
  department: string;
  designation: string;
  status: StaffStatus;
  createdAt: string;
}

export interface StaffListResponse {
  staff: StaffMember[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  phone: string;
  gender: "M" | "F";
  role: string;
  department: string;
  designation: string;
}

export interface InviteStaffPayload {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  designation: string;
}
