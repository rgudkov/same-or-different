import { describe, expect, it } from "vitest";
import type { Cell } from "../types";
import type { Board } from "./board";
import { findAllSets } from "./board";
import { gameReducer, initGameState } from "./game";

function cell(
  background: Cell["background"],
  shape: Cell["shape"],
  shapeColor: Cell["shapeColor"],
): Cell {
  return { background, shape, shapeColor };
}

// A fixed board with exactly one set: cells 0,1,2 (all black, shapes all
// different, all red). Cell 3 (white) prevents any other triple forming a set.
function fixtureBoard(): Board {
  const cells = [
    cell("black", "triangle", "red"),
    cell("black", "square", "red"),
    cell("black", "circle", "red"),
    cell("white", "triangle", "red"),
  ];
  return { cells, sets: findAllSets(cells) };
}

// Applies a sequence of cell taps to a fresh state for the fixture board.
function tapAll(indices: number[]) {
  let state = initGameState(fixtureBoard());
  for (const index of indices) {
    state = gameReducer(state, { type: "toggle", index });
  }
  return state;
}

describe("selection toggling", () => {
  it("selects a cell on tap", () => {
    expect(tapAll([0]).selected).toEqual([0]);
  });

  it("deselects a cell when tapped again", () => {
    expect(tapAll([0, 0]).selected).toEqual([]);
  });

  it("keeps other selections when one is deselected", () => {
    expect(tapAll([0, 1, 0]).selected).toEqual([1]);
  });

  it("clears the selection after the third tap evaluates", () => {
    expect(tapAll([0, 1, 2]).selected).toEqual([]);
  });
});

describe("scoring", () => {
  it("awards +1 and records a new valid set", () => {
    const state = tapAll([0, 1, 2]);
    expect(state.score).toBe(1);
    expect(state.found).toEqual([[0, 1, 2]]);
    expect(state.lastOutcome).toBe("set");
  });

  it("records the found set sorted regardless of tap order", () => {
    const state = tapAll([2, 0, 1]);
    expect(state.found).toEqual([[0, 1, 2]]);
  });

  it("awards 0 when re-submitting an already-found set", () => {
    const state = tapAll([0, 1, 2, 2, 0, 1]);
    expect(state.score).toBe(1);
    expect(state.found).toEqual([[0, 1, 2]]);
    expect(state.lastOutcome).toBe("already-found");
  });

  it("subtracts 1 when three cells are not a set", () => {
    const state = tapAll([0, 1, 3]);
    expect(state.score).toBe(-1);
    expect(state.found).toEqual([]);
    expect(state.lastOutcome).toBe("not-set");
  });

  it("accumulates score across multiple evaluations", () => {
    // valid set (+1) then a non-set (−1) → 0.
    const state = tapAll([0, 1, 2, 0, 1, 3]);
    expect(state.score).toBe(0);
  });
});

// A second, clearly different board to load on a correct Complete.
function nextFixtureBoard(): Board {
  const cells = [
    cell("white", "circle", "blue"),
    cell("white", "triangle", "blue"),
    cell("white", "square", "blue"),
    cell("grey", "circle", "red"),
  ];
  return { cells, sets: findAllSets(cells) };
}

describe("complete", () => {
  it("awards +3 and loads the next board when every set is found", () => {
    // The fixture has exactly one set (0,1,2); find it, then declare complete.
    let state = tapAll([0, 1, 2]);
    const next = nextFixtureBoard();
    state = gameReducer(state, { type: "complete", nextBoard: next });

    expect(state.score).toBe(4); // +1 for the set, +3 for the complete
    expect(state.board).toBe(next);
    expect(state.found).toEqual([]);
    expect(state.selected).toEqual([]);
    expect(state.lastOutcome).toBe("complete-correct");
  });

  it("subtracts 1 and keeps the board when unfound sets remain", () => {
    const before = initGameState(fixtureBoard());
    const state = gameReducer(before, {
      type: "complete",
      nextBoard: nextFixtureBoard(),
    });

    expect(state.score).toBe(-1);
    expect(state.board).toBe(before.board);
    expect(state.lastOutcome).toBe("complete-wrong");
  });
});

describe("newBoard", () => {
  it("resets selection, found list, and feedback but keeps score", () => {
    let state = tapAll([0, 1, 2]);
    state = gameReducer(state, { type: "newBoard", board: fixtureBoard() });
    expect(state.selected).toEqual([]);
    expect(state.found).toEqual([]);
    expect(state.lastOutcome).toBeNull();
    expect(state.score).toBe(1);
  });
});
