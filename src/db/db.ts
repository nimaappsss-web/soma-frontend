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
  teachers?: { id: string; name: string; classes?: { id: string; name: string }[] }[];
}

export interface ClassCache {
  id: string;
  userId: string;
  name: string;
  level: string;
  arm?: string;
  schoolType?: string;
  schoolId?: string;
  studentCount?: number;
  formTeacher?: { id: string; name: string; email?: string; phone?: string } | null;
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
  image?: string | null;
  role: string;
  active?: boolean;
  approvalStatus?: "APPROVED" | "PENDING" | "REJECTED";
  formClassId?: string | null;
  formClass?: string | null;
  dateOfBirth?: string | null;
  employmentDate?: string | null;
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
  students?: Array<{ id: string; name: string; admissionNo: string }>;
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
  lastError?: string;
  nextAttemptAt?: number;
  lastAttemptAt?: number;
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

export interface NotificationCache {
  id: string;
  userId: string;
  schoolId: string;
  title: string;
  message: string;
  type: string;
  route: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
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

export interface ExamCache {
  id: string;
  userId: string;
  name: string;
  type: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  componentId: string | null;
  componentName: string | null;
  term: string;
  session: string;
  maxScore: number;
  date: string;
  status: string;
  scoreCount: number;
}

export interface ExamRosterCache {
  id: string;
  userId: string;
  examId: string;
  rosterJson: string;
  updatedAt: number;
}

export interface ExamActiveSummaryCache {
  id: string;
  userId: string;
  examKey: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string | null;
  componentId: string;
  componentName: string | null;
  type: string;
  maxScore: number;
  term: string;
  session: string;
  scoreCount: number;
  updatedAt: number;
}

export interface ExamTermResultsCache {
  id: string;
  userId: string;
  classId: string;
  term: string;
  session: string;
  resultsJson: string;
  updatedAt: number;
}

export interface ExamStudentReportCache {
  id: string;
  userId: string;
  studentId: string;
  term: string;
  session: string;
  reportJson: string;
  updatedAt: number;
}

export interface ReportSettingsCache {
  id: string;
  userId: string;
  template: string;
  theme: string;
  updatedAt: number;
}

export interface StudentTimelineCache {
  id: string;
  userId: string;
  studentId: string;
  eventsJson: string;
  createdAt: number;
}

export interface StudentAcademicsCache {
  id: string;
  userId: string;
  studentId: string;
  term: string;
  session: string;
  dataJson: string;
  createdAt: number;
}

export interface StudentMonthlyAttendanceCache {
  id: string;
  userId: string;
  studentId: string;
  month: number;
  year: number;
  dataJson: string;
  createdAt: number;
}

export interface StudentStatsCache {
  id: string;
  userId: string;
  dataJson: string;
  createdAt: number;
}

export interface TimetableCache {
  id: string;
  userId: string;
  classId: string;
  className?: string;
  title: string;
  breaksJson: string;
  updatedAt: number;
}

export interface TimetableBuildCache {
  id: string;
  userId: string;
  classId: string;
  dataJson: string;
  updatedAt: number;
}

export interface TimetableConfigCache {
  id: string; // configType is the stable key within a school
  userId: string;
  configType: string;
  name: string;
  dataJson: string; // { schedule, subjectIds, targets, doublePeriods }
  updatedAt: number;
}

export interface TimetableEntryCache {
  id: string;
  userId: string;
  timetableId: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  teacherId: string;
  teacherName?: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  updatedAt: number;
}

export interface ClassSubjectsCache {
  id: string;
  userId: string;
  classId: string;
  subjectIds: string[];
  schoolId?: string;
  updatedAt: number;
}

export interface FeeStructureItem {
  id: string;
  label: string;
  amount: number;
}

export interface FeeStructureCache {
  id: string;
  userId: string;
  classIdsJson: string;
  classNamesJson: string;
  term: string;
  session: string;
  name: string;
  amount: number;
  itemsJson: string;
  isCompulsory: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface InvoiceCache {
  id: string;
  userId: string;
  studentId: string;
  studentName?: string;
  admissionNo?: string;
  feeStructureId: string;
  feeName?: string;
  groupId?: string;
  amount: number;
  itemsJson: string;
  issuedByName?: string | null;
  status: string;
  term?: string;
  session?: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt?: number;
}

// Broadcast center — offline-first cache. `broadcastStatus` holds the class-scoped
// broadcast status blob (CA components, per-student matrix, CA/exam broadcast state,
// delivered student ids) so the teacher's Broadcast page renders instantly offline.
// `examSheetBroadcastList` holds the principal's exam-sheet approval list for the school.
export interface BroadcastStatusCache {
  id: string; // `${classId}:${term}:${session}`
  userId: string;
  classId: string;
  term: string;
  session: string;
  statusJson: string;
  updatedAt: number;
}

export interface ExamSheetBroadcastListCache {
  id: string; // userId
  userId: string;
  listJson: string; // ExamSheetBroadcastsResponse serialized
  updatedAt: number;
}

// Parent exam results — offline-first cache of the `/parents/me/exam-results`
// response, scoped per user + term so each term's published scores render
// instantly offline and the term selector can flip between cached results.
export interface ParentExamResultsCache {
  id: string; // `${userId}:${term}`
  userId: string;
  term: string;
  resultsJson: string; // ParentExamResultsResponse serialized
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
  notifications: EntityTable<NotificationCache, "id">;
  attendanceSnapshots: EntityTable<AttendanceSnapshot, "key">;
  attendanceNotes: EntityTable<AttendanceNote, "id">;
  examScores: EntityTable<ExamScoreCache, "id">;
  examScheme: EntityTable<ExamSchemeCache, "id">;
  exams: EntityTable<ExamCache, "id">;
  examRosters: EntityTable<ExamRosterCache, "id">;
  examActiveSummaries: EntityTable<ExamActiveSummaryCache, "id">;
  examTermResults: EntityTable<ExamTermResultsCache, "id">;
  examStudentReports: EntityTable<ExamStudentReportCache, "id">;
  reportSettings: EntityTable<ReportSettingsCache, "id">;
  studentTimeline: EntityTable<StudentTimelineCache, "id">;
  studentAcademics: EntityTable<StudentAcademicsCache, "id">;
  studentMonthlyAttendance: EntityTable<StudentMonthlyAttendanceCache, "id">;
  studentStats: EntityTable<StudentStatsCache, "id">;
  timetables: EntityTable<TimetableCache, "id">;
  timetableEntries: EntityTable<TimetableEntryCache, "id">;
  timetableBuilds: EntityTable<TimetableBuildCache, "id">;
  timetableConfigs: EntityTable<TimetableConfigCache, "id">;
  classSubjects: EntityTable<ClassSubjectsCache, "id">;
  feeStructures: EntityTable<FeeStructureCache, "id">;
  invoices: EntityTable<InvoiceCache, "id">;
  broadcastStatus: EntityTable<BroadcastStatusCache, "id">;
  examSheetBroadcastList: EntityTable<ExamSheetBroadcastListCache, "id">;
  parentExamResults: EntityTable<ParentExamResultsCache, "id">;
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

db.version(24).stores({
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
  exams: "id, userId, term, classId, subjectId",
  examRosters: "id, userId, examId",
});

db.version(25).stores({
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
  exams: "id, userId, term, classId, subjectId",
  examRosters: "id, userId, examId",
  examActiveSummaries: "id, userId, classId, examKey",
});

db.version(26).stores({
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
  exams: "id, userId, term, classId, subjectId",
  examRosters: "id, userId, examId",
  examActiveSummaries: "id, userId, classId, examKey",
  examTermResults: "id, userId, classId, term",
});

db.version(27).stores({
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
  exams: "id, userId, term, classId, subjectId",
  examRosters: "id, userId, examId",
  examActiveSummaries: "id, userId, classId, examKey",
  examTermResults: "id, userId, classId, term",
  examStudentReports: "id, userId, studentId, term",
  reportSettings: "id, userId",
});

db.version(28).stores({
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
  exams: "id, userId, term, classId, subjectId",
  examRosters: "id, userId, examId",
  examActiveSummaries: "id, userId, classId, examKey",
  examTermResults: "id, userId, classId, term",
  examStudentReports: "id, userId, studentId, term",
  reportSettings: "id, userId",
  studentTimeline: "id, userId, studentId",
  studentAcademics: "id, userId, studentId, term, session",
  studentMonthlyAttendance: "id, userId, studentId, month, year",
  studentStats: "id, userId",
});

db.version(29).stores({
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
  exams: "id, userId, term, classId, subjectId",
  examRosters: "id, userId, examId",
  examActiveSummaries: "id, userId, classId, examKey",
  examTermResults: "id, userId, classId, term",
  examStudentReports: "id, userId, studentId, term",
  reportSettings: "id, userId",
  studentTimeline: "id, userId, studentId",
  studentAcademics: "id, userId, studentId, term, session",
  studentMonthlyAttendance: "id, userId, studentId, month, year",
  studentStats: "id, userId",
  timetables: "id, userId, classId",
  timetableEntries: "id, userId, timetableId, classId",
});

db.version(30).stores({
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
  exams: "id, userId, term, classId, subjectId",
  examRosters: "id, userId, examId",
  examActiveSummaries: "id, userId, classId, examKey",
  examTermResults: "id, userId, classId, term",
  examStudentReports: "id, userId, studentId, term",
  reportSettings: "id, userId",
  studentTimeline: "id, userId, studentId",
  studentAcademics: "id, userId, studentId, term, session",
  studentMonthlyAttendance: "id, userId, studentId, month, year",
  studentStats: "id, userId",
  timetables: "id, userId, classId",
  timetableEntries: "id, userId, timetableId, classId",
  timetableBuilds: "id, userId, classId",
});

db.version(31).stores({
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
  exams: "id, userId, term, classId, subjectId",
  examRosters: "id, userId, examId",
  examActiveSummaries: "id, userId, classId, examKey",
  examTermResults: "id, userId, classId, term",
  examStudentReports: "id, userId, studentId, term",
  reportSettings: "id, userId",
  studentTimeline: "id, userId, studentId",
  studentAcademics: "id, userId, studentId, term, session",
  studentMonthlyAttendance: "id, userId, studentId, month, year",
  studentStats: "id, userId",
  timetables: "id, userId, classId",
  timetableEntries: "id, userId, timetableId, classId",
  timetableBuilds: "id, userId, classId",
  classSubjects: "id, userId, schoolId",
});

db.version(32).stores({
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
  exams: "id, userId, term, classId, subjectId",
  examRosters: "id, userId, examId",
  examActiveSummaries: "id, userId, classId, examKey",
  examTermResults: "id, userId, classId, term",
  examStudentReports: "id, userId, studentId, term",
  reportSettings: "id, userId",
  studentTimeline: "id, userId, studentId",
  studentAcademics: "id, userId, studentId, term, session",
  studentMonthlyAttendance: "id, userId, studentId, month, year",
  studentStats: "id, userId",
  timetables: "id, userId, classId",
  timetableEntries: "id, userId, timetableId, classId",
  timetableBuilds: "id, userId, classId",
  timetableConfigs: "id, userId, configType",
  classSubjects: "id, userId, schoolId",
});

db.version(33).stores({
  notifications: "id, userId, read, createdAt",
});

db.version(34).stores({
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
  exams: "id, userId, term, classId, subjectId",
  examRosters: "id, userId, examId",
  examActiveSummaries: "id, userId, classId, examKey",
  examTermResults: "id, userId, classId, term",
  examStudentReports: "id, userId, studentId, term",
  reportSettings: "id, userId",
  studentTimeline: "id, userId, studentId",
  studentAcademics: "id, userId, studentId, term, session",
  studentMonthlyAttendance: "id, userId, studentId, month, year",
  studentStats: "id, userId",
  timetables: "id, userId, classId",
  timetableEntries: "id, userId, timetableId, classId",
  timetableBuilds: "id, userId, classId",
  timetableConfigs: "id, userId, configType",
  classSubjects: "id, userId, schoolId",
  feeStructures: "id, userId, term",
  invoices: "id, userId, studentId, term, status",
});

db.version(35).stores({});

// v34 -> v35: FeeStructure now stores one row per structure with a classIds
// array (was one row per class sharing a groupId). Drop stale per-class rows;
// the network fetch will repopulate from the consolidated server data.
db.version(35).upgrade((tx) =>
  tx.table("feeStructures").clear().then(() => undefined),
);

// v36: syncQueue gains lastError/nextAttemptAt/lastAttemptAt for
// failure classification + exponential backoff. nextAttemptAt is indexed
// so the flush loop can cheaply find only items that are due for a retry.
db.version(36).stores({
  syncQueue: "++id, status, createdAt, table, userId, nextAttemptAt",
});

// v37: schoolSettings was once cached as the whole { settings: [...] }
// response object, which crashes consumers expecting an array. Drop those
// rows so they're repopulated from the network in the correct shape.
db.version(37)
  .stores({})
  .upgrade(async (tx) => {
    const rows = await tx
      .table("schoolSettings")
      .toArray();
    const stale = rows.filter(
      (r: { settingsJson?: unknown }) =>
        typeof r.settingsJson !== "string",
    );
    if (stale.length) {
      await tx
        .table("schoolSettings")
        .bulkDelete(stale.map((r: { id: string }) => r.id));
    }
  });

// v38: broadcast center tables. The broadcast status is cached per class scope so
// the teacher's Broadcast page reads instantly offline; the principal's exam-sheet
// approval list is cached per user. Writes are queued via the syncQueue and replayed
// when back online.
db.version(38).stores({
  broadcastStatus: "id, userId, classId, term, session",
  examSheetBroadcastList: "id, userId",
});

// v39: parent exam results cache, scoped per user + term so each term's
// published scores render instantly offline.
db.version(39).stores({
  parentExamResults: "id, userId, term",
});


