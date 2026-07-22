import { useEffect, useState } from "react";

import { db } from "../../../db/db";
import type { Parent } from "../../principal/types";

export const useParentProfile = () => {
  const [data, setData] = useState<{ parent: Parent } | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      const parents = await db.parents.toArray();
      if (parents.length > 0) {
        setData({ parent: parents[0] as unknown as Parent });
      }
    };
    load();
  }, []);

  return {
    parent: data?.parent ?? null,
    isLoading: data === undefined,
    error: undefined,
  };
};

export const useChildrenWithDetails = (students: Parent["students"] = []) => {
  const [children, setChildren] = useState<
    Array<{
      id: string;
      name: string;
      admissionNo: string;
      classId?: string;
      className?: string;
      teacherName?: string;
    }>
  >([]);

  useEffect(() => {
    if (!students.length) {
      setChildren([]);
      return;
    }

    const load = async () => {
      const result = await Promise.all(
        students.map(async (s) => {
          const student = await db.students.get(s.id);
          let className: string | undefined;
          let teacherName: string | undefined;

          if (student?.classId) {
            const cls = await db.classes.get(student.classId);
            className = cls?.name;
            const teachers = await db.teachers
              .filter((t) => t.formClassId === student.classId)
              .toArray();
            teacherName = teachers.map((t) => t.name).join(", ") || undefined;
          }

          return {
            id: s.id,
            name: s.name,
            admissionNo: s.admissionNo,
            classId: student?.classId,
            className,
            teacherName,
          };
        }),
      );
      setChildren(result);
    };

    load();
  }, [students]);

  return children;
};
