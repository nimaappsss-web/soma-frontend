import { db } from "../db/db";

export type EmailLookupResult =
  | { found: false }
  | { found: true; type: "parent"; parentName: string; parentEmail: string }
  | { found: true; type: "staff"; staffName: string; staffEmail: string; staffRole?: string }
  | { found: true; type: "sibling"; studentName: string; studentClass: string; studentId: string };

/**
 * Searches the local, offline-first Dexie cache for an email across every
 * entity that can own an email in the school: registered parents, staff
 * (teachers), pending invites, and students' parent contacts. Returns which
 * entity owns the email so the UI can show a contextual badge as the admin
 * types — immediately, without any network call.
 */
export const findEmailOwner = async (
  email: string,
  userId: string,
  currentUserEmail?: string,
  excludeStudentId?: string,
): Promise<EmailLookupResult> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { found: false };

  // 0. The signed-in admin's own account (e.g. principal email)
  if (currentUserEmail && currentUserEmail.trim().toLowerCase() === normalized) {
    return {
      found: true,
      type: "staff",
      staffName: "your school account",
      staffEmail: normalized,
    };
  }
  // 1. Registered parents
  const parent = await db.parents
    .where("email")
    .equals(normalized)
    .first();

  if (parent) {
    return {
      found: true,
      type: "parent",
      parentName: parent.name,
      parentEmail: parent.email,
    };
  }

  // 2. Staff / teachers
  const staffMatch = await db.teachers
    .where("email")
    .equals(normalized)
    .filter((t) => t.userId === userId)
    .first();

  if (staffMatch) {
    return {
      found: true,
      type: "staff",
      staffName: staffMatch.name,
      staffEmail: staffMatch.email,
      staffRole: staffMatch.role,
    };
  }

  // 3. Pending staff invites
  const pendingMatch = await db.pendingInvites
    .where("email")
    .equals(normalized)
    .filter((i) => i.userId === userId)
    .first();

  if (pendingMatch) {
    return {
      found: true,
      type: "staff",
      staffName: pendingMatch.email,
      staffEmail: pendingMatch.email,
    };
  }

  // 4. Students with this parent email (potential siblings)
  const sibling = await db.students
    .where("parentEmail")
    .equals(normalized)
    .filter(
      (s) => s.userId === userId && (!excludeStudentId || s.id !== excludeStudentId),
    )
    .first();

  if (sibling) {
    const classRecord = sibling.classId
      ? await db.classes.get(sibling.classId)
      : undefined;

    return {
      found: true,
      type: "sibling",
      studentName: sibling.name,
      studentClass: classRecord?.name ?? sibling.classId ?? "—",
      studentId: sibling.id,
    };
  }

  return { found: false };
};
