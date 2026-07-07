// Streak persistence via localStorage, following the same wrapped-storage
// pattern as `highScore.ts`: a disabled/unavailable store (private mode, quota
// errors) degrades to "no streak" rather than crashing.
//
// Also the pure `updateStreak` transition: strict break on any missed local
// calendar day, no grace period (per ADR 0002).

const STORAGE_KEY = "sod.streak";

// The most recent Daily result, recapped on the streak-status screen.
export type StreakResult = {
  date: string;
  timeTakenSeconds: number;
  mistakeCount: number;
};

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  // Local date ("YYYY-MM-DD") of the last completed Daily, or null before any
  // completion.
  lastCompletedDate: string | null;
  lastResult: StreakResult | null;
};

const EMPTY_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  lastResult: null,
};

// Returns the stored streak state, or the empty state when absent or
// unreadable.
export function loadStreak(): StreakState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    if (!isStreakState(parsed)) return EMPTY_STATE;
    return parsed;
  } catch {
    return EMPTY_STATE;
  }
}

// Persists `state` as the new streak state. Silently no-ops if storage is
// unavailable.
export function saveStreak(state: StreakState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore: an unavailable store just means the streak isn't remembered.
  }
}

function isStreakState(value: unknown): value is StreakState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.currentStreak === "number" &&
    typeof v.longestStreak === "number" &&
    (v.lastCompletedDate === null || typeof v.lastCompletedDate === "string") &&
    (v.lastResult === null || typeof v.lastResult === "object")
  );
}

// The local calendar day immediately before `dateLocal` ("YYYY-MM-DD"). Parsed
// as UTC-midnight-of-that-date so subtracting a day never shifts across a DST
// boundary — these are calendar dates, not instants.
function previousLocalDate(dateLocal: string): string {
  const [year, month, day] = dateLocal.split("-").map(Number);
  const asUtc = new Date(Date.UTC(year, month - 1, day));
  asUtc.setUTCDate(asUtc.getUTCDate() - 1);
  return asUtc.toISOString().slice(0, 10);
}

// Computes the streak state after completing today's Daily. Consecutive-day
// completion (last completed date was the local-calendar day before today)
// increments Current streak; anything else (first-ever completion, or a missed
// day in between) resets it to one. Longest streak updates whenever Current
// streak exceeds it. No grace period or streak-freeze (per ADR 0002).
export function updateStreak(previous: StreakState, todayLocalDate: string): StreakState {
  const isConsecutive =
    previous.lastCompletedDate !== null &&
    previous.lastCompletedDate === previousLocalDate(todayLocalDate);

  const currentStreak = isConsecutive ? previous.currentStreak + 1 : 1;
  const longestStreak = Math.max(previous.longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate: todayLocalDate,
    lastResult: previous.lastResult,
  };
}
