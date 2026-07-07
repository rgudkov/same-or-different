import { afterEach, describe, expect, it, vi } from "vitest";
import { loadStreak, saveStreak, updateStreak } from "./streak";
import type { StreakState } from "./streak";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

const EMPTY: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  lastResult: null,
};

describe("streak persistence", () => {
  it("returns the empty state when nothing is stored", () => {
    expect(loadStreak()).toEqual(EMPTY);
  });

  it("round-trips a saved state", () => {
    const state: StreakState = {
      currentStreak: 3,
      longestStreak: 5,
      lastCompletedDate: "2026-07-07",
      lastResult: { date: "2026-07-07", timeTakenSeconds: 42, mistakeCount: 1 },
    };
    saveStreak(state);
    expect(loadStreak()).toEqual(state);
  });

  it("treats malformed stored values as the empty state", () => {
    localStorage.setItem("sod.streak", "not-json");
    expect(loadStreak()).toEqual(EMPTY);
  });

  it("degrades to the empty state when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(loadStreak()).toEqual(EMPTY);
  });

  it("silently no-ops a save when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(() => saveStreak(EMPTY)).not.toThrow();
  });
});

describe("updateStreak", () => {
  it("sets current and longest streak to 1 on a first-ever completion", () => {
    const result = updateStreak(EMPTY, "2026-07-07");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastCompletedDate).toBe("2026-07-07");
  });

  it("increments current streak on a consecutive local day", () => {
    const previous: StreakState = {
      currentStreak: 4,
      longestStreak: 4,
      lastCompletedDate: "2026-07-06",
      lastResult: null,
    };
    const result = updateStreak(previous, "2026-07-07");
    expect(result.currentStreak).toBe(5);
  });

  it("updates longest streak whenever current streak exceeds it", () => {
    const previous: StreakState = {
      currentStreak: 4,
      longestStreak: 4,
      lastCompletedDate: "2026-07-06",
      lastResult: null,
    };
    const result = updateStreak(previous, "2026-07-07");
    expect(result.longestStreak).toBe(5);
  });

  it("does not lower longest streak when current streak resets below it", () => {
    const previous: StreakState = {
      currentStreak: 10,
      longestStreak: 10,
      lastCompletedDate: "2026-07-01",
      lastResult: null,
    };
    // 2026-07-07 is not the day after 2026-07-01: a missed-day reset.
    const result = updateStreak(previous, "2026-07-07");
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10);
  });

  it("resets current streak to 1 after a missed day", () => {
    const previous: StreakState = {
      currentStreak: 4,
      longestStreak: 4,
      lastCompletedDate: "2026-07-04",
      lastResult: null,
    };
    // Missed 2026-07-05 and 2026-07-06.
    const result = updateStreak(previous, "2026-07-07");
    expect(result.currentStreak).toBe(1);
  });

  it("handles a consecutive day across a month boundary", () => {
    const previous: StreakState = {
      currentStreak: 2,
      longestStreak: 2,
      lastCompletedDate: "2026-06-30",
      lastResult: null,
    };
    const result = updateStreak(previous, "2026-07-01");
    expect(result.currentStreak).toBe(3);
  });
});
