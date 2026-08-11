export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export interface ClassSubjectAssignment {
  classId: string;
  className?: string;
  subjectIds: string[];
}

export interface ClassSubjectsResponse {
  classes: ClassSubjectAssignment[];
}

export interface SaveClassSubjectsPayload {
  classIds: string[];
  subjectIds: string[];
}