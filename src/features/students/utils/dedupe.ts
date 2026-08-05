import { db } from "../../../db/db";
import { namesMatch } from "../../../utils/dedupe";

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
