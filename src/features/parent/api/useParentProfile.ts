import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";

import { useAuth } from "../../../contexts/AuthContext";
import { db, type ParentCache } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { Parent } from "../../principal/types";

export const useParentProfile = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const cached = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as ParentCache[]);
      return db.parents.where("userId").equals(userId).toArray();
    },
    [userId],
  );

  useQuery({
    queryKey: ["parentProfile", userId],
    queryFn: async () => {
      const res = await fetchData<Parent>("/parents/me", "GET");
      await db.parents.put({
        ...(res as unknown as Record<string, unknown>),
        userId,
      } as ParentCache);
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const parent = cached?.length ? (cached[0] as unknown as Parent) : null;

  return {
    parent,
    isLoading: cached === undefined,
    error: undefined,
  };
};

const EMPTY_STUDENTS: Parent["students"] = [];

export const useChildrenWithDetails = (students: Parent["students"] = EMPTY_STUDENTS) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const studentsRef = students ?? EMPTY_STUDENTS;
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
    if (!studentsRef.length || !userId) {
      setChildren([]);
      return;
    }

    const load = async () => {
      const result = await Promise.all(
        studentsRef.map(async (s) => {
          let className = s.className;
          let teacherName = s.teacherName;

          if (!className || !teacherName) {
            const student = await db.students.get(s.id);
            const classId = student?.classId ?? s.classId;
            if (classId) {
              if (!className) className = (await db.classes.get(classId))?.name;
              if (!teacherName) {
                const teachers = await db.teachers
                  .where("userId").equals(userId)
                  .filter((t) => t.formClassId === classId)
                  .toArray();
                teacherName = teachers.map((t) => t.name).join(", ") || undefined;
              }
            }
          }

          return {
            id: s.id,
            name: s.name,
            admissionNo: s.admissionNo,
            classId: s.classId,
            className,
            teacherName,
          };
        }),
      );
      setChildren(result);
    };

    load();
  }, [studentsRef, userId]);

  return children;
};
