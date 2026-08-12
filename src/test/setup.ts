import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Dexie in jsdom fails on IndexedDB — stub it out globally for tests that
// don't touch the offline layer (liveQuery etc. are mocked per module).
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => undefined,
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});