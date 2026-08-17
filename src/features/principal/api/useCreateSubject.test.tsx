import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => {
  return {
    put: vi.fn().mockResolvedValue(undefined),
    addToQueue: vi.fn().mockResolvedValue(undefined),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
    userId: "u1",
  };
});

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: mocks.userId, schoolId: "school-1" } }),
}));

vi.mock("../../../db/db", () => ({
  db: {
    subjects: {
      put: mocks.put,
    },
  },
}));

vi.mock("../../../sync/syncQueue", () => ({
  addToQueue: mocks.addToQueue,
}));

vi.mock("@/utils/toast", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { useCreateSubject } from "./useCreateSubject";

const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
);

describe("useCreateSubject", () => {
  beforeEach(() => {
    mocks.put.mockClear();
    mocks.addToQueue.mockClear();
    mocks.toastSuccess.mockClear();
    mocks.toastError.mockClear();
  });

  it("writes to Dexie and queues a POST in the sync queue (offline-first)", async () => {
    const { result } = renderHook(() => useCreateSubject(), { wrapper });

    result.current.mutate({ name: "Mathematics", code: "MTH" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mocks.put).toHaveBeenCalledTimes(1);
    const cache = mocks.put.mock.calls[0][0];
    expect(cache).toMatchObject({
      userId: mocks.userId,
      schoolId: "school-1",
      name: "Mathematics",
      code: "MTH",
    });
    expect(typeof cache.id).toBe("string");
    expect(cache.id.length).toBeGreaterThan(0);

    expect(mocks.addToQueue).toHaveBeenCalledTimes(1);
    const queued = mocks.addToQueue.mock.calls[0][0];
    expect(queued).toMatchObject({
      userId: mocks.userId,
      table: "subjects",
      recordId: cache.id,
      endpoint: "/subjects",
      method: "POST",
    });
    expect(queued.payload).toMatchObject({ name: "Mathematics", code: "MTH", id: cache.id });
  });
});