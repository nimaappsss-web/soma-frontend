import { fetchData } from "../utils/fetchData";
import { db } from "../db/db";
import type { User } from "../features/auth/types";
import type {
  AcademicTermCache,
  ClassCache,
  SubjectCache,
  TeacherCache,
  SchoolSettingsCache,
  ClassSubjectsCache,
} from "../db/db";
import { seedActiveExamSummaries, type ActiveExamSummariesResponse } from "../features/examinations/utils/activeSummaries";
import { seedReportSettings } from "../features/report-card/utils/reportCardCache";
import { seedTermResults } from "../features/examinations/utils/termResultsCache";
import type { TermResultsResponse } from "../features/examinations/types";
import type { ReportSettings } from "../features/report-card/types";
import type { BroadcastStatusResponse, ExamSheetBroadcastsResponse } from "../features/broadcast/types";
import {
  saveCachedStatus,
  hasPendingBroadcastWrite,
} from "../features/broadcast/utils/cache";

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
    const classes: ClassCache[] = Array.isArray(res) ? res : res.classes ?? [];

    const pendingForClass = new Set(
      (await db.syncQueue
        .where("userId")
        .equals(user.id)
        .toArray())
        .filter((i) => i.table === "classes" && i.status === "pending")
        .map((q) => q.recordId),
    );
    const local = await db.classes.where("userId").equals(user.id).toArray();
    const localPending = local.filter((l) => pendingForClass.has(l.id));

    await db.classes.where("userId").equals(user.id).delete();
    if (classes.length || localPending.length) {
      await db.classes.bulkAdd([
        ...classes.map((c) => ({ ...c, userId: user.id, schoolId: user.schoolId ?? "" })),
        ...localPending,
      ]);
    }
  },
};

const subjectsTask: SyncTask = {
  name: "subjects",
  run: async (user) => {
    const res = await fetchData<{ subjects: SubjectCache[] } | SubjectCache[]>(
      `/subjects?limit=200`,
      "GET",
    );
    const subjects: SubjectCache[] = Array.isArray(res) ? res : res.subjects ?? [];

    const pendingForSubject = new Set(
      (await db.syncQueue
        .where("userId")
        .equals(user.id)
        .toArray())
        .filter((i) => i.table === "subjects" && i.status === "pending")
        .map((q) => q.recordId),
    );
    const local = await db.subjects.where("userId").equals(user.id).toArray();
    const localPending = local.filter((l) => pendingForSubject.has(l.id));

    await db.subjects.where("userId").equals(user.id).delete();
    if (subjects.length || localPending.length) {
      await db.subjects.bulkAdd([
        ...subjects.map((s) => ({ ...s, userId: user.id, schoolId: user.schoolId ?? "" })),
        ...localPending,
      ]);
    }
  },
};

const classSubjectsTask: SyncTask = {
  name: "classSubjects",
  run: async (user) => {
    const res = await fetchData<{ classes: Array<{ classId: string; subjectIds: string[] }> }>(
      "/subject-assignments",
      "GET",
    );

    const pendingClassIds = new Set(
      (await db.syncQueue
        .where("userId")
        .equals(user.id)
        .toArray())
        .filter((i) => i.table === "classSubjects" && i.status === "pending")
        .flatMap((i) => ((i.payload as { classIds?: string[] })?.classIds ?? [])),
    );

    const rows: ClassSubjectsCache[] = (res?.classes ?? [])
      .filter((c: { classId: string; subjectIds: string[] }) => !pendingClassIds.has(c.classId))
      .map((c: { classId: string; subjectIds: string[] }) => ({
        id: c.classId,
        userId: user.id,
        classId: c.classId,
        subjectIds: c.subjectIds ?? [],
        schoolId: user.schoolId ?? "",
        updatedAt: Date.now(),
      }));

    const local = await db.classSubjects.where("userId").equals(user.id).toArray();
    const localPending = local.filter((l) => pendingClassIds.has(l.classId));

    await db.classSubjects.where("userId").equals(user.id).delete();
    if (rows.length || localPending.length) {
      await db.classSubjects.bulkAdd([...rows, ...localPending]);
    }
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
      await db.teachers.bulkAdd(
        (res.teachers as TeacherCache[]).map((t) => ({ ...t, userId: user.id })),
      );
    }
    if (res.pendingInvites?.length) {
      await db.pendingInvites.clear();
      await db.pendingInvites.bulkAdd(
        (res.pendingInvites as any[]).map((i) => ({ ...i, userId: user.id })),
      );
    }
  },
};

const parentsTask: SyncTask = {
  name: "parents",
  run: async (user) => {
    const res = await fetchData<{ parents: unknown[] }>("/parents?limit=200", "GET");
    if (res.parents?.length) {
      await db.parents.clear();
      await db.parents.bulkAdd((res.parents as any[]).map((p) => ({ ...p, userId: user.id })));
    }
  },
};

const parentMeTask: SyncTask = {
  name: "parents",
  run: async (user) => {
    const res = await fetchData<Record<string, unknown>>("/parents/me", "GET");
    if (res?.id) {
      await db.parents.where("userId").equals(user.id).delete();
      await db.parents.put({ ...(res as any), userId: user.id });
    }
  },
};

