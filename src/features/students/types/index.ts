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
