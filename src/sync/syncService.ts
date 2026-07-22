import { fetchData } from "../utils/fetchData";
import { db } from "../db/db";
import type { User } from "../features/auth/types";
import type { ClassCache, SubjectCache, TeacherCache, SchoolSettingsCache } from "../db/db";

export interface SyncProgress {
  current: number;
  total: number;
  table: string;
}

type SyncTask = {
  name: string;
  run: (user: User) => Promise<void>;
};

const classesTask: SyncTask = {
  name: "classes",
  run: async (user) => {
    const res = await fetchData<{ classes: ClassCache[] } | ClassCache[]>("/classes", "GET");
    const classes = Array.isArray(res) ? res : res.classes;
    await db.classes.clear();
    await db.classes.bulkAdd(classes.map((c) => ({ ...c, schoolId: user.schoolId ?? "" })));
  },
};

const subjectsTask: SyncTask = {
  name: "subjects",
  run: async (user) => {
    const res = await fetchData<{ subjects: SubjectCache[] } | SubjectCache[]>(
      `/subjects?limit=200`,
      "GET",
    );
    const subjects = Array.isArray(res) ? res : res.subjects;
    await db.subjects.clear();
    await db.subjects.bulkAdd(subjects.map((s) => ({ ...s, schoolId: user.schoolId ?? "" })));
  },
};

const teachersTask: SyncTask = {
  name: "teachers",
  run: async (user) => {
    const res = await fetchData<{ teachers: TeacherCache[]; pendingInvites: unknown[] }>(
      "/teachers?limit=200",
      "GET",
    );
    if (res.teachers?.length) {
      await db.teachers.clear();
      await db.teachers.bulkAdd(res.teachers);
    }
    if (res.pendingInvites?.length) {
      await db.pendingInvites.clear();
      await db.pendingInvites.bulkAdd(res.pendingInvites as any);
    }
  },
};

const parentsTask: SyncTask = {
  name: "parents",
  run: async () => {
    const res = await fetchData<{ parents: unknown[] }>("/parents?limit=200", "GET");
    if (res.parents?.length) {
      await db.parents.clear();
      await db.parents.bulkAdd(res.parents as any);
    }
  },
};

const schoolSettingsTask: SyncTask = {
  name: "schoolSettings",
  run: async () => {
    const res = await fetchData<SchoolSettingsCache>("/school/settings", "GET");
    if (res) {
      await db.schoolSettings.put({ ...res, id: "default", updatedAt: Date.now() });
    }
  },
};

const teacherFormClassTask: SyncTask = {
  name: "teacherFormClass",
  run: async (user) => {
    const res = await fetchData<{ formClassId?: string | null; formClass?: { id: string; name: string } | null }>(
      "/teachers/form-class",
      "GET",
    );
    await db.teacherFormClass.put({
      id: user.id,
      formClassId: res?.formClassId ?? res?.formClass?.id ?? null,
      formClass: res?.formClass?.name ?? null,
    });
  },
};

const teacherAssignmentsTask: SyncTask = {
  name: "teacherAssignments",
  run: async (user) => {
    const res = await fetchData<{ assignments: unknown[] }>("/teachers/assignments", "GET");
    const assignments = res?.assignments ?? [];
    await db.teacherAssignments.put({
      id: user.id,
      assignmentsJson: JSON.stringify(assignments),
    });
  },
};

const principalTasks: SyncTask[] = [
  classesTask,
  subjectsTask,
  teachersTask,
  parentsTask,
  schoolSettingsTask,
];

const teacherTasks: SyncTask[] = [
  teacherFormClassTask,
  teacherAssignmentsTask,
  classesTask,
  subjectsTask,
];

const parentTasks: SyncTask[] = [
  parentsTask,
];

function getTasksForRole(role: string): SyncTask[] {
  const normalized = role?.toLowerCase() ?? "";
  if (normalized === "principal") return principalTasks;
  if (normalized === "teacher") return teacherTasks;
  if (normalized === "parent") return parentTasks;
  return [];
}

export async function needsInitialSync(): Promise<boolean> {
  const count = await db.classes.count();
  return count === 0;
}

export async function performSync(
  user: User,
  onProgress?: (progress: SyncProgress) => void,
): Promise<void> {
  const tasks = getTasksForRole(user.role);
  const total = tasks.length;

  for (let i = 0; i < total; i++) {
    const task = tasks[i];
    onProgress?.({ current: i + 1, total, table: task.name });
    await task.run(user);
  }
}
