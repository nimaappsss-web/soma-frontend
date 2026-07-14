export const lessonNoteKeys = {
  all: ["lesson-note"] as const,
  lists: () => [...lessonNoteKeys.all, "list"] as const,
  list: (id: string) => [...lessonNoteKeys.all, "list", id] as const,
  details: () => [...lessonNoteKeys.all, "detail"] as const,
  detail: (id: string) => [...lessonNoteKeys.details(), id] as const,
};
