export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";

export interface TimetableEntry {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  day: DayOfWeek;
  period: number;
  startTime: string;
  endTime: string;
  room: string | null;
}

export interface TimetableListResponse {
  entries: TimetableEntry[];
}

export interface CreateTimetableEntryPayload {
  classId: string;
  subjectId: string;
  teacherId: string;
  day: DayOfWeek;
  period: number;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface UpdateTimetableEntryPayload {
  subjectId?: string;
  teacherId?: string;
  day?: DayOfWeek;
  period?: number;
  startTime?: string;
  endTime?: string;
  room?: string;
}

export interface BulkSetTimetablePayload {
  classId: string;
  entries: Array<{
    subjectId: string;
    teacherId: string;
    day: DayOfWeek;
    period: number;
    startTime: string;
    endTime: string;
  }>;
}

export interface BulkSetTimetableResponse {
  entries: TimetableEntry[];
}
