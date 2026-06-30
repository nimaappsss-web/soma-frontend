import Dexie, { type EntityTable } from "dexie";

export interface Student {
  id: string;
  name: string;
  studentClass: string;
  schoolId: string;
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

export const db = new Dexie("nimaDB") as Dexie & {
  students: EntityTable<Student, "id">;
  attendance: EntityTable<AttendanceRecord, "id">;
};

db.version(1).stores({
  students: "id, name, studentClass, schoolId",
  attendance: "id, studentId, className, schoolId, date, synced",
});
