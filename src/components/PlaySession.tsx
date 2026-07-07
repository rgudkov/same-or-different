import { forwardRef, useEffect, useImperativeHandle, useReducer, useState } from "react";
import type { ReactNode } from "react";
import { Board } from "./Board";
import { Intro } from "./Intro";
import type { Board as BoardModel } from "../lib/board";
import type { Outcome } from "../lib/game";
import { gameReducer, initGameState } from "../lib/game";
import { loadMuted, saveMuted } from "../lib/mute";
import { playOutcome } from "../lib/sound";

// A snapshot of a play session: score, the board last in play, and the sets
// found on it.
export type PlaySessionResult = { score: number; board: BoardModel; found: number[][] };

export type PlaySessionHandle = {
  // Reads the live snapshot at any moment. Lets a session-ending event the core
  // doesn't know about (Timed's clock reaching zero) report the final state.
  getResult: () => PlaySessionResult;
};

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

// The reusable core of a play screen: board rendering, selection/scoring, the
// Complete button, the found-set list, sound/mute, toast/flash feedback, and
// the help overlay. Timed-specific concerns — the countdown, and what happens
// when the session ends independent of a Complete press — live in `Game`,
// which wraps this core: it supplies `timerSlot`, reads the live score/board/
// found via the imperative handle when its clock reaches zero, and gets
// notified of help-overlay open/close (via `onHelpOpenChange`) so it can pause
// its own countdown. A future Daily mode screen wraps the same core with no
// `timerSlot` and reacts to `onCorrectComplete` to end its session instead of
// advancing to a new board.
export const PlaySession = forwardRef<
  PlaySessionHandle,
  {
    initialBoard: BoardModel;
    highScore?: number;
    // Called eagerly on every Complete press to obtain the board to advance to
    // if the Complete turns out correct (ignored otherwise, mirroring how the
    // reducer only uses it on the correct branch).
    getNextBoard: () => BoardModel;
    // Fires when a Complete press is correct, with the score/board/found as
    // they stood at the moment of completion (before the reducer resets to
    // `nextBoard`'s clean slate).
    onCorrectComplete?: (result: PlaySessionResult) => void;
    onHelpOpenChange?: (open: boolean) => void;
    timerSlot?: ReactNode;
  }
>(function PlaySession(
  { initialBoard, highScore, getNextBoard, onCorrectComplete, onHelpOpenChange, timerSlot },
  ref,
) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => initGameState(initialBoard));
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

  useImperativeHandle(
    ref,
    () => ({
      getResult: () => ({ score: state.score, board: state.board, found: state.found }),
    }),
    [state],
  );

  useEffect(() => {
    onHelpOpenChange?.(helpOpen);
    // Only report transitions; the callback identity isn't expected to change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpOpen]);

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

  function handleComplete() {
    // Captured before dispatch, since a correct Complete resets board/found to
    // nextBoard's clean slate.
    const priorBoard = state.board;
    const priorFound = state.found;
    const isCorrect = priorFound.length === priorBoard.sets.length;
    dispatch({ type: "complete", nextBoard: getNextBoard() });
    if (isCorrect) {
      onCorrectComplete?.({ score: state.score + 3, board: priorBoard, found: priorFound });
    }
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
        {timerSlot}
        <span className="score-block">
          <strong className="score" aria-label="Score">
            {state.score}
          </strong>
          {highScore !== undefined && (
            <span className="best-inline" aria-label="Best score">
              Best {highScore}
            </span>
          )}
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
              onClick={handleComplete}
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
});
