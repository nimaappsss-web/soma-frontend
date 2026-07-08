import Dexie, { type EntityTable } from "dexie";

export interface Student {
  id: string;
  name: string;
  studentClass: string;
  schoolId: string;
  avatarUrl?: string;
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
}

export interface ClassCache {
  id: string;
  name: string;
  level: string;
  arm?: string;
}

export interface TeacherFormClassCache {
  id: string;
  formClass: string | null;
}

export interface TeacherAssignmentCache {
  id: string;
  assignmentsJson: string;
}

export interface TeacherCache {
  id: string;
  name: string;
  email: string;
  role: string;
  formClassId?: string | null;
  formClass?: string | null;
  createdAt?: string;
}

export interface PendingInviteCache {
  id: string;
  email: string;
  status: "pending";
  expiresIn: number;
}

export interface TeacherDetailCache {
  id: string;
  detailJson: string;
}

export const db = new Dexie("nimaDB") as Dexie & {
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
};

db.version(6).stores({
  students: "id, name, studentClass, schoolId",
  attendance: "id, studentId, className, schoolId, date, syncStatus",
  caScores: "id, studentId, className, schoolId, term, session, syncStatus",
  subjects: "id",
  classes: "id, level",
  teacherFormClass: "id",
  teacherAssignments: "id",
  teachers: "id",
  pendingInvites: "id",
  teacherDetails: "id",
});

export const clearUserData = async () => {
  await Promise.all([
    db.teacherFormClass.clear(),
    db.teacherAssignments.clear(),
    db.teachers.clear(),
    db.pendingInvites.clear(),
    db.teacherDetails.clear(),
  ]);
};
