import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => {
  return {
    fetchData: vi.fn(),
    userId: "u1",
    server: {
      id: "server-cfg",
      configType: "junior-secondary",
      name: "server-config",
      schedule: [{ days: ["MONDAY"], periodCount: 8, startTime: "08:30", endTime: "16:00", breaks: [] }],
      subjectIds: ["s1"],
      targets: { s1: 8 },
      doublePeriods: [],
    },
    // A stale Dexie cache row (cache shape with dataJson) whose schedule is the
    // old 3-block irregular one — the exact data that used to beat the server.
    staleCacheRow: {
      id: "cache-cfg",
      userId: "u1",
      configType: "junior-secondary",
      name: "cache-config",
      dataJson: JSON.stringify({
        schedule: [
          { days: ["MONDAY", "TUESDAY", "THURSDAY"], periodCount: 8, startTime: "08:30", endTime: "16:00", breaks: [] },
          { days: ["WEDNESDAY"], periodCount: 7, startTime: "09:15", endTime: "16:00", breaks: [] },
          { days: ["FRIDAY"], periodCount: 7, startTime: "09:00", endTime: "13:00", breaks: [] },
        ],
        subjectIds: ["s1", "s2"],
        targets: { s1: 8, s2: 4 },
        doublePeriods: [],
      }),
      updatedAt: Date.now(),
    },
  };
});

vi.mock("../../../utils/fetchData", () => ({ fetchData: mocks.fetchData }));
vi.mock("../../../contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: mocks.userId } }) }));
vi.mock("../../../db/db", () => ({
  db: {
    timetableConfigs: {
      where: () => ({
        equals: () => ({ toArray: async () => [], delete: async () => {} }),
      }),
      bulkPut: async () => {},
      put: async () => {},
      bulkDelete: async () => {},
    },
    transaction: async (_mode: string, _table: unknown, fn: () => Promise<void>) => {
      await fn();
    },
  },
}));

// Roll our own liveQuery stub so the hook's Dexie subscription emits the stale row.
vi.mock("dexie", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    liveQuery: () => ({
      subscribe: ({ next }: { next: (rows: unknown[]) => void }) => {
        next([mocks.staleCacheRow]);
        return { unsubscribe: () => {} };
      },
    }) as never,
  };
});

import { useTimetableConfigs } from "./useTimetableConfigs";

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } } });

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
);

describe("useTimetableConfigs merge (D1: server wins over stale Dexie cache)", () => {
  beforeEach(() => {
    mocks.fetchData.mockReset();
    mocks.fetchData.mockResolvedValue({ configs: [mocks.server] });
  });

  it("returns the server config, not the stale cached 3-block schedule", async () => {
    const { result } = renderHook(() => useTimetableConfigs(), { wrapper });

    await waitFor(() =>
      expect(result.current.isLoading).toBe(false),
    );
    // Wait until the server query has actually resolved (liveQuery emits first).
    await waitFor(() => {
      const id = result.current.data["junior-secondary"]?.id;
      if (id !== "server-cfg") throw new Error(`server not yet merged, got ${id}`);
    });

    const cfg = result.current.data["junior-secondary"];
    expect(cfg).toBeTruthy();
    // Server identity wins over the stale cache row
    expect(cfg.id).toBe("server-cfg");
    expect(cfg.name).toBe("server-config");
    // And the schedule is the server's clean one (single Mon block), not the
    // cache's 3 irregular blocks (Mon/Tue/Thu, Wed, Fri).
    expect(cfg.schedule.length).toBe(1);
    expect(cfg.schedule[0].days).toEqual(["MONDAY"]);
  });
});