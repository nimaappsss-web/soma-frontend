export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string };
    status?: number;
  };
  message?: string;
};

export interface AnalyticsAbsentee {
  studentId: string;
  studentName: string;
  gender: string;
  admissionNo: string;
  teacherName: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
}

export interface AnalyticsByClass {
  classId: string;
  className: string;
  total: number;
  present: number;
  absent: number;
  absentees: AnalyticsAbsentee[];
  note?: string | null;
}

export interface AttendanceAnalytics {
  date: string;
  dayOfWeek: string;
  isHoliday: boolean;
  totalStudents: number;
  present: number;
  absent: number;
  percentage: number;
  byClass: AnalyticsByClass[];
}

export interface AnalyticsCalendarDay {
  date: string;
  dayOfWeek: string;
  isSchoolDay: boolean;
  isHoliday: boolean;
  present: number;
  absent: number;
  percentage: number;
}

export interface AttendanceCalendarAnalytics {
  month: number;
  year: number;
  schoolDays: number;
  holidayDates: string[];
  days: AnalyticsCalendarDay[];
}

export interface AttendanceSummaryByClass {
  classId: string;
  className: string;
  total: number;
  present: number;
  absent: number;
}

export interface AttendanceSummaryAbsentee {
  studentId: string;
  studentName: string;
  admissionNo: string;
  parentName: string;
}

export interface AttendanceSummary {
  date: string;
  dayOfWeek: string;
  isWeekend: boolean;
  isHoliday: boolean;
  totalStudents: number;
  present: number;
  absent: number;
  percentage: number;
  byClass: AttendanceSummaryByClass[];
  absentees: AttendanceSummaryAbsentee[];
}

export interface AttendanceRangeDay {
  date: string;
  percentage: number;
}

export interface AttendanceRange {
  days: AttendanceRangeDay[];
}

export interface AttendanceSnapshot {
  key: string;
  data: AttendanceAnalytics | AttendanceCalendarAnalytics | AttendanceSummary;
  savedAt: number;
}
