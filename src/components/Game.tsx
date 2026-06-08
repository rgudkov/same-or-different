import { useEffect, useReducer, useState } from "react";
import { Board } from "./Board";
import { Intro } from "./Intro";
import type { Board as BoardModel } from "../lib/board";
import { generateBoard } from "../lib/board";
import type { Outcome } from "../lib/game";
import { gameReducer, initGameState } from "../lib/game";
import { loadMuted, saveMuted } from "../lib/mute";
import { playOutcome } from "../lib/sound";

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

// How long a per-cell color flash lasts; must match the CSS animation length.
const FLASH_DURATION_MS = 500;

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
  highScore,
  initialBoard,
}: {
  // Reports the final score plus the last board played and the sets found on it,
  // so Game Over can show a review of what was on that board.
  onGameOver: (result: { score: number; board: BoardModel; found: number[][] }) => void;
  highScore: number;
  initialBoard?: BoardModel;
}) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    initGameState(initialBoard ?? generateBoard()),
  );
  const [secondsLeft, setSecondsLeft] = useState(GAME_DURATION_SECONDS);
  // Sound preference, seeded from storage and persisted on every toggle.
  const [muted, setMuted] = useState(() => loadMuted());
  // Bumped whenever the board changes so the grid replays its fade-in, giving a
  // smooth transition into each fresh board after a correct Complete.
  const [boardTransition, setBoardTransition] = useState(0);
  // The current toast (with its feedbackId so the element re-keys and replays
  // its animation on every action), or null when nothing is showing.
  const [toast, setToast] = useState<{ id: number; outcome: Outcome } | null>(null);
  // The cells to flash for the most recent evaluation (green/amber/red), keyed
  // so the animation refires each time, or null when nothing is flashing.
  const [flash, setFlash] = useState<{ key: number; cells: number[]; kind: Outcome } | null>(null);
  // Bumped on a correct Complete to play a one-shot green sweep over the board.
  const [sweep, setSweep] = useState(0);
  // When true, the intro plays as a paused overlay over this same game (the help
  // replay). Board, score, and timer state are all preserved underneath.
  const [helpOpen, setHelpOpen] = useState(false);

  // One interval drives the countdown for the whole game; it stops itself at 0.
  // While the help overlay is open the countdown is paused: the interval is torn
  // down and re-created (resuming from the same `secondsLeft`) when it closes.
  useEffect(() => {
    if (helpOpen) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [helpOpen]);

  // When the clock hits zero, end the game with the current score.
  useEffect(() => {
    if (secondsLeft === 0) {
      onGameOver({ score: state.score, board: state.board, found: state.found });
    }
    // Only react to the clock reaching zero; state is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  useEffect(() => {
    setBoardTransition((n) => n + 1);
  }, [state.board]);

  // Drive all per-action feedback (sound + toast + cell flash + board sweep) off
  // a single effect keyed on feedbackId, so repeated identical outcomes refire.
  useEffect(() => {
    if (!state.lastOutcome) return;
    playOutcome(state.lastOutcome, muted);

    setToast({ id: state.feedbackId, outcome: state.lastOutcome });
    const toastTimeout = setTimeout(() => setToast(null), TOAST_DURATION_MS);

    let flashTimeout: ReturnType<typeof setTimeout> | undefined;
    if (state.lastCells.length > 0) {
      setFlash({ key: state.feedbackId, cells: state.lastCells, kind: state.lastOutcome });
      flashTimeout = setTimeout(() => setFlash(null), FLASH_DURATION_MS);
    }
    if (state.lastOutcome === "complete-correct") {
      setSweep(state.feedbackId);
    }

    return () => {
      clearTimeout(toastTimeout);
      if (flashTimeout) clearTimeout(flashTimeout);
    };
    // muted is read at fire time; we only want to refire on a new action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.feedbackId]);

  function toggleMuted() {
    setMuted((m) => {
      const next = !m;
      saveMuted(next);
      return next;
    });
  }

  return (
    <main className="app game">
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
        <span className="score-block">
          <strong className="score" aria-label="Score">
            {state.score}
          </strong>
          <span className="best-inline" aria-label="Best score">
            Best {highScore}
          </span>
        </span>
        <div className="topbar-controls">
          <button
            type="button"
            className="btn btn--icon"
            aria-label="How to play"
            onClick={() => setHelpOpen(true)}
          >
            ?
          </button>
          <button
            type="button"
            className="btn btn--icon"
            aria-label={muted ? "Unmute sounds" : "Mute sounds"}
            aria-pressed={muted}
            onClick={toggleMuted}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      <div className="game-body">
        <div className="board-col">
          <div
            key={boardTransition}
            className={
              "board-wrap" + (sweep === state.feedbackId && sweep > 0 ? " board-wrap--sweep" : "")
            }
          >
            <Board
              cells={state.board.cells}
              selected={state.selected}
              flash={flash ? { cells: flash.cells, kind: flash.kind, key: flash.key } : undefined}
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
        </div>

        <aside className="side">
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
        </aside>
      </div>

      {helpOpen && (
        <div
          className="intro-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="How to play"
        >
          {/* Replaying the intro never touches the intro-seen flag; closing it
              (or pressing Resume on the final step) just returns to this game. */}
          <Intro onComplete={() => setHelpOpen(false)} actionLabel="Resume" />
        </div>
      )}
    </main>
  );
}
