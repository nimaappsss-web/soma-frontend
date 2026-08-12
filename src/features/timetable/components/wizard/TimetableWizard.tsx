import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, InfoCircle } from "iconsax-react";
import toast from "react-hot-toast";

import { cn } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";
import { SomaLoader } from "../../../../components/ui/SomaLoader";
import { useTimetableBuild, usePublishTimetable, useTimetableCache, useTimetableConfigs, useScheduleTemplates } from "../../api";
import { allocateWithRetry, type AllocationResult } from "../../utils/allocate";
import { breaksFromSchedule, defaultSchedule, normalizeSchedule } from "../../utils/draft";
import { scheduleConfigFromTimetable, schedulesEqual, timetableConfigFromEntries, type TimetableConfigFromEntries } from "../../utils/scheduleConfig";
import { useTimetableDraft } from "../../hooks/useTimetableDraft";
import { useClassSubjects } from "../../../class-subjects/api";
import { useClasses, useSubjects } from "../../../principal/api";
import { ScheduleStep } from "./ScheduleStep";
import { SubjectsStep } from "./SubjectsStep";
import { PreviewStep } from "./PreviewStep";
import { DAYS, type DayOfWeek, type DayPeriodBlock, type DoublePeriodConfig, type PublishPayload, type SubjectTeacherRow, type TimetableConfigDto } from "../../types";
import { effectiveSchoolType } from "../../../../utils/schoolType";

interface TimetableWizardProps {
  classId: string;
  className: string;
  onCancel: () => void;
  onPublished: () => void;
}

const STEPS = ["Schedule", "Subjects", "Preview"];

// Placeholder for steps that render no grid. The allocator is expensive (up to
// 24 seeded passes with chained evictions) and only the Preview step (and the
// publish action launched from it) ever reads a placement.
const EMPTY_ALLOCATION: AllocationResult = {
  entries: [],
  conflicts: [],
  suggestions: [],
  unmet: [],
  occupiedSlots: 0,
  totalSlots: 0,
  overflow: false,
  tooFewSlots: false,
};

