// Pure game-state reducer for selection and set scoring (Phase 3). Kept free of
// React so each scoring outcome can be unit-tested directly. The timer, the
// Complete action, and board progression arrive in later phases.

import type { Board } from "./board";
import { isSet } from "./board";

// The outcome of evaluating a three-cell selection, surfaced for feedback.
export type Outcome = "set" | "already-found" | "not-set";

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
};

export type Action =
  | { type: "toggle"; index: number }
  | { type: "newBoard"; board: Board };

export function initGameState(board: Board): GameState {
  return { board, selected: [], found: [], score: 0, lastOutcome: null };
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
      };

    case "toggle":
      return toggle(state, action.index);
  }
}

function toggle(state: GameState, index: number): GameState {
  // Deselecting an already-selected cell just removes it and clears feedback.
  if (state.selected.includes(index)) {
    return {
      ...state,
      selected: state.selected.filter((i) => i !== index),
      lastOutcome: null,
    };
  }

  const selected = [...state.selected, index];

  // Fewer than three selected: keep building the candidate, no evaluation yet.
  if (selected.length < 3) {
    return { ...state, selected, lastOutcome: null };
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
): Pick<GameState, "score" | "found" | "lastOutcome"> {
  const [i, j, k] = selection;
  const { cells } = state.board;

  if (!isSet(cells[i], cells[j], cells[k])) {
    return { score: state.score - 1, found: state.found, lastOutcome: "not-set" };
  }

  const triple = [...selection].sort((a, b) => a - b);
  if (state.found.some((f) => sameTriple(f, triple))) {
    // Re-finding a known set is neutral: no points, no new entry.
    return { score: state.score, found: state.found, lastOutcome: "already-found" };
  }

  return {
    score: state.score + 1,
    found: [...state.found, triple],
    lastOutcome: "set",
  };
}

function sameTriple(a: number[], b: number[]): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
