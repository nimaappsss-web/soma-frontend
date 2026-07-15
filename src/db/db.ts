import Dexie, { type EntityTable } from "dexie";

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
  status: "ACTIVE" | "TRANSFERRED" | "WITHDRAWN" | "GRADUATED";
  schoolId?: string;
  createdAt: number;
}

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface AttendanceRecord {
  id: string;
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
  name: string;
  code?: string;
}

export interface ClassCache {
  id: string;
  name: string;
  level: string;
  arm?: string;
}

export interface TeacherFormClassCache {
  id: string;
  formClassId: string | null;
  formClass: string | null;
}

export interface TeacherAssignmentCache {
  id: string;
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
  detailJson: string;
}

export interface ParentCache {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  hasAccount: boolean;
  status: "active" | "pending";
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
  settingsJson: string;
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


