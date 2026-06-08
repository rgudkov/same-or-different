// Core domain logic for the "Same or Different" game: the set predicate, the
// authoritative set finder, and a random board generator. Kept pure (no React,
// no DOM) so scoring correctness can be unit-tested in isolation.

import type { Cell } from "../types";
import { BACKGROUNDS, SHAPES, SHAPE_COLORS } from "../types";

// A generated board: its 9 distinct cells plus the authoritative list of all
// sets, each set being a sorted triple of 0-based cell indices. The set list is
// always recomputed from the cells so scoring is exact regardless of how the
// board was produced.
export type Board = {
  cells: Cell[];
  sets: number[][];
};

export const BOARD_SIZE = 9;

// Every board must offer at least this many sets so a fresh board is always
// solvable and "Complete" is a real decision (no zero-set boards).
export const MIN_SETS = 2;

// Safety cap on rejection sampling so a degenerate random source can't loop
// forever; in practice a random 9 cells clears MIN_SETS almost immediately.
const MAX_GENERATION_ATTEMPTS = 100;

// True when, for each attribute independently, the three values are either all
// the same or all different.
export function isSet(a: Cell, b: Cell, c: Cell): boolean {
  return (
    allSameOrAllDifferent(a.background, b.background, c.background) &&
    allSameOrAllDifferent(a.shape, b.shape, c.shape) &&
    allSameOrAllDifferent(a.shapeColor, b.shapeColor, c.shapeColor)
  );
}

function allSameOrAllDifferent<T>(x: T, y: T, z: T): boolean {
  const allSame = x === y && y === z;
  const allDifferent = x !== y && y !== z && x !== z;
  return allSame || allDifferent;
}

// Enumerates every 3-cell combination of the board and returns those that form
// a set, as sorted triples of indices. This is the authoritative set list used
// for scoring and the Complete check.
export function findAllSets(cells: Cell[]): number[][] {
  const sets: number[][] = [];
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      for (let k = j + 1; k < cells.length; k++) {
        if (isSet(cells[i], cells[j], cells[k])) {
          sets.push([i, j, k]);
        }
      }
    }
  }
  return sets;
}

// All 27 unique cells (the full attribute space).
export function allCells(): Cell[] {
  const cells: Cell[] = [];
  for (const background of BACKGROUNDS) {
    for (const shape of SHAPES) {
      for (const shapeColor of SHAPE_COLORS) {
        cells.push({ background, shape, shapeColor });
      }
    }
  }
  return cells;
}

// Generates a board of 9 distinct random cells guaranteed to contain at least
// `MIN_SETS` sets, with its set list always recomputed so scoring is exact. The
// optional `random` source (defaulting to Math.random) makes generation
// deterministic in tests. Uses rejection sampling: draw a random board, keep it
// if it clears MIN_SETS, otherwise redraw. The attempt cap guards against a
// degenerate random source that can't reach the threshold (it then returns the
// last draw, which is still 9 distinct cells).
export function generateBoard(random: () => number = Math.random): Board {
  let board: Board = drawBoard(random);
  for (let attempt = 1; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    if (board.sets.length >= MIN_SETS) return board;
    board = drawBoard(random);
  }
  return board;
}

// Draws one random board of 9 distinct cells and computes its set list.
function drawBoard(random: () => number): Board {
  const pool = allCells();
  shuffle(pool, random);
  const cells = pool.slice(0, BOARD_SIZE);
  return { cells, sets: findAllSets(cells) };
}

// In-place Fisher–Yates shuffle driven by the injectable random source.
function shuffle<T>(items: T[], random: () => number): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}
