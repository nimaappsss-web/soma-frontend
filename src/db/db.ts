import Dexie, { type EntityTable } from "dexie";

export interface Student {
  id: string;
  userId: string;
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
  status: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN" | "GRADUATED";
  schoolId?: string;
  createdAt: number;
}

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface AttendanceRecord {
  id: string;
  userId: string;
  studentId: string;
  className: string;
  schoolId: string;
  status: "present" | "absent" | "late";
  date: string;
  syncStatus: SyncStatus;
  createdAt: number;
}

export interface CAScore {
  id: string;
  userId: string;
  studentId: string;
  className: string;
  schoolId: string;
  score: number;
  maxScore: number;
  assessmentType: string;
  term: string;
  session: string;
  syncStatus: SyncStatus;
  createdAt: number;
}

export interface SubjectCache {
  id: string;
  userId: string;
  name: string;
  code?: string;
  schoolId?: string;
}

export interface ClassCache {
  id: string;
  userId: string;
  name: string;
  level: string;
  arm?: string;
  schoolId?: string;
}

export interface TeacherFormClassCache {
  id: string;
  formClassId: string | null;
  formClass: string | null;
}

export interface TeacherAssignmentCache {
  id: string;
  userId: string;
  assignmentsJson: string;
}

export interface TeacherCache {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  formClassId?: string | null;
  formClass?: string | null;
  createdAt?: string;
}

export interface PendingInviteCache {
  id: string;
  userId: string;
  email: string;
  status: "pending";
  expiresIn: number;
}

export interface TeacherDetailCache {
  id: string;
  userId: string;
  detailJson: string;
}

export interface ParentCache {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  hasAccount: boolean;
  status: "active" | "pending";
  schoolId?: string;
  students: Array<{ id: string; name: string; admissionNo: string }>;
  createdAt: string;
  updatedAt: string;
  invitedAt?: string;
  expiresAt?: string;
  expiresIn?: number;
  emailFailed?: boolean;
  emailError?: string | null;
}

export interface SyncQueueItem {
  id?: number;
  userId: string;
  table: string;
  recordId: string;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload: unknown;
  status: "pending" | "syncing" | "synced" | "failed";
  createdAt: number;
  retryCount: number;
}

export interface LessonNoteCache {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  className: string;
  classId?: string;
  date: string;
  sectionsJson: string;
  createdAt: number;
  updatedAt: number;
}

export interface SchoolSettingsCache {
  id: string;
  userId: string;
  settingsJson: string;
  updatedAt: number;
}

