import { useState } from "react";
import type { StreakResult } from "../lib/streak";

// Formats seconds as m:ss (e.g. 65 → "1:05").
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const GAME_URL = "https://rgudkov.github.io/same-or-different/";

// Text handed to the OS share sheet / clipboard. Deliberately omits any
// day-number/epoch framing (per ADR 0003 and the PRD).
function shareText(result: StreakResult): string {
  const mistakeWord = result.mistakeCount === 1 ? "mistake" : "mistakes";
  return `🎉 I finished today's puzzle in ${formatTime(result.timeTakenSeconds)} with ${result.mistakeCount} ${mistakeWord}. How quick are you? Try ${GAME_URL} 🧩`;
}

// Hands off to the OS share sheet (ADR 0003: one Web Share API call rather
// than bespoke per-platform buttons), falling back to a clipboard copy on
// browsers without Web Share API support.
function ShareButton({ result }: { result: StreakResult }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = shareText(result);
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return (
    <>
      <button type="button" className="btn btn--link" onClick={handleShare}>
        Share
      </button>
      {copied && <span className="share-copied">Copied to clipboard</span>}
    </>
  );
}

// The screen shown when today's Daily is already complete: current/longest
// streak, a recap of today's result, and why the puzzle can't be replayed.
// Reappears on any later same-day launch.
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
        {result && <ShareButton result={result} />}
        <button type="button" className="btn btn--link" onClick={onPlayTimed}>
          Play Timed mode
        </button>
      </div>
    </main>
  );
}
