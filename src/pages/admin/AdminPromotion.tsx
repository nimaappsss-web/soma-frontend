import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Medal, TickCircle, Warning2 } from "iconsax-react";

import { Button } from "../../components/ui/button";
import { SelectDropdown } from "../../components/ui/select-dropdown";
import { DateInput } from "../../components/ui/date-input";
import { SomaLoader } from "../../components/ui/SomaLoader";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { HelpHint } from "../../components/ui/HelpHint";
import { useAuth } from "../../contexts/AuthContext";
import { useClasses } from "../../features/principal/api/useClasses";
import { useAllStudents } from "../../features/students/api/useAllStudents";
import { useAcademicTerms } from "../../features/calendar/api/useAcademicTerms";
import { usePromoteStudents, useSessionRollover } from "../../features/promotion/api";
import { recommendDestinations, sortClassesForPromotion } from "../../features/promotion/utils/classOrder";
import type { PromotionAction, RolloverTermInput } from "../../features/promotion/types";
import type { Class } from "../../features/principal/api/useClasses";
import type { Student } from "../../features/students/types";

const GRADUATE = "GRADUATE";
type TermKey = "first" | "second" | "third";
const TERM_KEYS: TermKey[] = ["first", "second", "third"];
const TERM_LABELS: Record<TermKey, string> = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

const STEP_LABELS = ["Classes", "Students", "New Session", "Review"];

