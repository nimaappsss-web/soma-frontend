import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchData } from "../../../utils/fetchData";
import { db } from "../../../db/db";
import type { Parent } from "../../principal/types";

interface ParentProfileResponse {
  parent: Parent;
}

export const useParentProfile = () => {
  const query = useQuery<ParentProfileResponse>({
    queryKey: ["parent", "me"],
    queryFn: () => fetchData("/parents/me", "GET"),
    staleTime: Infinity,
    retry: false,
  });

  return {
    parent: query.data?.parent ?? null,
    isLoading: query.isLoading,
    error: query.error,
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
