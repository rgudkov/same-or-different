import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
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

// Fires a single center-screen confetti burst, skipped entirely under
// prefers-reduced-motion (the app treats that preference as a hard rule
// elsewhere — see cell-flash/toast animations in index.css).
function celebrate() {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;
  // Guards against environments without a real 2D canvas (e.g. jsdom in
  // tests), where canvas-confetti's animation loop would throw on every frame.
  if (!document.createElement("canvas").getContext("2d")) return;
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
}

// The screen shown when today's Daily is already complete: current/longest
// streak, a recap of today's result, and why the puzzle can't be replayed.
// Reappears on any later same-day launch, but only celebrates (confetti +
// congratulatory header) the first time, right after finishing — `justCompleted`
// distinguishes that from a later same-day reopen.
export function StreakStatus({
  currentStreak,
  longestStreak,
  result,
  justCompleted,
  onPlayTimed,
}: {
  currentStreak: number;
  longestStreak: number;
  result: StreakResult | null;
  justCompleted: boolean;
  onPlayTimed: () => void;
}) {
  useEffect(() => {
    if (justCompleted) celebrate();
    // Only ever fire on mount for a just-completed result, not on rerenders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="app streak-status">
      <h1 className="title">Streak</h1>
      <h2 className="celebrate">{justCompleted ? "🎉 Nice work!" : "Today's Daily is done"}</h2>

      <div className="streak-stats">
        <div className="streak-stat">
          <span className="streak-stat-value" aria-label="Current streak">
            {currentStreak}
          </span>
          <span className="streak-stat-label">Current streak</span>
        </div>
        <div className="streak-stat">
          <span className="streak-stat-value" aria-label="Longest streak">
            {longestStreak}
          </span>
          <span className="streak-stat-label">Longest streak</span>
        </div>
      </div>

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
