import Dexie, { type EntityTable } from "dexie";

export interface Student {
  id: string;
  name: string;
  studentClass: string;
  schoolId: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  className: string;
  schoolId: string;
  status: "present" | "absent" | "late";
  date: string;
  synced: boolean;
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
  synced: boolean;
  createdAt: number;
}

export const db = new Dexie("nimaDB") as Dexie & {
  students: EntityTable<Student, "id">;
  attendance: EntityTable<AttendanceRecord, "id">;
  caScores: EntityTable<CAScore, "id">;
};

db.version(2).stores({
  students: "id, name, studentClass, schoolId",
  attendance: "id, studentId, className, schoolId, date, synced",
  caScores: "id, studentId, className, schoolId, term, session, synced",
});
