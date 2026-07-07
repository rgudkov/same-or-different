import type { StreakResult } from "../lib/streak";

// Formats seconds as m:ss (e.g. 65 → "1:05").
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// The screen shown when today's Daily is already complete: current/longest
// streak, a recap of today's result, and why the puzzle can't be replayed.
// Reappears on any later same-day launch. A Share action lands separately
// (#3, blocked on this screen existing).
export function StreakStatus({
  currentStreak,
  longestStreak,
  result,
  onPlayTimed,
}: {
  currentStreak: number;
  longestStreak: number;
  result: StreakResult | null;
  onPlayTimed: () => void;
}) {
  return (
    <main className="app streak-status">
      <h1 className="title">Streak</h1>

      <p className="streak-current">
        Current streak: <strong aria-label="Current streak">{currentStreak}</strong>
      </p>
      <p className="streak-longest">
        Longest streak: <strong aria-label="Longest streak">{longestStreak}</strong>
      </p>

      {result && (
        <p className="streak-recap" aria-label="Today's result">
          Today: {formatTime(result.timeTakenSeconds)}, {result.mistakeCount}{" "}
          {result.mistakeCount === 1 ? "mistake" : "mistakes"}
        </p>
      )}

      <p className="streak-note">
        You&apos;ve completed today&apos;s Daily puzzle — it can&apos;t be
        replayed. Come back tomorrow for the next one.
      </p>

      <div className="actions">
        <button type="button" className="btn btn--link" onClick={onPlayTimed}>
          Play Timed mode
        </button>
      </div>
    </main>
  );
}
