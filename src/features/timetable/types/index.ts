export type AxiosErrorResponse = {
  response?: {
    data?: { message?: string; conflicts?: TimetableConflict[] };
    status?: number;
  };
  message?: string;
};

export const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;

export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";

export const dayOrder: Record<DayOfWeek, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
};

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
  room?: string | null;
  timetableId?: string | null;
}

export interface TimetableBreak {
  day: DayOfWeek;
  label: string;
  start: string;
  end: string;
}

export interface TimetableListResponse {
  entries: TimetableEntry[];
  breaks?: TimetableBreak[];
  /** Per-class breaks returned on school-wide queries (used to hydrate the "copy schedule" cache). */
  breaksByClass?: Record<string, TimetableBreak[]>;
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

export interface SubjectTeacherRow {
  subjectId: string;
  name: string;
  code: string | null;
  teacherId: string;
  teacherName: string;
}

export interface BusyTeacher {
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface DraftEntry {
  id?: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  teacherName?: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
}

export interface PublishedTimetable {
  id: string;
  classId: string;
  className: string;
  title: string;
  breaks: TimetableBreak[];
  entries: TimetableEntry[];
}

export interface TimetableBuildData {
  class: { id: string; name: string };
  subjects: SubjectTeacherRow[];
  breaks: TimetableBreak[];
  title: string;
  entries: DraftEntry[];
  busyTeachers: BusyTeacher[];
}

export interface TimetableConflict {
  day: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  teacherName: string;
  currentSubjectId?: string;
  clashesWithClassId?: string;
  clashesWithClassName?: string;
  kind: "teacher-clash";
}

export interface ScheduleBreak {
  id: string;
  label: string;
  startTime: string;
  durationMinutes: number;
}

export interface DayPeriodBlock {
  id: string;
  days: DayOfWeek[];
  periodCount: number;
  startTime: string;
  endTime: string;
  breaks: ScheduleBreak[];
  periods: { startTime: string; endTime: string }[];
}

export interface BreakBlock {
  id: string;
  label: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
}

export interface DoublePeriodConfig {
  subjectId: string;
  days: DayOfWeek[];
}

export interface SubjectPick {
  subjectId: string;
  name: string;
  teacherId: string;
  teacherName: string;
}

export interface WizardDraft {
  step: number;
  title: string;
  schedule: DayPeriodBlock[];
  selectedSubjects: string[];
  targets: Record<string, number>;
  doublePeriods: DoublePeriodConfig[];
}

export interface PublishPayload {
  classId: string;
  title: string;
  breaks: TimetableBreak[];
  entries: Array<{
    subjectId: string;
    day: DayOfWeek;
    period: number;
    startTime: string;
    endTime: string;
    subjectName?: string;
    teacherId?: string;
    teacherName?: string;
    className?: string;
  }>;
}