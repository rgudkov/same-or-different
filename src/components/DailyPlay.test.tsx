import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DailyPlay } from "./DailyPlay";
import type { Cell } from "../types";
import type { Board } from "../lib/board";
import { findAllSets, isSet } from "../lib/board";

function cell(
  background: Cell["background"],
  shape: Cell["shape"],
  shapeColor: Cell["shapeColor"],
): Cell {
  return { background, shape, shapeColor };
}

// Same fixture shape used across the other component tests: cells 1,2,3 form a
// set; cells 1,2,4 do not. Other sets may exist among the rest — tests that
// need every set read `board.sets`.
function fixtureBoard(): Board {
  const cells = [
    cell("black", "triangle", "red"),
    cell("black", "square", "red"),
    cell("black", "circle", "red"),
    cell("white", "triangle", "red"),
    cell("white", "square", "blue"),
    cell("grey", "circle", "yellow"),
    cell("grey", "triangle", "blue"),
    cell("white", "circle", "red"),
    cell("black", "square", "yellow"),
  ];
  const board = { cells, sets: findAllSets(cells) };
  if (!isSet(cells[0], cells[1], cells[2]) || isSet(cells[0], cells[1], cells[3])) {
    throw new Error("fixture invariant broken: 1,2,3 must be a set; 1,2,4 must not");
  }
  return board;
}

function gridcell(position: number): HTMLElement {
  return screen.getByRole("gridcell", { name: `Cell ${position}` });
}

afterEach(() => {
  localStorage.clear();
});

describe("DailyPlay", () => {
  it("has no timer, since Daily is untimed", () => {
    render(<DailyPlay board={fixtureBoard()} onComplete={() => {}} />);
    expect(screen.queryByLabelText("Time left")).not.toBeInTheDocument();
  });

  it("reports zero mistakes and the sets found when every set is found and Complete is correct", async () => {
    const user = userEvent.setup();
    const board = fixtureBoard();
    const onComplete = vi.fn();
    render(<DailyPlay board={board} onComplete={onComplete} />);

    for (const triple of board.sets) {
      for (const index of triple) await user.click(gridcell(index + 1));
    }
    await user.click(screen.getByRole("button", { name: /no more sets/i }));

    expect(onComplete).toHaveBeenCalledWith({
      timeTakenSeconds: expect.any(Number),
      mistakeCount: 0,
    });
  });

  it("counts a not-set selection and a wrong Complete as mistakes", async () => {
    const user = userEvent.setup();
    const board = fixtureBoard();
    const onComplete = vi.fn();
    render(<DailyPlay board={board} onComplete={onComplete} />);

    // A not-set selection (cells 1,2,4).
    await user.click(gridcell(1));
    await user.click(gridcell(2));
    await user.click(gridcell(4));

    // A wrong Complete, since no sets have been found yet.
    await user.click(screen.getByRole("button", { name: /no more sets/i }));

    // Now find every set and complete correctly.
    for (const triple of board.sets) {
      for (const index of triple) await user.click(gridcell(index + 1));
    }
    await user.click(screen.getByRole("button", { name: /no more sets/i }));

    expect(onComplete).toHaveBeenCalledWith({
      timeTakenSeconds: expect.any(Number),
      mistakeCount: 2,
    });
  });

  it("does not end the session on a wrong Complete", async () => {
    const user = userEvent.setup();
    const board = fixtureBoard();
    const onComplete = vi.fn();
    render(<DailyPlay board={board} onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: /no more sets/i }));

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("grid", { name: "Set board" })).toBeInTheDocument();
  });
});