const schoolSettingsTask: SyncTask = {
  name: "schoolSettings",
  run: async (user) => {
    const res = await fetchData<SchoolSettingsCache>("/school/settings", "GET");
    if (res) {
      await db.schoolSettings.put({ ...res, id: "default", userId: user.id, updatedAt: Date.now() });
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
      userId: user.id,
      assignmentsJson: JSON.stringify(assignments),
    });
  },
};

const academicTermsTask: SyncTask = {
  name: "academicTerms",
  run: async (user) => {
    const res = await fetchData<{ terms: AcademicTermCache[] }>("/academic-terms", "GET");
    const serverTerms: AcademicTermCache[] = res.terms ?? [];

    const pendingForTerm = new Set(
      (await db.syncQueue
        .where({ table: "academicTerms", status: "pending" })
        .toArray())
        .map((q) => q.recordId),
    );
    const local = await db.academicTerms.where("userId").equals(user.id).toArray();
    const localPending = local.filter((l) => pendingForTerm.has(l.id));

    await db.academicTerms.where("userId").equals(user.id).delete();
    if (serverTerms.length || localPending.length) {
      await db.academicTerms.bulkAdd([
        ...serverTerms.map((t) => ({ ...t, userId: user.id })),
        ...localPending,
      ]);
    }
  },
};

const examScoresPullTask: SyncTask = {
  name: "examScores",
  run: async (user) => {
    let res: ActiveExamSummariesResponse | undefined;
    try {
      res = await fetchData<ActiveExamSummariesResponse>("/assessments/active-scores", "GET");
    } catch {
      return;
    }
    await seedActiveExamSummaries(user.id, res?.exams ?? []);
  },
};

const termResultsPullTask: SyncTask = {
  name: "termResults",
  run: async (user) => {
    const formClass = await db.teacherFormClass.get(user.id);
    if (!formClass?.formClassId) return;
    const terms = await db.academicTerms.where("userId").equals(user.id).toArray();
    const active = terms.find((t) => t.isCurrent) ?? terms[0];
    if (!active) return;
    try {
      const res = await fetchData<TermResultsResponse>(
        `/results/term?classId=${formClass.formClassId}&term=${active.term}&session=`,
        "GET",
      );
      await seedTermResults(user.id, formClass.formClassId, active.term, "", res);
    } catch {
      return;
    }
  },
};

const reportSettingsPullTask: SyncTask = {
  name: "reportSettings",
  run: async (user) => {
    try {
      const res = await fetchData<ReportSettings>("/report-settings", "GET");
      await seedReportSettings(user.id, res);
    } catch {
      return;
    }
  },
};

const broadcastStatusTask: SyncTask = {
  name: "broadcastStatus",
  run: async (user) => {
    const formClass = await db.teacherFormClass.get(user.id);
    if (!formClass?.formClassId) return;
    const terms = await db.academicTerms.where("userId").equals(user.id).toArray();
    const active = terms.find((t) => t.isCurrent) ?? terms[0];
    if (!active) return;
    try {
      const res = await fetchData<BroadcastStatusResponse>(
        `/results/broadcast/status?classId=${formClass.formClassId}&term=${active.term}&session=`,
        "GET",
      );
      const hasPending = await hasPendingBroadcastWrite(user.id);
      if (!hasPending) {
        await saveCachedStatus(
          user.id,
          formClass.formClassId,
          active.term,
          res.session ?? "",
          res,
        );
      }
    } catch {
      return;
    }
  },
};

const examSheetBroadcastListTask: SyncTask = {
  name: "examSheetBroadcasts",
  run: async (user) => {
    try {
      const res = await fetchData<ExamSheetBroadcastsResponse>("/exams/sheet-broadcasts", "GET");
      const hasPending = await hasPendingBroadcastWrite(user.id);
      if (!hasPending) {
        await db.examSheetBroadcastList.put({
          id: user.id,
          userId: user.id,
          listJson: JSON.stringify(res),
          updatedAt: Date.now(),
        });
      }
    } catch {
      return;
    }
  },
};

const principalTasks: SyncTask[] = [
  classesTask,
  subjectsTask,
  classSubjectsTask,
  teachersTask,
  parentsTask,
  schoolSettingsTask,
  academicTermsTask,
  reportSettingsPullTask,
  examSheetBroadcastListTask,
];

const teacherTasks: SyncTask[] = [
  teacherFormClassTask,
  teacherAssignmentsTask,
  classesTask,
  subjectsTask,
  academicTermsTask,
  termResultsPullTask,
  examScoresPullTask,
  reportSettingsPullTask,
  broadcastStatusTask,
];

const parentTasks: SyncTask[] = [
  parentMeTask,
];

function getTasksForRole(role: string): SyncTask[] {
  const normalized = role?.toLowerCase() ?? "";
  if (normalized === "principal") return principalTasks;
  if (normalized === "teacher") return teacherTasks;
  if (normalized === "parent") return parentTasks;
  return [];
}

const SYNC_DONE_KEY = "soma_initial_sync_done";

export async function needsInitialSync(): Promise<boolean> {
  if (localStorage.getItem(SYNC_DONE_KEY) === "true") return false;
  const count = await db.classes.count();
  if (count > 0) {
    localStorage.setItem(SYNC_DONE_KEY, "true");
    return false;
  }
  return true;
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

  localStorage.setItem(SYNC_DONE_KEY, "true");
}