export interface AnnouncementCache {
  id: string;
  userId: string;
  title: string;
  message: string;
  audience: string;
  priority: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventCache {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  date: string;
  type: string;
  audience: string;
  createdBy: string;
  createdAt: number;
}

export interface HolidayCache {
  id: string;
  userId: string;
  date: string;
  reason: string;
  createdAt: number;
}

export interface AcademicTermCache {
  id: string;
  userId: string;
  term: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface AttendanceSnapshot {
  key: string;
  data: unknown;
  savedAt: number;
}

export interface AttendanceNote {
  id: string;
  userId: string;
  className: string;
  date: string;
  note: string;
  createdAt: number;
}

export interface ExamScoreCache {
  id: string;
  userId: string;
  examKey: string;
  subjectId: string;
  classId: string;
  componentId: string;
  term: string;
  session: string;
  studentId: string;
  studentName: string;
  score: number;
  remarks: string | null;
  syncStatus: SyncStatus;
  updatedAt: number;
}

export interface ExamSchemeCache {
  id: string;
  userId: string;
  term: string;
  session: string;
  schemeJson: string;
  updatedAt: number;
}

export const db = new Dexie("somaDB") as Dexie & {
  students: EntityTable<Student, "id">;
  attendance: EntityTable<AttendanceRecord, "id">;
  caScores: EntityTable<CAScore, "id">;
  subjects: EntityTable<SubjectCache, "id">;
  classes: EntityTable<ClassCache, "id">;
  teacherFormClass: EntityTable<TeacherFormClassCache, "id">;
  teacherAssignments: EntityTable<TeacherAssignmentCache, "id">;
  teachers: EntityTable<TeacherCache, "id">;
  pendingInvites: EntityTable<PendingInviteCache, "id">;
  teacherDetails: EntityTable<TeacherDetailCache, "id">;
  parents: EntityTable<ParentCache, "id">;
  syncQueue: EntityTable<SyncQueueItem, "id">;
  lessonNotes: EntityTable<LessonNoteCache, "id">;
  schoolSettings: EntityTable<SchoolSettingsCache, "id">;
  calendarEvents: EntityTable<CalendarEventCache, "id">;
  holidays: EntityTable<HolidayCache, "id">;
  academicTerms: EntityTable<AcademicTermCache, "id">;
  announcements: EntityTable<AnnouncementCache, "id">;
  attendanceSnapshots: EntityTable<AttendanceSnapshot, "key">;
  attendanceNotes: EntityTable<AttendanceNote, "id">;
  examScores: EntityTable<ExamScoreCache, "id">;
  examScheme: EntityTable<ExamSchemeCache, "id">;
};

db.version(11).stores({
  students: "id, name, classId, status",
  attendance: "id, studentId, className, schoolId, date, syncStatus",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus",
  subjects: "id",
  classes: "id, level",
  teacherFormClass: "id",
  teacherAssignments: "id",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id",
  parents: "id, status",
  syncQueue: "++id, status, createdAt",
});

db.version(12).stores({
  students: "id, name, classId, status",
  attendance: "id, studentId, className, schoolId, date, syncStatus",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus",
  subjects: "id",
  classes: "id, level",
  teacherFormClass: "id",
  teacherAssignments: "id",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id",
  parents: "id, status",
  syncQueue: "++id, status, createdAt, table",
});

db.version(13).stores({
  students: "id, name, classId, status",
  attendance: "id, studentId, className, schoolId, date, syncStatus",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus",
  subjects: "id",
  classes: "id, level",
  teacherFormClass: "id",
  teacherAssignments: "id",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id",
  parents: "id, status",
  syncQueue: "++id, status, createdAt, table, userId",
});

db.version(14).stores({
  students: "id, name, classId, status",
  attendance: "id, studentId, className, schoolId, date, syncStatus",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus",
  subjects: "id",
  classes: "id, level",
  teacherFormClass: "id",
  teacherAssignments: "id",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id",
  parents: "id, status",
  syncQueue: "++id, status, createdAt, table, userId",
  lessonNotes: "id, userId",
});

db.version(15).stores({
  students: "id, name, classId, status",
  attendance: "id, studentId, className, schoolId, date, syncStatus",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus",
  subjects: "id",
  classes: "id, level",
  teacherFormClass: "id",
  teacherAssignments: "id",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id",
  parents: "id, status",
  syncQueue: "++id, status, createdAt, table, userId",
  lessonNotes: "id, userId",
  schoolSettings: "id",
});

db.version(16).stores({
  students: "id, name, classId, status, schoolId",
  attendance: "id, studentId, className, schoolId, date, syncStatus",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus",
  subjects: "id, schoolId",
  classes: "id, level, schoolId",
  teacherFormClass: "id",
  teacherAssignments: "id",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id",
  parents: "id, status, schoolId",
  syncQueue: "++id, status, createdAt, table, userId",
  lessonNotes: "id, userId",
  schoolSettings: "id",
});

db.version(17).stores({
  students: "id, name, classId, status, schoolId",
  attendance: "id, studentId, className, schoolId, date, syncStatus, [date+className]",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus",
  subjects: "id, schoolId",
  classes: "id, level, schoolId",
  teacherFormClass: "id",
  teacherAssignments: "id",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id",
  parents: "id, status, schoolId",
  syncQueue: "++id, status, createdAt, table, userId",
  lessonNotes: "id, userId",
  schoolSettings: "id",
});

db.version(19).stores({
  students: "id, name, classId, status, schoolId, userId, [userId+classId]",
  attendance: "id, studentId, className, schoolId, date, syncStatus, userId, [date+className], [userId+date+className]",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus, userId",
  subjects: "id, schoolId, userId",
  classes: "id, level, schoolId, userId, [userId+level]",
  teacherFormClass: "id",
  teacherAssignments: "id, userId",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id, userId",
  parents: "id, status, schoolId, userId",
  syncQueue: "++id, status, createdAt, table, userId",
  lessonNotes: "id, userId",
  schoolSettings: "id, userId",
  calendarEvents: "id, userId",
  holidays: "id, userId",
  academicTerms: "id, userId",
});

db.version(18).stores({
  students: "id, name, classId, status, schoolId, userId, [userId+classId]",
  attendance: "id, studentId, className, schoolId, date, syncStatus, userId, [date+className], [userId+date+className]",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus, userId",
  subjects: "id, schoolId, userId",
  classes: "id, level, schoolId, userId, [userId+level]",
  teacherFormClass: "id",
  teacherAssignments: "id, userId",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id, userId",
  parents: "id, status, schoolId, userId",
  syncQueue: "++id, status, createdAt, table, userId",
  lessonNotes: "id, userId",
  schoolSettings: "id, userId",
}).upgrade(async (tx) => {
  const students = await tx.table("students").toArray();
  const staleStudents = students.filter((s: any) => !s.userId).map((s: any) => s.id);
  if (staleStudents.length) await tx.table("students").bulkDelete(staleStudents);

  const attendance = await tx.table("attendance").toArray();
  const staleAttendance = attendance.filter((r: any) => !r.userId).map((r: any) => r.id);
  if (staleAttendance.length) await tx.table("attendance").bulkDelete(staleAttendance);

  const caScores = await tx.table("caScores").toArray();
  const staleCAScores = caScores.filter((c: any) => !c.userId).map((c: any) => c.id);
  if (staleCAScores.length) await tx.table("caScores").bulkDelete(staleCAScores);
});

db.version(20).stores({
  students: "id, name, classId, status, schoolId, userId, [userId+classId]",
  attendance: "id, studentId, className, schoolId, date, syncStatus, userId, [date+className], [userId+date+className]",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus, userId",
  subjects: "id, schoolId, userId",
  classes: "id, level, schoolId, userId, [userId+level]",
  teacherFormClass: "id",
  teacherAssignments: "id, userId",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id, userId",
  parents: "id, status, schoolId, userId",
  syncQueue: "++id, status, createdAt, table, userId",
  lessonNotes: "id, userId",
  schoolSettings: "id, userId",
  calendarEvents: "id, userId",
  holidays: "id, userId",
  academicTerms: "id, userId",
  announcements: "id, userId",
});

db.version(21).stores({
  students: "id, name, classId, status, schoolId, userId, [userId+classId]",
  attendance: "id, studentId, className, schoolId, date, syncStatus, userId, [date+className], [userId+date+className]",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus, userId",
  subjects: "id, schoolId, userId",
  classes: "id, level, schoolId, userId, [userId+level]",
  teacherFormClass: "id",
  teacherAssignments: "id, userId",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id, userId",
  parents: "id, status, schoolId, userId",
  syncQueue: "++id, status, createdAt, table, userId",
  lessonNotes: "id, userId",
  schoolSettings: "id, userId",
  calendarEvents: "id, userId",
  holidays: "id, userId",
  academicTerms: "id, userId",
  announcements: "id, userId",
  attendanceSnapshots: "key",
});

db.version(22).stores({
  students: "id, name, classId, status, schoolId, userId, [userId+classId]",
  attendance: "id, studentId, className, schoolId, date, syncStatus, userId, [date+className], [userId+date+className]",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus, userId",
  subjects: "id, schoolId, userId",
  classes: "id, level, schoolId, userId, [userId+level]",
  teacherFormClass: "id",
  teacherAssignments: "id, userId",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id, userId",
  parents: "id, status, schoolId, userId",
  syncQueue: "++id, status, createdAt, table, userId",
  lessonNotes: "id, userId",
  schoolSettings: "id, userId",
  calendarEvents: "id, userId",
  holidays: "id, userId",
  academicTerms: "id, userId",
  announcements: "id, userId",
  attendanceSnapshots: "key",
  attendanceNotes: "id, userId, [userId+date+className]",
});

db.version(23).stores({
  students: "id, name, classId, status, schoolId, userId, [userId+classId]",
  attendance: "id, studentId, className, schoolId, date, syncStatus, userId, [date+className], [userId+date+className]",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus, userId",
  subjects: "id, schoolId, userId",
  classes: "id, level, schoolId, userId, [userId+level]",
  teacherFormClass: "id",
  teacherAssignments: "id, userId",
  teachers: "id, userId",
  pendingInvites: "id, userId",
  teacherDetails: "id, userId",
  parents: "id, status, schoolId, userId",
  syncQueue: "++id, status, createdAt, table, userId",
  lessonNotes: "id, userId",
  schoolSettings: "id, userId",
  calendarEvents: "id, userId",
  holidays: "id, userId",
  academicTerms: "id, userId",
  announcements: "id, userId",
  attendanceSnapshots: "key",
  attendanceNotes: "id, userId, [userId+date+className]",
  examScores: "id, userId, examKey, studentId, syncStatus",
  examScheme: "id, userId",
});


