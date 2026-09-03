import { useLiveQuery } from "dexie-react-hooks";
import { People, ArrowRight } from "iconsax-react";
import { Link, useLocation } from "react-router";

import { db, type Student } from "../../../db/db";
import { useAuth } from "../../../contexts/AuthContext";
import { Avatar } from "../../../components/ui/Avatar";

interface SiblingBadgeProps {
  parentEmail: string;
  currentStudentId: string;
}

/**
 * Shows other students who share the same parent email — siblings.
 * Rendered inside StudentDetails below the Guardian card.
 * Uses the parentEmail Dexie index for instant offline lookup.
 */
export const SiblingBadge = ({ parentEmail, currentStudentId }: SiblingBadgeProps) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const siblings = useLiveQuery(
    async (): Promise<Student[]> => {
      if (!parentEmail || !userId) return [];
      const items = await db.students
        .where("parentEmail")
        .equals(parentEmail.trim().toLowerCase())
        .toArray();
      return items.filter((s) => s.id !== currentStudentId && s.userId === userId);
    },
    [parentEmail, currentStudentId, userId],
  );

  if (!siblings || siblings.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
          <People size={14} variant="Bold" color="#D97706" />
        </div>
        <h3 className="text-sm font-semibold text-amber-800">
          Sibling{siblings.length > 1 ? "s" : ""} ({siblings.length})
        </h3>
      </div>
      <p className="text-xs text-amber-700/70 mb-3">
        These students share the same parent email ({parentEmail}).
      </p>
      <div className="space-y-2">
        {siblings.map((s) => (
          <SiblingRow key={s.id} student={s} />
        ))}
      </div>
    </div>
  );
};

const SiblingRow = ({ student }: { student: Student }) => {
  const location = useLocation();
  const isTeacher = location.pathname.startsWith("/teach");
  const detailPath = `${isTeacher ? "/teach" : "/admin"}/students/${student.id}`;

  const className = useLiveQuery(
    () => (student.classId ? db.classes.get(student.classId)?.then((c) => c?.name) : undefined),
    [student.classId],
  );

  const hasPendingSync = useLiveQuery(
    async () => {
      const count = await db.syncQueue
        .where("userId")
        .equals(student.userId)
        .filter((i) => i.table === "students" && i.recordId === student.id && i.status === "pending")
        .count();
      return count > 0;
    },
    [student.userId, student.id],
  );

  return (
    <Link
      to={detailPath}
      className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-2.5 border border-amber-100 transition-colors hover:bg-white active:scale-[0.99]"
    >
      <Avatar name={student.name} size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray900">{student.name}</p>
        <p className="truncate text-xs text-gray500">
          {student.admissionNo ? `${student.admissionNo} · ` : ""}
          {className ?? "—"}
        </p>
      </div>
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${hasPendingSync ? "bg-amber-400" : "bg-springgreen600"}`}
        title={hasPendingSync ? "Pending sync" : "Linked"}
      />
      <ArrowRight size={14} variant="Linear" color="#8C8C8C" className="shrink-0" />
    </Link>
  );
};
