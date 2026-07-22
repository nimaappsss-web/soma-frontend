import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveQuery } from "dexie";

import { fetchData } from "../../../utils/fetchData";
import { db, type LessonNoteCache } from "../../../db/db";
import type {
  LessonNote,
  GenerateRequest,
  GenerateResponse,
  CurriculumResponse,
} from "../types";
import { addToQueue } from "../../../sync/syncQueue";

const toCache = (note: LessonNote): LessonNoteCache => ({
  id: note.id,
  userId: note.userId,
  subjectId: note.subjectName,
  subjectName: note.subjectName,
  topic: note.topic,
  className: note.className,
  classId: "",
  date: note.date,
  sectionsJson: JSON.stringify(note.content),
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

const fromCache = (c: LessonNoteCache): LessonNote => ({
  id: c.id,
  userId: c.userId,
  subjectName: c.subjectName,
  className: c.className,
  term: 1,
  week: 1,
  topic: c.topic,
  date: c.date,
  content: JSON.parse(c.sectionsJson),
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

export const useLessonNotes = (userId: string) => {
  const [notes, setNotes] = useState<LessonNote[]>([]);

  useEffect(() => {
    if (!userId) return;
    const sub = liveQuery(() =>
      db.lessonNotes.where("userId").equals(userId).toArray(),
    ).subscribe({
      next: (data) => setNotes((data as LessonNoteCache[]).map(fromCache)),
    });
    return () => sub.unsubscribe();
  }, [userId]);

  useQuery({
    queryKey: ["lessonNotes", userId],
    queryFn: async () => {
      const res = await fetchData<{ notes: LessonNote[] }>("/lesson-notes", "GET");
      const cached = (res.notes ?? []).map(toCache);
      await db.lessonNotes.bulkPut(cached);
      return res;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return notes;
};

export const saveLessonNote = async (note: LessonNote) => {
  const now = Date.now();
  const toSave = { ...note, updatedAt: now, createdAt: note.createdAt || now };
  await db.lessonNotes.put(toCache(toSave), note.id);
  await addToQueue({
    userId: note.userId,
    table: "lessonNotes",
    recordId: note.id,
    endpoint: `/lesson-notes/${note.id}`,
    method: "PUT",
    payload: toSave,
  });
};

export const deleteLessonNote = async (id: string, userId: string) => {
  const existing = await db.lessonNotes.where({ id, userId }).first();
  if (!existing) return;
  await db.lessonNotes.delete(id);
  await addToQueue({
    userId,
    table: "lessonNotes",
    recordId: id,
    endpoint: `/lesson-notes/${id}`,
    method: "DELETE",
    payload: {},
  });
};

export const useCurriculumSubjects = (className: string) => {
  return useQuery<string[]>({
    queryKey: ["curriculum", "subjects", className],
    queryFn: async () => {
      if (!className) return [];
      const res = await fetchData<CurriculumResponse>(
        `/lesson-notes/curriculum?className=${encodeURIComponent(className)}`,
        "GET",
      );
      return res.subjects ?? [];
    },
    enabled: !!className,
    staleTime: Infinity,
  });
};

export const useCurriculumTopics = (className: string, subjectName: string) => {
  return useQuery({
    queryKey: ["curriculum", "topics", className, subjectName],
    queryFn: async () => {
      if (!className || !subjectName) return [];
      const res = await fetchData<CurriculumResponse>(
        `/lesson-notes/curriculum?className=${encodeURIComponent(className)}&subjectName=${encodeURIComponent(subjectName)}`,
        "GET",
      );
      return res.topics ?? [];
    },
    enabled: !!className && !!subjectName,
    staleTime: Infinity,
  });
};

export const useGenerateLessonNote = () => {
  const [generating, setGenerating] = useState(false);

  const generate = useCallback(
    async (params: GenerateRequest) => {
      setGenerating(true);
      try {
        const data: GenerateResponse = await fetchData("/lesson-notes/generate", "POST", params);
        return data;
      } finally {
        setGenerating(false);
      }
    },
    [],
  );

  return { generate, generating };
};
