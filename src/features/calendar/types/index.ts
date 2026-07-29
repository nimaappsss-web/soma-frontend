export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export type EventType = "HOLIDAY" | "EVENT" | "EXAM" | "MEETING" | "SPORTS";
export type EventAudience = "ALL" | "TEACHERS" | "PARENTS" | "STAFF";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  type: EventType;
  audience: EventAudience;
  createdBy: { id: string; name: string };
}

export interface CalendarEventListResponse {
  events: CalendarEvent[];
}

export interface CreateCalendarEventPayload {
  title: string;
  description?: string;
  date: string;
  type: EventType;
  audience: EventAudience;
}

export interface UpdateCalendarEventPayload {
  title?: string;
  description?: string;
  date?: string;
  type?: EventType;
  audience?: EventAudience;
}

export interface Holiday {
  id: string;
  date: string;
  reason: string;
  createdBy: string;
}

export interface HolidayListResponse {
  holidays: Holiday[];
}

export interface CreateHolidayPayload {
  date: string;
  reason: string;
}

export interface UpdateHolidayPayload {
  date?: string;
  reason?: string;
}

export interface AcademicTerm {
  id: string;
  term: string;
  session: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface AcademicTermListResponse {
  terms: AcademicTerm[];
}

export interface CreateAcademicTermPayload {
  term: string;
  session: string;
  startDate: string;
  endDate: string;
}

export interface UpdateAcademicTermPayload {
  term?: string;
  session?: string;
  startDate?: string;
  endDate?: string;
}
