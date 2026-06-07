import { describe, expect, it } from "vitest";
import type { Cell } from "../types";
import { allCells, BOARD_SIZE, findAllSets, generateBoard, isSet } from "./board";

// Shorthand cell constructor for readable test fixtures.
function cell(
  background: Cell["background"],
  shape: Cell["shape"],
  shapeColor: Cell["shapeColor"],
): Cell {
  return { background, shape, shapeColor };
}

describe("isSet", () => {
  it("accepts three cells all-same on every attribute", () => {
    const a = cell("black", "triangle", "red");
    expect(isSet(a, a, a)).toBe(true);
  });

  it("accepts all-different on every attribute", () => {
    expect(
      isSet(
        cell("black", "triangle", "red"),
        cell("white", "square", "blue"),
        cell("grey", "circle", "yellow"),
      ),
    ).toBe(true);
  });

  it("accepts a mix of all-same and all-different attributes", () => {
    // backgrounds all black; shapes all different; shape colors all yellow.
    expect(
      isSet(
        cell("black", "triangle", "yellow"),
        cell("black", "square", "yellow"),
        cell("black", "circle", "yellow"),
      ),
    ).toBe(true);
  });

  it("rejects when one attribute is two-same-one-different", () => {
    // shape colors are yellow/yellow/red — not all-same, not all-different.
    expect(
      isSet(
        cell("black", "triangle", "yellow"),
        cell("black", "square", "yellow"),
        cell("black", "circle", "red"),
      ),
    ).toBe(false);
  });

  it("rejects when a different attribute is the offender", () => {
    // backgrounds black/black/white violate the rule.
    expect(
      isSet(
        cell("black", "triangle", "red"),
        cell("black", "square", "blue"),
        cell("white", "circle", "yellow"),
      ),
    ).toBe(false);
  });
});

describe("findAllSets", () => {
  it("finds the single set in a hand-verified board", () => {
    // Cells 0,1,2 form a set (all black, shapes all different, all red). Cell 3
    // shares a white background with no one, so every triple involving it has a
    // background of black/black/white — never all-same or all-different.
    const cells = [
      cell("black", "triangle", "red"),
      cell("black", "square", "red"),
      cell("black", "circle", "red"),
      cell("white", "triangle", "red"),
    ];
    expect(findAllSets(cells)).toEqual([[0, 1, 2]]);
  });

  it("returns no sets for a board with none", () => {
    const cells = [
      cell("black", "triangle", "red"),
      cell("black", "square", "red"),
      cell("white", "triangle", "blue"),
    ];
    expect(findAllSets(cells)).toEqual([]);
  });

  it("returns sorted ascending index triples", () => {
    const cells = [
      cell("black", "triangle", "red"),
      cell("white", "square", "blue"),
      cell("grey", "circle", "yellow"),
    ];
    expect(findAllSets(cells)).toEqual([[0, 1, 2]]);
  });
});

describe("allCells", () => {
  it("enumerates all 27 distinct cells", () => {
    const cells = allCells();
    expect(cells).toHaveLength(27);
    const keys = new Set(cells.map((c) => `${c.background}-${c.shape}-${c.shapeColor}`));
    expect(keys.size).toBe(27);
  });
});

describe("generateBoard", () => {
  it("yields 9 distinct cells", () => {
    const board = generateBoard();
    expect(board.cells).toHaveLength(BOARD_SIZE);
    const keys = new Set(
      board.cells.map((c) => `${c.background}-${c.shape}-${c.shapeColor}`),
    );
    expect(keys.size).toBe(BOARD_SIZE);
  });

  it("computes a set list consistent with findAllSets", () => {
    const board = generateBoard();
    expect(board.sets).toEqual(findAllSets(board.cells));
  });

  it("is deterministic for a fixed random source", () => {
    const seeded = () => 0.42;
    expect(generateBoard(seeded).cells).toEqual(generateBoard(seeded).cells);
  });

  it("produces distinct cells even with a degenerate random source", () => {
    // A constant random source still must not duplicate cells, since selection
    // is by removal from a distinct pool.
    const board = generateBoard(() => 0);
    const keys = new Set(
      board.cells.map((c) => `${c.background}-${c.shape}-${c.shapeColor}`),
    );
    expect(keys.size).toBe(BOARD_SIZE);
  });
});
