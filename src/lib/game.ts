// Pure game-state reducer for selection, set scoring, and board completion.
// Kept free of React so each outcome can be unit-tested directly. The timer and
// the surrounding session (screens, high score) live in components.

import type { Board } from "./board";
import { isSet } from "./board";

// The outcome of the most recent action, surfaced for feedback. The first three
// come from evaluating a three-cell selection; the last two from Complete.
export type Outcome =
  | "set"
  | "already-found"
  | "not-set"
  | "complete-correct"
  | "complete-wrong";

export type GameState = {
  board: Board;
  // Indices (0-based) of currently selected cells; 0–2 at rest, momentarily 3
  // during evaluation before it clears.
  selected: number[];
  // Sets the player has found on this board, each a sorted index triple.
  found: number[][];
  score: number;
  // Result of the most recent evaluation, or null before any/after deselect.
  lastOutcome: Outcome | null;
  // The (0-based) cells the most recent evaluation scored, so the UI can flash
  // them in the outcome's color. Empty for non-evaluation actions and for
  // Complete (which flashes the board/button, not individual cells).
  lastCells: number[];
  // Monotonic counter bumped on every outcome-producing action (an evaluation or
  // a Complete). Lets the UI retrigger feedback even when two actions in a row
  // share the same `lastOutcome` (e.g. two wrong Completes).
  feedbackId: number;
};

export type Action =
  | { type: "toggle"; index: number }
  // `nextBoard` is the board to load if the Complete is correct; ignored when
  // unfound sets remain. The caller generates it so the reducer stays pure.
  | { type: "complete"; nextBoard: Board }
  | { type: "newBoard"; board: Board };

export function initGameState(board: Board): GameState {
  return {
    board,
    selected: [],
    found: [],
    score: 0,
    lastOutcome: null,
    lastCells: [],
    feedbackId: 0,
  };
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "newBoard":
      return {
        ...state,
        board: action.board,
        selected: [],
        found: [],
        lastOutcome: null,
        lastCells: [],
      };

    case "toggle":
      return toggle(state, action.index);

    case "complete":
      return complete(state, action.nextBoard);
  }
}

// Handles a Complete declaration. The board is fully solved exactly when every
// authoritative set has been found, so a length match is sufficient (each found
// entry is a distinct set from that list). Correct: +3 and advance to the next
// board with a clean slate. Wrong (unfound sets remain): −1 and continue, leaving
// any in-progress selection untouched.
function complete(state: GameState, nextBoard: Board): GameState {
  if (state.found.length === state.board.sets.length) {
    return {
      ...state,
      board: nextBoard,
      selected: [],
      found: [],
      score: state.score + 3,
      lastOutcome: "complete-correct",
      lastCells: [],
      feedbackId: state.feedbackId + 1,
    };
  }

  return {
    ...state,
    score: state.score - 1,
    lastOutcome: "complete-wrong",
    lastCells: [],
    feedbackId: state.feedbackId + 1,
  };
}

function toggle(state: GameState, index: number): GameState {
  // Deselecting an already-selected cell just removes it and clears feedback.
  if (state.selected.includes(index)) {
    return {
      ...state,
      selected: state.selected.filter((i) => i !== index),
      lastOutcome: null,
      lastCells: [],
    };
  }

  const selected = [...state.selected, index];

  // Fewer than three selected: keep building the candidate, no evaluation yet.
  if (selected.length < 3) {
    return { ...state, selected, lastOutcome: null, lastCells: [] };
  }

  // Third cell selected — evaluate immediately, then clear the selection.
  return { ...state, selected: [], ...evaluate(state, selected) };
}

// Scores a completed three-cell selection against the authoritative set list.
// Returns the score delta (folded into the running total), the updated found
// list, and the outcome for feedback. Cells are never marked or removed.
function evaluate(
  state: GameState,
  selection: number[],
): Pick<GameState, "score" | "found" | "lastOutcome" | "lastCells" | "feedbackId"> {
  const [i, j, k] = selection;
  const { cells } = state.board;
  const feedbackId = state.feedbackId + 1;
  // The cells just judged — flashed in the outcome's color by the UI.
  const triple = [...selection].sort((a, b) => a - b);

  if (!isSet(cells[i], cells[j], cells[k])) {
    return {
      score: state.score - 1,
      found: state.found,
      lastOutcome: "not-set",
      lastCells: triple,
      feedbackId,
    };
  }

  if (state.found.some((f) => sameTriple(f, triple))) {
    // Re-finding a known set is neutral: no points, no new entry.
    return {
      score: state.score,
      found: state.found,
      lastOutcome: "already-found",
      lastCells: triple,
      feedbackId,
    };
  }

  return {
    score: state.score + 1,
    found: [...state.found, triple],
    lastOutcome: "set",
    lastCells: triple,
    feedbackId,
  };
}

function sameTriple(a: number[], b: number[]): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
