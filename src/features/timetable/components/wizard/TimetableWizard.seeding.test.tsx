import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// --- deterministic fixtures ------------------------------------------------

const SUBJECTS = [
  { subjectId: "s1", name: "Mathematics", code: "MATH", teacherId: "t1", teacherName: "Mr. A" },
  { subjectId: "s2", name: "English Language", code: "ENG", teacherId: "t2", teacherName: "Ms. B" },
];

const cleanConfig = {
  id: "cfg-junior",
  configType: "junior-secondary",
  name: "Junior Secondary school configuration",
  schedule: [
    {
      id: "b1",
      days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"],
      periodCount: 8,
      startTime: "08:30",
      endTime: "16:00",
      breaks: [
        { id: "br1", label: "Short Break", startTime: "10:00", durationMinutes: 10 },
        { id: "br2", label: "Long Break", startTime: "11:00", durationMinutes: 40 },
      ],
      periods: [
        { startTime: "08:30", endTime: "09:15" },
        { startTime: "09:15", endTime: "10:00" },
        { startTime: "10:10", endTime: "11:00" },
        { startTime: "11:40", endTime: "12:32" },
        { startTime: "12:32", endTime: "13:24" },
        { startTime: "13:24", endTime: "14:16" },
        { startTime: "14:16", endTime: "15:08" },
        { startTime: "15:08", endTime: "16:00" },
      ],
    },
    {
      id: "b2",
      days: ["FRIDAY"],
      periodCount: 8,
      startTime: "08:30",
      endTime: "13:00",
      breaks: [{ id: "br3", label: "Break", startTime: "11:00", durationMinutes: 30 }],
      periods: [
        { startTime: "08:30", endTime: "09:00" },
        { startTime: "09:00", endTime: "09:30" },
        { startTime: "09:30", endTime: "10:00" },
        { startTime: "10:00", endTime: "10:30" },
        { startTime: "10:30", endTime: "11:00" },
        { startTime: "11:30", endTime: "12:00" },
        { startTime: "12:00", endTime: "12:30" },
        { startTime: "12:30", endTime: "13:00" },
      ],
    },
  ],
  subjectIds: ["s1", "s2"],
  targets: { s1: 6, s2: 6 },
  doublePeriods: [
    { subjectId: "s1", days: ["MONDAY", "TUESDAY"] },
    { subjectId: "s2", days: ["MONDAY", "TUESDAY"] },
  ],
};

// NOTE: a "stale 3-block irregular schedule" (the old partial-fill output —
// Mon/Tue/Thu, Wed, Fri with mismatched period grids) is exercised at the merge
// layer in useTimetableConfigs.test.tsx (D1). Here it would show up as THREE
// separate day-group tables instead of the fresh config's two.

const cacheEntries = [
  { id: "e1", classId: "c1", className: "JSS 2 A", subjectId: "s1", subjectName: "Mathematics", teacherId: "t1", teacherName: "Mr. A", day: "WEDNESDAY", period: 1, startTime: "09:15", endTime: "10:00" },
  { id: "e2", classId: "c1", className: "JSS 2 A", subjectId: "s2", subjectName: "English Language", teacherId: "t2", teacherName: "Ms. B", day: "FRIDAY", period: 1, startTime: "09:00", endTime: "09:30" },
];

// --- mock API layer --------------------------------------------------------

const draftState = vi.hoisted(() => ({
  current: null as null | Record<string, unknown>,
  clearCalls: 0,
  saveCalls: 0,
}));

vi.hoisted(() => {
  const saved = (vi as unknown as { fn: () => () => unknown }).fn();
  return { saved };
});

vi.mock("../../api", () => ({
  useTimetableBuild: () => ({
    data: { subjects: SUBJECTS, config: null, title: "Weekly Timetable", busyTeachers: [], entries: [], breaks: [] },
    isLoading: false,
    error: undefined,
  }),
  usePublishTimetable: () => ({ mutate: vi.fn(), isPending: false }),
  useTimetableCache: () => ({ entries: cacheEntries, breaks: [], isLoading: false, error: undefined, refresh: vi.fn() }),
  useTimetableConfigs: () => ({ data: { "junior-secondary": cleanConfig }, isLoading: false, error: undefined }),
  useScheduleTemplates: () => ({ templates: [], subjectTemplates: [], isLoading: false }),
}));

vi.mock("../../../class-subjects/api", () => ({
  useClassSubjects: () => ({ data: [{ classId: "c1", subjectIds: ["s1", "s2"] }] }),
}));

vi.mock("../../../principal/api", () => ({
  useClasses: () => ({ data: { classes: [{ id: "c1", name: "JSS 2 A", schoolType: "junior-secondary" }] } }),
  useSubjects: () => ({ data: SUBJECTS }),
}));

const { useTimetableDraft } = vi.hoisted(() => {
  const fn = () => {
    return {
      draft: null,
      save: () => { draftState.saveCalls++; },
      clear: () => { draftState.clearCalls++; },
    };
  };
  return { useTimetableDraft: fn };
});

vi.mock("../../hooks/useTimetableDraft", () => ({ useTimetableDraft }));

import { TimetableWizard } from "./TimetableWizard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  draftState.clearCalls = 0;
  draftState.saveCalls = 0;
});

describe("TimetableWizard seeding rules (D layer)", () => {
  it("D2/D3: locked config overrides stale cached entries — no split, jump to preview", async () => {
    await act(async () => {
      render(
        <TimetableWizard classId="c1" className="JSS 2 A" onCancel={() => {}} onPublished={() => {}} />,
        { wrapper },
      );
    });
    // Jumped straight to Preview (locked config manages earlier steps)
    expect(screen.getByText("JSS 2 A — preview")).toBeInTheDocument();
    // The stale legacy draft, if any, is cleared
    expect(draftState.clearCalls).toBeGreaterThan(0);
    // No "draft restored" banner for locked classes
    expect(screen.queryByText(/Continuing where you left off/)).not.toBeInTheDocument();
  });

  it("D2b: locked config prevents draft persistence", async () => {
    await act(async () => {
      render(
        <TimetableWizard classId="c1" className="JSS 2 A" onCancel={() => {}} onPublished={() => {}} />,
        { wrapper },
      );
    });
    expect(draftState.saveCalls).toBe(0);
  });

  it("D3b: fresh config schedule wins over stale cached entries reconstruction", async () => {
    // The locked config schedules 8 periods on every weekday → totalSlots = 40
    // (deterministic, independent of where the allocator places lessons). If a
    // stale pre-config 3-block schedule (Mon/Tue/Thu × 8, Wed × 7, Fri × 7)
    // ever won the grid geometry, totalSlots would be 38 and the preview badge
    // would read "/ 38 slots".
    await act(async () => {
      render(
        <TimetableWizard classId="c1" className="JSS 2 A" onCancel={() => {}} onPublished={() => {}} />,
        { wrapper },
      );
    });
    expect(screen.getByText("JSS 2 A — preview")).toBeInTheDocument();
    expect(screen.getByText(/\/ 40 slots/)).toBeInTheDocument();
  });
});