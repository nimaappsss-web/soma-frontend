import { db } from "../../../db/db";
import { namesMatch, normalizeName } from "../../../utils/dedupe";
import type { BulkStudentRow } from "./bulkParse";

export interface StudentDuplicate {
  id: string;
  name: string;
  admissionNo?: string;
  classId: string;
  gender?: "M" | "F" | null;
  parentName?: string | null;
  parentPhone?: string | null;
  exact: boolean;
}

interface FindDuplicatesParams {
  name: string;
  classId: string;
  excludeIds?: string[];
  gender?: string;
  parentName?: string;
}

export const findDuplicateStudents = async ({
  name,
  classId,
  excludeIds = [],
  gender,
  parentName,
}: FindDuplicatesParams): Promise<StudentDuplicate[]> => {
  const all = await db.students.where("classId").equals(classId).toArray();
  const matches: StudentDuplicate[] = [];

  for (const s of all) {
    if (excludeIds.includes(s.id)) continue;
    if (!namesMatch(s.name, name)) continue;

    const genderSame = !gender || !s.gender || s.gender === gender;
    const parentSame =
      !parentName || !s.parentName || namesMatch(s.parentName, parentName);

    matches.push({
      id: s.id,
      name: s.name,
      admissionNo: s.admissionNo,
      classId: s.classId,
      gender: s.gender,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      exact: genderSame && parentSame,
    });
  }

  return matches;
};

export interface ExistingStudentRef {
  id: string;
  name: string;
  gender?: string | null;
  parentName?: string | null;
}

export interface RowDuplicate {
  kind: "in-list" | "existing";
  exact: boolean;
}

const isValidBulkRow = (row: BulkStudentRow): boolean =>
  Boolean(row.name?.trim() && row.classId);

export const findRowDuplicates = (
  row: BulkStudentRow,
  otherRows: BulkStudentRow[],
  existingByClass: Map<string, ExistingStudentRef[]>,
  excludeKeys: string[] = [],
): RowDuplicate[] => {
  if (!isValidBulkRow(row)) return [];
  const found: RowDuplicate[] = [];

  for (const other of otherRows) {
    if (other._key === row._key) continue;
    if (excludeKeys.includes(other._key)) continue;
    if (!isValidBulkRow(other)) continue;
    if (other.classId !== row.classId) continue;
    if (!namesMatch(other.name, row.name)) continue;
    found.push({ kind: "in-list", exact: true });
    break;
  }

    const existing = existingByClass.get(row.classId ?? "") ?? [];
  for (const e of existing) {
    if (!namesMatch(e.name, row.name)) continue;
    const genderSame = !row.gender || !e.gender || e.gender === row.gender;
    const parentSame =
      !row.parentName?.trim() ||
      !e.parentName?.trim() ||
      namesMatch(e.parentName, row.parentName);
    found.push({ kind: "existing", exact: genderSame && parentSame });
    break;
  }

  return found;
};

export const collectDuplicateRows = (
  rows: BulkStudentRow[],
  existingByClass: Map<string, ExistingStudentRef[]>,
): Set<string> => {
  const seen = new Map<string, string>();
  const dupKeys = new Set<string>();

  for (const row of rows) {
    if (!isValidBulkRow(row)) continue;
    const key = `${normalizeName(row.name)}::${row.classId}`;
    const prior = seen.get(key);
    if (prior) {
      dupKeys.add(row._key);
      dupKeys.add(prior);
    } else {
      seen.set(key, row._key);
    }
  }

  for (const row of rows) {
    if (!isValidBulkRow(row)) continue;
    if (dupKeys.has(row._key)) continue;
  const existing = existingByClass.get(row.classId ?? "") ?? [];
    if (existing.some((e) => namesMatch(e.name, row.name))) {
      dupKeys.add(row._key);
    }
  }

  return dupKeys;
};
