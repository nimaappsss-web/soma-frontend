export const teacherKeys = {
  all: ["teacher"] as const,
  details: () => [...teacherKeys.all, "detail"] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
  formClassDetails: () => [...teacherKeys.all, "form-class", "detail"] as const,
  formClassDetail: (id: string) => [...teacherKeys.formClassDetails(), id] as const,
  assignmentDetails: () => [...teacherKeys.all, "assignments", "detail"] as const,
  assignmentDetail: (id: string) => [...teacherKeys.assignmentDetails(), id] as const,
};
