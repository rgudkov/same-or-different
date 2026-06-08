import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Game } from "./Game";
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

// A deterministic 9-cell board. Cells 1,2,3 (1-based) form a set (all black,
// all-different shapes, all red) while cells 1,2,4 do not (backgrounds
// black/black/white). Other sets may exist among the remaining cells — the tests
// that need the full set list read it off `board.sets`.
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

function score(): string {
  return screen.getByLabelText("Score").textContent ?? "";
}

function gridcell(position: number): HTMLElement {
  return screen.getByRole("gridcell", { name: `Cell ${position}` });
}

const noop = () => {};

describe("Game selection", () => {
  it("highlights a cell on tap and clears it on a second tap", async () => {
    const user = userEvent.setup();
    render(<Game initialBoard={fixtureBoard()} onGameOver={noop} highScore={0} />);

    await user.click(gridcell(1));
    expect(gridcell(1)).toHaveAttribute("aria-pressed", "true");

    await user.click(gridcell(1));
    expect(gridcell(1)).toHaveAttribute("aria-pressed", "false");
  });

  it("auto-evaluates and clears the selection on the third tap", async () => {
    const user = userEvent.setup();
    render(<Game initialBoard={fixtureBoard()} onGameOver={noop} highScore={0} />);

    await user.click(gridcell(1));
    await user.click(gridcell(2));
    await user.click(gridcell(3));

    for (const pos of [1, 2, 3]) {
      expect(gridcell(pos)).toHaveAttribute("aria-pressed", "false");
    }
  });
});

describe("Game scoring", () => {
  it("awards +1 and lists a valid set as sorted cell numbers", async () => {
    const user = userEvent.setup();
    render(<Game initialBoard={fixtureBoard()} onGameOver={noop} highScore={0} />);

    await user.click(gridcell(1));
    await user.click(gridcell(2));
    await user.click(gridcell(3));

    expect(score()).toBe("1");
    const found = screen.getByRole("region", { name: "Found sets" });
    expect(within(found).getByText("1,2,3")).toBeInTheDocument();
  });

  it("awards 0 when re-submitting an already-found set", async () => {
    const user = userEvent.setup();
    render(<Game initialBoard={fixtureBoard()} onGameOver={noop} highScore={0} />);

    for (const pos of [1, 2, 3, 1, 2, 3]) await user.click(gridcell(pos));

    expect(score()).toBe("1");
    const found = screen.getByRole("region", { name: "Found sets" });
    expect(within(found).getAllByText("1,2,3")).toHaveLength(1);
  });

  it("subtracts 1 when three cells are not a set and lists nothing", async () => {
    const user = userEvent.setup();
    render(<Game initialBoard={fixtureBoard()} onGameOver={noop} highScore={0} />);

    await user.click(gridcell(1));
    await user.click(gridcell(2));
    await user.click(gridcell(4));

    expect(score()).toBe("-1");
    expect(screen.getByText("None yet")).toBeInTheDocument();
  });
});

describe("Game complete", () => {
  it("subtracts 1 and keeps playing on a wrong Complete", async () => {
    const user = userEvent.setup();
    render(<Game initialBoard={fixtureBoard()} onGameOver={noop} highScore={0} />);

    await user.click(screen.getByRole("button", { name: /no more sets/i }));

    expect(score()).toBe("-1");
    expect(screen.getByText("None yet")).toBeInTheDocument();
    // A visible toast explains the rejection, not just the score change.
    expect(screen.getByText("Sets still remain −1")).toBeInTheDocument();
  });

  it("awards +3 and loads a fresh board once every set is found", async () => {
    const user = userEvent.setup();
    const board = fixtureBoard();
    render(<Game initialBoard={board} onGameOver={noop} highScore={0} />);

    // Find every set on the board, then declare complete.
    for (const triple of board.sets) {
      for (const index of triple) await user.click(gridcell(index + 1));
    }
    await user.click(screen.getByRole("button", { name: /no more sets/i }));

    // +1 per set found, +3 for the correct Complete; found list resets.
    expect(score()).toBe(String(board.sets.length + 3));
    expect(screen.getByText("None yet")).toBeInTheDocument();
  });
});
