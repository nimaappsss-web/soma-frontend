import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../db/db";
import { fetchData } from "../../../utils/fetchData";
import type { Parent } from "../../principal/types";

export const useParentProfile = () => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [data, setData] = useState<{ parent: Parent } | undefined>(undefined);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const parents = await db.parents.where("userId").equals(userId).toArray();
      if (parents.length > 0) {
        setData({ parent: parents[0] as unknown as Parent });
      }
    };
    load();
  }, [userId]);

  useQuery({
    queryKey: ["parentProfile", userId],
    queryFn: async () => {
      const res = await fetchData<Parent[]>("/parents", "GET");
      if (res.length > 0) {
        await db.parents.bulkPut(
          (res as Array<Record<string, unknown>>).map((p) => ({ ...p, userId }) as any),
        );
      }
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    parent: data?.parent ?? null,
    isLoading: data === undefined,
    error: undefined,
  };
};

export const useChildrenWithDetails = (students: Parent["students"] = []) => {
  const { user } = useAuth();
  const userId = user?.id ?? "";
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
    if (!students.length || !userId) {
      setChildren([]);
      return;
    }

    const load = async () => {
      const result = await Promise.all(
        students.map(async (s) => {
          const student = await db.students.where({ id: s.id, userId }).first();
          let className: string | undefined;
          let teacherName: string | undefined;

          if (student?.classId) {
            const cls = await db.classes.where({ id: student.classId, userId }).first();
            className = cls?.name;
            const teachers = await db.teachers
              .where("userId").equals(userId)
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
  }, [students, userId]);

  return children;
};
