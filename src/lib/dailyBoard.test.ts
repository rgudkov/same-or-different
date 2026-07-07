import { describe, expect, it } from "vitest";
import { BOARD_SIZE, findAllSets, MIN_SETS } from "./board";
import { generateDailyBoard, randomFromDate } from "./dailyBoard";

describe("randomFromDate", () => {
  it("produces the same sequence for the same date", () => {
    const a = randomFromDate("2026-07-07");
    const b = randomFromDate("2026-07-07");
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("produces a different sequence for a different date", () => {
    const a = randomFromDate("2026-07-07");
    const b = randomFromDate("2026-07-08");
    expect(a()).not.toBe(b());
  });
});

describe("generateDailyBoard", () => {
  it("is deterministic for a fixed date", () => {
    expect(generateDailyBoard("2026-07-07").cells).toEqual(
      generateDailyBoard("2026-07-07").cells,
    );
  });

  it("differs for different dates (common case)", () => {
    // Spot-check a handful of date pairs; a seed collision is possible in
    // principle but vanishingly unlikely across this small sample.
    const dates = ["2026-01-01", "2026-03-15", "2026-07-07", "2026-12-31"];
    const boards = dates.map((d) => generateDailyBoard(d).cells);
    const serialized = boards.map((cells) => JSON.stringify(cells));
    expect(new Set(serialized).size).toBe(dates.length);
  });

  it("satisfies board invariants: 9 distinct cells and at least MIN_SETS sets", () => {
    const board = generateDailyBoard("2026-07-07");
    expect(board.cells).toHaveLength(BOARD_SIZE);
    const keys = new Set(
      board.cells.map((c) => `${c.background}-${c.shape}-${c.shapeColor}`),
    );
    expect(keys.size).toBe(BOARD_SIZE);
    expect(board.sets.length).toBeGreaterThanOrEqual(MIN_SETS);
    expect(board.sets).toEqual(findAllSets(board.cells));
  });
});