export const TimetableWizard = ({ classId, className, onCancel, onPublished }: TimetableWizardProps) => {
  const build = useTimetableBuild(classId);
  const publish = usePublishTimetable();
  const { templates, subjectTemplates } = useScheduleTemplates(classId);
  const { draft, save, clear } = useTimetableDraft(classId);
  // Source of truth for an existing timetable's schedule: Dexie entries + breaks
  // are written instantly on publish, so edit mode reconstructs the real config
  // (offline-first) instead of relying on the possibly-stale build cache.
  const { entries: cacheEntries, breaks: cacheBreaks } = useTimetableCache(classId);

  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(1);
  const [seeded, setSeeded] = useState(false);

  const [title, setTitle] = useState(draft?.title ?? "Weekly Timetable");
  const initialSchedule = useMemo<DayPeriodBlock[]>(
    () => (draft?.schedule?.length ? normalizeSchedule(draft.schedule) : defaultSchedule()),
    [],
  );
  const [schedule, setSchedule] = useState<DayPeriodBlock[]>(initialSchedule);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(draft?.selectedSubjects ?? []);
  const [targets, setTargets] = useState<Record<string, number>>(draft?.targets ?? {});
  const [doublePeriods, setDoublePeriods] = useState<DoublePeriodConfig[]>(draft?.doublePeriods ?? []);

  const buildSubjects = build.data?.subjects ?? [];
  const busyTeachers = build.data?.busyTeachers ?? [];
  const { data: configs } = useTimetableConfigs();
  const { data: classesData } = useClasses();
  // The class's school-type batch determines which shared config locks it.
  // Resolved here (offline-first, keyed by schoolType) rather than the build
  // payload so locking works before/without a fresh server build response.
  const classSchoolType = useMemo(
    () => effectiveSchoolType(classesData?.classes.find((c) => c.id === classId)?.schoolType),
    [classesData, classId],
  );
  // Linked shared configuration (rigid): when the class's schoolType has one,
  // the wizard is LOCKED to it — schedule, subjects and targets are read-only.
  const lockedConfig = useMemo<TimetableConfigDto | null>(() => {
    if (classSchoolType && configs[classSchoolType]) return configs[classSchoolType];
    const fromBuild = build.data?.config;
    if (fromBuild) return fromBuild;
    return null;
  }, [classSchoolType, configs, build.data]);

  const assignments = useClassSubjects();
  const allSubjects = useSubjects();

  const subjects = useMemo<SubjectTeacherRow[]>(() => {
    const assignedIds = new Set(
      assignments.data?.find((a) => a.classId === classId)?.subjectIds ?? [],
    );
    const buildIds = new Set(buildSubjects.map((s) => s.subjectId));
    const extras: SubjectTeacherRow[] = (allSubjects.data ?? [])
      .filter((s) => assignedIds.has(s.id) && !buildIds.has(s.id))
      .map((s) => ({
        subjectId: s.id,
        name: s.name,
        code: s.code ?? null,
        teacherId: "",
        teacherName: "No teacher assigned",
      }));
    return [...buildSubjects, ...extras];
  }, [assignments.data, allSubjects.data, buildSubjects, classId]);

  // Seed subjects/title from the build endpoint once (keeps a restored draft untouched).
  useEffect(() => {
    const data = build.data;
    if (!data || seeded) return;
    setSeeded(true);
    setSelectedSubjects((cur) =>
      cur.length ? cur : data.subjects.map((s) => s.subjectId),
    );
    setTitle((cur) => cur || data.title || "Weekly Timetable");
  }, [build.data, seeded]);

  // Whether the current selection is just the build-mode "select all" default
  // (the seed above), which edit mode should replace with the published set.
  const isFullSubjectSeed = useCallback(
    (ids: string[]): boolean =>
      buildSubjects.length > 0 &&
      ids.length === buildSubjects.length &&
      buildSubjects.every((s) => ids.includes(s.subjectId)),
    [buildSubjects],
  );

  const publishedCfg = useMemo(() => timetableConfigFromEntries(cacheEntries), [cacheEntries]);

  // Latest-value refs mirroring each field's current state (safe to read inside
  // the seed effect below without stale-closure/reference-comparison traps).
  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;
  const subjectsRef = useRef(selectedSubjects);
  subjectsRef.current = selectedSubjects;
  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const doublesRef = useRef(doublePeriods);
  doublesRef.current = doublePeriods;
  const lockedRef = useRef(lockedConfig);
  lockedRef.current = lockedConfig;

  // Remembers the config we last seeded from the cache, so we can re-seed when
  // the cache refreshes (stale → fresh) without clobbering a user's real edits:
  // a field is "untouched" if it still equals the last-seeded config OR the
  // initial default. Without this, a stale cache that seeds first locks in its
  // reconstruction forever (reference-equality guard refuses the fresh rebuild).
  const lastSeededCfg = useRef<{
    schedule: DayPeriodBlock[] | null;
    subjects: string[] | null;
    targets: Record<string, number> | null;
    doublePeriods: DoublePeriodConfig[] | null;
  }>({ schedule: null, subjects: null, targets: null, doublePeriods: null });

  // Edit mode: populate the schedule AND subject config (selection, weekly
  // targets, double periods) from the class's published/cached timetable.
  // Reactive to entries+breaks (which publish writes instantly). Each field is
  // guarded independently so it only re-seeds while it is still at its untouched
  // default — a real in-progress draft or any user edit always wins.
  // Skipped entirely for config-locked classes: the shared batch config is the
  // single source of truth and must never be clobbered by the class's previous
  // published entries (e.g. a pre-config timetable with irregular day grids).
  useEffect(() => {
    if (lockedRef.current) return;
    if (cacheEntries.length === 0) return;
    const cfg = scheduleConfigFromTimetable(cacheEntries, cacheBreaks);
    if (cfg.length === 0) return;

    const seeded = lastSeededCfg.current;
    const scheduleUntouched =
      scheduleRef.current === initialSchedule ||
      (seeded.schedule !== null && schedulesEqual(scheduleRef.current, seeded.schedule));
    if (scheduleUntouched) setSchedule(cfg);

    const curSubjects = subjectsRef.current;
    const subjectsUntouched =
      curSubjects.length === 0 ||
      isFullSubjectSeed(curSubjects) ||
      (seeded.subjects !== null &&
        curSubjects.length === seeded.subjects.length &&
        seeded.subjects.every((s) => curSubjects.includes(s)));
    if (subjectsUntouched) setSelectedSubjects(publishedCfg.subjectIds);

    const curTargets = targetsRef.current;
    const targetsUntouched =
      Object.keys(curTargets).length === 0 ||
      (seeded.targets !== null &&
        Object.keys(seeded.targets).length === Object.keys(curTargets).length &&
        Object.keys(seeded.targets).every((k) => seeded.targets![k] === curTargets[k]));
    if (targetsUntouched) setTargets(publishedCfg.targets);

    const curDoubles = doublesRef.current;
    const doublesUntouched =
      curDoubles.length === 0 ||
      (seeded.doublePeriods !== null && JSON.stringify(curDoubles) === JSON.stringify(seeded.doublePeriods));
    if (doublesUntouched) setDoublePeriods(publishedCfg.doublePeriods);

    lastSeededCfg.current = {
      schedule: cfg,
      subjects: publishedCfg.subjectIds,
      targets: publishedCfg.targets,
      doublePeriods: publishedCfg.doublePeriods,
    };
  }, [cacheEntries, cacheBreaks, initialSchedule, publishedCfg, isFullSubjectSeed]);

  // Persist every change to localStorage — but only for classes WITHOUT a lock.
  // School-type batch configs are the single source of truth for locked classes,
  // so a stale per-class draft must never fight the config again.
  useEffect(() => {
    if (lockedConfig) return;
    save({ step, title, schedule, selectedSubjects, targets, doublePeriods });
  }, [save, step, title, schedule, selectedSubjects, targets, doublePeriods, lockedConfig]);

  // Locked-mode: a shared batch configuration is the single source of truth.
  // Whatever the user once drafted/edited for this class is OVERRIDDEN — the
  // config dictates schedule, subject set, weekly targets and double periods.
  // Any leftover legacy draft is cleared so it can't re-seed stale schedules.
  useEffect(() => {
    if (!lockedConfig) return;
    setSchedule(normalizeSchedule(lockedConfig.schedule ?? []));
    setSelectedSubjects(lockedConfig.subjectIds ?? []);
    setTargets(lockedConfig.targets ?? {});
    setDoublePeriods(lockedConfig.doublePeriods ?? []);
    setTitle((cur) => cur || lockedConfig.name || "Weekly Timetable");
    setStep(2); // jump straight to Preview — earlier steps are config-managed (see below).
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedConfig?.id]);

  const breaks = useMemo(() => breaksFromSchedule(schedule), [schedule]);

  const weeklySlots = useMemo(() => {
    const perDay = new Map<DayOfWeek, number>();
    for (const block of schedule) {
      for (const day of block.days) {
        perDay.set(day, Math.max(perDay.get(day) ?? 0, block.periodCount));
      }
    }
    return Array.from(perDay.values()).reduce((a, b) => a + b, 0);
  }, [schedule]);

  const noTeacherSubjects = useMemo(
    () => subjects.filter((s) => selectedSubjects.includes(s.subjectId) && !s.teacherId),
    [subjects, selectedSubjects],
  );

  const missingDays = useMemo(
    () =>
      DAYS.filter((d) => !schedule.some((b) => b.days.includes(d as DayOfWeek))),
    [schedule],
  );

  const allocation = useMemo(() => {
    // Nothing renders a grid until the Preview step, so don't run the 24-seed
    // allocator on every edit to the Schedule/Subjects steps — that synchronous
    // CPU would stall weak devices on each keypress/toggle.
    if (step !== 2) return EMPTY_ALLOCATION;
    const picked = subjects.filter((s) => selectedSubjects.includes(s.subjectId));
    return allocateWithRetry(
      { subjects: picked, targets, doublePeriods, schedule, busyTeachers },
      seed,
    );
  }, [subjects, selectedSubjects, targets, doublePeriods, schedule, busyTeachers, seed, step]);

  const handleCopySubjectConfig = (config: TimetableConfigFromEntries) => {
    const available = new Set(subjects.map((s) => s.subjectId));
    setSelectedSubjects(config.subjectIds.filter((id) => available.has(id)));
    setTargets(
      Object.fromEntries(Object.entries(config.targets).filter(([id]) => available.has(id))),
    );
    setDoublePeriods(config.doublePeriods.filter((d) => available.has(d.subjectId)));
  };

  const handlePublish = () => {
    if (noTeacherSubjects.length > 0) {
      toast.error(
        `Assign teachers first: ${noTeacherSubjects.map((s) => s.name).join(", ")}`,
      );
      return;
    }
    const payload: PublishPayload = {
      classId,
      title,
      breaks,
      entries: allocation.entries.map((e) => ({
        subjectId: e.subjectId,
        day: e.day as PublishPayload["entries"][number]["day"],
        period: e.period,
        startTime: e.startTime,
        endTime: e.endTime,
        subjectName: e.subjectName,
        teacherId: e.teacherId,
        teacherName: e.teacherName,
        className,
      })),
    };
    publish.mutate(payload, {
      onSuccess: () => {
        clear();
        onPublished();
      },
    });
  };

  // Offline-first: render the builder instantly whenever any offline source
  // (local draft, Dexie timetable cache, Dexie subjects/assignments) already has
  // content — the build endpoint only adds busy-teachers + extras in the
  // background. Only a true cold start (nothing cached anywhere, server not yet
  // answered) blocks behind the loader.
  const hasAnyConfig =
    !!draft ||
    cacheEntries.length > 0 ||
    subjects.length > 0 ||
    !!build.data;

  if (!hasAnyConfig && build.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SomaLoader />
      </div>
    );
  }

  if (!hasAnyConfig && !build.isLoading && build.error) {
    return (
      <div className="py-16 text-center text-sm text-placeholder">
        {build.error
          ? "Could not load class data. Open this builder once while online so it's cached for offline use."
          : "Class data not available."}
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray900">{className} — Timetable</h2>
          <p className="text-sm text-placeholder">Set the school-day range and subjects, then preview before publishing.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft size={16} color="#8C8C8C" />
          Exit builder
        </Button>
      </div>

      {draft && !lockedConfig && step > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-azure500/30 bg-azure500/5 px-4 py-3 text-sm text-azure500">
          <InfoCircle size={16} color="#4285F4" />
          Continuing where you left off — your draft was restored.
        </div>
      )}

      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              i === step ? "bg-gray900 text-white" : i < step ? "bg-springgreen600/10 text-springgreen600" : "bg-gray50 text-placeholder",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                i === step ? "bg-white/20" : i < step ? "bg-springgreen600 text-white" : "bg-gray100 text-gray500",
              )}
            >
              {i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {step === 0 && (
        <ScheduleStep
          isEditing={cacheEntries.length > 0}
          title={title}
          onTitleChange={setTitle}
          schedule={schedule}
          onScheduleChange={setSchedule}
          missingDays={missingDays}
          onNext={() => setStep(1)}
          templates={templates}
        />
      )}

      {step === 1 && (
        <SubjectsStep
          subjects={subjects}
          selectedSubjects={selectedSubjects}
          onToggleSubject={(id) =>
            setSelectedSubjects((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
          }
          targets={targets}
          onTargetsChange={setTargets}
          doublePeriods={doublePeriods}
          onDoublePeriodsChange={setDoublePeriods}
          weeklySlots={weeklySlots}
          availableDays={DAYS.length - missingDays.length}
          isEditing={cacheEntries.length > 0}
          subjectTemplates={subjectTemplates}
          onCopySubjectConfig={handleCopySubjectConfig}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <PreviewStep
          title={title}
          className={className}
          allocation={allocation}
          weeklySlots={weeklySlots}
          missingDays={missingDays}
          breaks={breaks}
          noTeacherSubjects={noTeacherSubjects}
          isPublishing={publish.isPending}
          onRegenerate={() => setSeed((s) => s + 1)}
          onBack={() => setStep(1)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
};