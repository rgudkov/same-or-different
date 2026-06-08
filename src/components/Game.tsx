import { useEffect, useReducer, useState } from "react";
import { Board } from "./Board";
import type { Board as BoardModel } from "../lib/board";
import { generateBoard } from "../lib/board";
import type { Outcome } from "../lib/game";
import { gameReducer, initGameState } from "../lib/game";

// One continuous countdown spans the whole game (all boards). Two minutes.
export const GAME_DURATION_SECONDS = 120;

// Short, non-blocking message shown for each outcome. Score deltas are spelled
// out so the feedback explains the point change, not just flashes a color.
const TOAST_TEXT: Record<Outcome, string> = {
  set: "Set! +1",
  "already-found": "Already found",
  "not-set": "Not a set −1",
  "complete-correct": "Board cleared! +3",
  "complete-wrong": "Sets still remain −1",
};

// How long a toast stays on screen before fading out.
const TOAST_DURATION_MS = 1500;

// Formats a found set (0-based index triple) as sorted 1-based cell numbers,
// e.g. [0, 4, 8] → "1,5,9".
function formatFoundSet(triple: number[]): string {
  return triple.map((i) => i + 1).join(",");
}

// Formats remaining seconds as m:ss (e.g. 120 → "2:00", 9 → "0:09").
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// The playing screen: the live board plus a single session timer. When the timer
// reaches zero it reports the final score to the parent, which switches to Game
// Over. `initialBoard` lets tests inject a deterministic board.
export function Game({
  onGameOver,
  initialBoard,
}: {
  onGameOver: (finalScore: number) => void;
  initialBoard?: BoardModel;
}) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    initGameState(initialBoard ?? generateBoard()),
  );
  const [secondsLeft, setSecondsLeft] = useState(GAME_DURATION_SECONDS);
  // Bumped whenever the board changes so the grid replays its fade-in, giving a
  // smooth transition into each fresh board after a correct Complete.
  const [boardTransition, setBoardTransition] = useState(0);
  // The current toast (with its feedbackId so the element re-keys and replays
  // its animation on every action), or null when nothing is showing.
  const [toast, setToast] = useState<{ id: number; outcome: Outcome } | null>(null);

  // One interval drives the countdown for the whole game; it stops itself at 0.
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // When the clock hits zero, end the game with the current score.
  useEffect(() => {
    if (secondsLeft === 0) onGameOver(state.score);
    // Only react to the clock reaching zero; score is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  useEffect(() => {
    setBoardTransition((n) => n + 1);
  }, [state.board]);

  // Show a toast for each outcome-producing action and auto-dismiss it. Keyed on
  // feedbackId so repeated identical outcomes still refire.
  useEffect(() => {
    if (!state.lastOutcome) return;
    setToast({ id: state.feedbackId, outcome: state.lastOutcome });
    const timeout = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.feedbackId]);

  return (
    <main className="app">
      {toast && (
        <div
          key={toast.id}
          className={`toast toast--${toast.outcome}`}
          role="status"
        >
          {TOAST_TEXT[toast.outcome]}
        </div>
      )}

      <div className="topbar">
        <span className="timer" aria-label="Time left">
          {formatTime(secondsLeft)}
        </span>
        <span className="stat">
          Score: <strong aria-label="Score">{state.score}</strong>
        </span>
      </div>

      <div key={boardTransition} className="board-wrap">
        <Board
          cells={state.board.cells}
          selected={state.selected}
          onSelect={(index) => dispatch({ type: "toggle", index })}
        />
      </div>

      <div className="complete">
        <button
          type="button"
          // Re-keyed on a wrong Complete so the shake/flash animation replays
          // every time, even on consecutive wrong taps.
          key={state.lastOutcome === "complete-wrong" ? state.feedbackId : "complete"}
          className={
            "btn btn--complete" +
            (state.lastOutcome === "complete-wrong" ? " btn--reject" : "")
          }
          onClick={() => dispatch({ type: "complete", nextBoard: generateBoard() })}
        >
          🚩 No more sets
        </button>
        <p className="complete-hint">
          Tap when you&apos;ve found every set (or there are none)
        </p>
      </div>

      <section className="found" aria-label="Found sets">
        <h2 className="found-title">Found sets</h2>
        {state.found.length === 0 ? (
          <p className="found-empty">None yet</p>
        ) : (
          <ul className="found-list">
            {state.found.map((triple) => (
              <li key={formatFoundSet(triple)} className="found-item">
                {formatFoundSet(triple)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