const shiftYear = (iso: string) => {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

const defaultTermDates = (): Record<TermKey, { startDate: string; endDate: string }> => {
  const now = new Date();
  const y = now.getFullYear();
  return {
    first: { startDate: `${y}-09-01`, endDate: `${y + 1}-01-08` },
    second: { startDate: `${y + 1}-01-11`, endDate: `${y + 1}-04-03` },
    third: { startDate: `${y + 1}-04-20`, endDate: `${y + 1}-07-31` },
  };
};

export const AdminPromotion = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: classesData, isLoading: classesLoading } = useClasses();
  const { data: studentsData, isLoading: studentsLoading } = useAllStudents(user?.id ?? "");
  const { data: termsData, isLoading: termsLoading } = useAcademicTerms();

  const promoteMutation = usePromoteStudents();
  const rolloverMutation = useSessionRollover();

  const [step, setStep] = useState(0);
  const [destinations, setDestinations] = useState<Record<string, string>>({});
  const [studentActions, setStudentActions] = useState<Record<string, PromotionAction>>({});
  const [termDates, setTermDates] = useState(defaultTermDates());

  const classes = useMemo(
    () => sortClassesForPromotion(classesData?.classes ?? []),
    [classesData],
  );

  const activeStudents = useMemo(
    () => (studentsData ?? []).filter((s) => s.status === "ACTIVE"),
    [studentsData],
  );

  const activeCountByClass = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of activeStudents) map[s.classId] = (map[s.classId] ?? 0) + 1;
    return map;
  }, [activeStudents]);

  // Prefill recommended destinations (JSS 2B -> JSS 3B) once classes load.
  useEffect(() => {
    if (!classes.length) return;
    setDestinations((prev) => {
      if (Object.keys(prev).length) return prev;
      return recommendDestinations(classes) as Record<string, string>;
    });
  }, [classes]);

  // Prefill new-session dates by shifting the existing term dates one year forward.
  useEffect(() => {
    const terms = termsData?.terms ?? [];
    if (!terms.length || termsData === undefined) return;
    setTermDates((prev) => {
      const next = { ...prev };
      for (const t of terms) {
        const key = t.term as TermKey;
        if (TERM_KEYS.includes(key)) {
          next[key] = { startDate: shiftYear(t.startDate), endDate: shiftYear(t.endDate) };
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termsData !== undefined]);

  const defaultActionFor = (student: Student): PromotionAction =>
    destinations[student.classId] === GRADUATE ? "GRADUATE" : "PROMOTE";

  const actionFor = (student: Student): PromotionAction =>
    studentActions[student.id] ?? defaultActionFor(student);

  const studentsByClass = useMemo(() => {
    const map: Record<string, Student[]> = {};
    for (const s of activeStudents) (map[s.classId] ??= []).push(s);
    for (const key of Object.keys(map)) map[key].sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [activeStudents]);

  const moves = useMemo(
    () =>
      Object.entries(destinations)
        .filter(([, to]) => to && to !== GRADUATE)
        .map(([fromClassId, toClassId]) => ({ fromClassId, toClassId })),
    [destinations],
  );

  const overrides = useMemo(
    () =>
      activeStudents
        .filter((s) => actionFor(s) !== defaultActionFor(s))
        .map((s) => ({
          studentId: s.id,
          action: studentActions[s.id]!,
          ...(studentActions[s.id] === "PROMOTE" ? { toClassId: destinations[s.classId] } : {}),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeStudents, studentActions, destinations],
  );

  const termDatesValid = useMemo(
    () =>
      TERM_KEYS.every((k) => {
        const { startDate, endDate } = termDates[k];
        return !!startDate && !!endDate && new Date(endDate) > new Date(startDate);
      }),
    [termDates],
  );

  const summary = useMemo(() => {
    let promoted = 0;
    let repeated = 0;
    let graduated = 0;
    for (const s of activeStudents) {
      const action = actionFor(s);
      if (action === "PROMOTE") promoted++;
      else if (action === "REPEAT") repeated++;
      else graduated++;
    }
    return { promoted, repeated, graduated };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStudents, studentActions, destinations]);

  const destinationOptions = (cls: Class) => [
    ...classes
      .filter((c) => c.id !== cls.id)
      .map((c) => ({ value: c.id, label: c.name })),
    { value: GRADUATE, label: "Graduate (final class)" },
  ];

  const commit = () => {
    promoteMutation.mutate(
      { moves, overrides },
      {
        onSuccess: () => {
          rolloverMutation.mutate(
            {
              terms: TERM_KEYS.map((k) => ({ term: k, ...termDates[k] })) as RolloverTermInput[],
            },
            {
              onSuccess: () => navigate("/admin/students"),
              onError: () => navigate("/admin/students"),
            },
          );
        },
      },
    );
  };

  const isLoading = classesLoading || studentsLoading;
  const committing = promoteMutation.isPending || rolloverMutation.isPending;

  if (isLoading || termsLoading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <PageHeader title="Promotion" />
        <div className="py-16 text-center">
          <SomaLoader label="Loading school data" className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (!classes.length) {
    return (
      <div className="p-4 md:p-6 w-full">
        <PageHeader title="Promotion" />
        <EmptyState
          icon={<Medal size={30} variant="Bold" color="#0D0D0D" />}
          title="No classes yet"
          description="Create your school's classes first, then come back here at the end of the session to promote students."
          actionLabel="Go to Classes"
          onAction={() => navigate("/admin/classes")}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-4xl">
      <PageHeader
        title="End-of-Session Promotion"
        hint={
          <HelpHint
            title="Promotion"
            storageKey="promotion"
            description="Move every student up at the end of the third term."
            sections={[
              { title: "Map classes", text: "Each class is prefilled with its natural next class (JSS 2B → JSS 3B). Change any destination, or mark the final class to graduate." },
              { title: "Handle exceptions", text: "On the next screen, mark individual students who should repeat the class instead of moving up." },
              { title: "Roll over the session", text: "Set the new session's term dates. Whichever term covers today becomes the current term." },
              { title: "Review & commit", text: "Everything applies in one go: students move up, graduates are archived with their records intact." },
            ]}
          />
        }
        />

      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-4 mb-6">
        {STEP_LABELS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                i < step
                  ? "bg-gray900 text-white"
                  : i === step
                    ? "bg-gray100 text-gray900 border border-gray300"
                    : "bg-offWhite text-gray400 border border-gray100"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm ${i === step ? "font-medium text-gray900" : "text-gray500"}`}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <ArrowRight size={12} color="#B3B3B3" className="mx-1" />
            )}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray500 mb-4">
            Confirm where each class moves to at the end of the session. The topmost class graduates
            out of the school.
          </p>
          {classes.map((cls) => {
            const count = activeCountByClass[cls.id] ?? 0;
            return (
              <div
                key={cls.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-gray100 rounded-xl px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray900 truncate">{cls.name}</p>
                  <p className="text-xs text-gray500">
                    {count} active {count === 1 ? "student" : "students"}
                  </p>
                </div>
                <ArrowRight size={16} color="#8C8C8C" className="hidden sm:block shrink-0" />
                <div className="w-full sm:w-[240px]">
                  <SelectDropdown
                    value={destinations[cls.id] ?? ""}
                    onChange={(v) => setDestinations((prev) => ({ ...prev, [cls.id]: v }))}
                    placeholder="Choose destination"
                    options={destinationOptions(cls)}
                    buttonClassName="h-[42px] w-full text-sm"
                    menuClassName="min-w-[220px]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <p className="text-sm text-gray500">
            Everyone follows their class mapping by default. Mark exceptions here — e.g. students
            repeating a class.
          </p>
          {classes
            .filter((cls) => (studentsByClass[cls.id] ?? []).length > 0)
            .map((cls) => {
              const list = studentsByClass[cls.id] ?? [];
              const graduating = destinations[cls.id] === GRADUATE;
              const actions: PromotionAction[] = graduating
                ? ["GRADUATE", "REPEAT"]
                : ["PROMOTE", "REPEAT", "GRADUATE"];
              return (
                <section key={cls.id}>
                  <h3 className="text-sm font-semibold text-gray900 mb-2">
                    {cls.name}
                    <span className="ml-2 font-normal text-gray500">
                      →{" "}
                      {graduating
                        ? "Graduate"
                        : classes.find((c) => c.id === destinations[cls.id])?.name ?? "—"}
                    </span>
                  </h3>
                  <div className="border border-gray100 rounded-xl divide-y divide-gray100 overflow-hidden">
                    {list.map((student) => {
                      const action = actionFor(student);
                      return (
                        <div
                          key={student.id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5"
                        >
                          <span className="text-sm text-gray900 min-w-0 truncate">
                            {student.name}
                          </span>
                          <div className="flex items-center rounded-full bg-offWhite p-0.5 shrink-0">
                            {actions.map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() =>
                                  setStudentActions((prev) => ({ ...prev, [student.id]: a }))
                                }
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                  action === a ? "bg-gray900 text-white" : "text-gray500 hover:text-gray700"
                                }`}
                              >
                                {a === "PROMOTE" ? "Promote" : a === "REPEAT" ? "Repeat" : "Graduate"}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <p className="text-sm text-gray500">
            Set the term dates for the new session. Dates are prefilled from the current session,
            shifted one year forward. First Term will become the current term.
          </p>
          {TERM_KEYS.map((key) => {
            const invalid =
              !!termDates[key].startDate &&
              !!termDates[key].endDate &&
              new Date(termDates[key].endDate) <= new Date(termDates[key].startDate);
            return (
              <div
                key={key}
                className="bg-white border border-gray100 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <p className="text-sm font-semibold text-gray900 sm:col-span-2">{TERM_LABELS[key]}</p>
                <DateInput
                  label="Starts"
                  value={termDates[key].startDate}
                  onChange={(v) =>
                    setTermDates((prev) => ({ ...prev, [key]: { ...prev[key], startDate: v } }))
                  }
                />
                <DateInput
                  label="Ends"
                  value={termDates[key].endDate}
                  onChange={(v) =>
                    setTermDates((prev) => ({ ...prev, [key]: { ...prev[key], endDate: v } }))
                  }
                  hasError={invalid ? { message: "Must be after start", type: "validate" } : undefined}
                />
              </div>
            );
          })}
          {!termDatesValid && (
            <p className="flex items-center gap-2 text-sm text-red500">
              <Warning2 size={16} color="#CD432F" /> Fix the term dates above before continuing.
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryCard value={summary.promoted} label="Moving up" />
            <SummaryCard value={summary.repeated} label="Repeating" />
            <SummaryCard value={summary.graduated} label="Graduating" />
          </div>

          <div className="bg-white border border-gray100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray900 mb-3">Class movements</h3>
            <ul className="space-y-2 text-sm">
              {classes.map((cls) => {
                const dest = destinations[cls.id];
                const destLabel =
                  dest === GRADUATE
                    ? "Graduate"
                    : classes.find((c) => c.id === dest)?.name ?? "—";
                return (
                  <li key={cls.id} className="flex items-center justify-between gap-3">
                    <span className="text-gray900">{cls.name}</span>
                    <span className="flex items-center gap-2 text-gray500">
                      <ArrowRight size={14} color="#8C8C8C" /> {destLabel}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-white border border-gray100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray900 mb-3">New session terms</h3>
            <ul className="space-y-2 text-sm text-gray500">
              {TERM_KEYS.map((k) => (
                <li key={k} className="flex items-center justify-between gap-3">
                  <span className="text-gray900">{TERM_LABELS[k]}</span>
                  <span>
                    {new Date(termDates[k].startDate).toLocaleDateString("en-GB")} –{" "}
                    {new Date(termDates[k].endDate).toLocaleDateString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray500">
            This applies everything in one go. Students who graduate keep their full history and are
            excluded from rosters going forward.
          </p>
        </div>
      )}

      {/* Footer controls */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray100">
        <Button
          variant="outline"
          onClick={() => (step === 0 ? navigate("/admin/classes") : setStep(step - 1))}
        >
          <ArrowLeft size={16} color="#0D0D0D" />
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEP_LABELS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={step === 2 && !termDatesValid}>
            Continue
            <ArrowRight size={16} color="#FFFFFF" />
          </Button>
        ) : (
          <Button onClick={commit} disabled={committing || !termDatesValid}>
            <TickCircle size={16} color="#FFFFFF" />
            {committing ? "Applying…" : "Apply Promotion"}
          </Button>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ value, label }: { value: number; label: string }) => (
  <div className="bg-white border border-gray100 rounded-xl p-4 text-center">
    <p className="text-2xl font-semibold text-gray900">{value}</p>
    <p className="text-xs text-gray500 mt-1">{label}</p>
  </div>
);
