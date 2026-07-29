export interface Celebration {
  id: string;
  type: "BIRTHDAY" | "WORK_ANNIVERSARY";
  personName: string;
  personRole: "TEACHER" | "NON_TEACHER" | "PARENT" | "STAFF";
  date: string;
  age?: number;
  yearsAtSchool?: number;
  imageUrl?: string;
}

export interface CelebrationsResponse {
  celebrations: Celebration[];
  total: number;
}

export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};
