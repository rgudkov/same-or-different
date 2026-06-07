import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import type { Cell } from "./types";
import type { Board } from "./lib/board";
import { findAllSets, isSet } from "./lib/board";

function cell(
  background: Cell["background"],
  shape: Cell["shape"],
  shapeColor: Cell["shapeColor"],
): Cell {
  return { background, shape, shapeColor };
}

// A deterministic 9-cell board. The tests only ever tap cells 1–4 (1-based), so
// what matters is: cells 1,2,3 form a set (all black, all-different shapes, all
// red) while cells 1,2,4 do not (backgrounds black/black/white). The board may
// contain other sets among the untouched cells — that's fine and unasserted.
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
  // Guard the facts the assertions depend on, so a fixture edit can't silently
  // invalidate the tests.
  if (!isSet(cells[0], cells[1], cells[2]) || isSet(cells[0], cells[1], cells[3])) {
    throw new Error("fixture invariant broken: 1,2,3 must be a set; 1,2,4 must not");
  }
  return board;
}

// Reads the live score off the labelled element.
function score(): string {
  return screen.getByLabelText("Score").textContent ?? "";
}

function gridcell(position: number): HTMLElement {
  return screen.getByRole("gridcell", { name: `Cell ${position}` });
}

describe("App selection", () => {
  it("highlights a cell on tap and clears it on a second tap", async () => {
    const user = userEvent.setup();
    render(<App initialBoard={fixtureBoard()} />);

    await user.click(gridcell(1));
    expect(gridcell(1)).toHaveAttribute("aria-pressed", "true");

    await user.click(gridcell(1));
    expect(gridcell(1)).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps an earlier selection when a different cell is deselected", async () => {
    const user = userEvent.setup();
    render(<App initialBoard={fixtureBoard()} />);

    await user.click(gridcell(1));
    await user.click(gridcell(2));
    await user.click(gridcell(2));

    expect(gridcell(1)).toHaveAttribute("aria-pressed", "true");
    expect(gridcell(2)).toHaveAttribute("aria-pressed", "false");
  });

  it("auto-evaluates and clears the selection on the third tap", async () => {
    const user = userEvent.setup();
    render(<App initialBoard={fixtureBoard()} />);

    await user.click(gridcell(1));
    await user.click(gridcell(2));
    await user.click(gridcell(3));

    for (const pos of [1, 2, 3]) {
      expect(gridcell(pos)).toHaveAttribute("aria-pressed", "false");
    }
  });
});

describe("App scoring", () => {
  it("awards +1 and lists a valid set as sorted cell numbers", async () => {
    const user = userEvent.setup();
    render(<App initialBoard={fixtureBoard()} />);

    await user.click(gridcell(1));
    await user.click(gridcell(2));
    await user.click(gridcell(3));

    expect(score()).toBe("1");
    const found = screen.getByRole("region", { name: "Found sets" });
    expect(within(found).getByText("1,2,3")).toBeInTheDocument();
  });

  it("records the found set regardless of tap order", async () => {
    const user = userEvent.setup();
    render(<App initialBoard={fixtureBoard()} />);

    await user.click(gridcell(3));
    await user.click(gridcell(1));
    await user.click(gridcell(2));

    const found = screen.getByRole("region", { name: "Found sets" });
    expect(within(found).getByText("1,2,3")).toBeInTheDocument();
  });

  it("awards 0 when re-submitting an already-found set", async () => {
    const user = userEvent.setup();
    render(<App initialBoard={fixtureBoard()} />);

    for (const pos of [1, 2, 3, 1, 2, 3]) await user.click(gridcell(pos));

    expect(score()).toBe("1");
    const found = screen.getByRole("region", { name: "Found sets" });
    expect(within(found).getAllByText("1,2,3")).toHaveLength(1);
  });

  it("subtracts 1 when three cells are not a set and lists nothing", async () => {
    const user = userEvent.setup();
    render(<App initialBoard={fixtureBoard()} />);

    await user.click(gridcell(1));
    await user.click(gridcell(2));
    await user.click(gridcell(4));

    expect(score()).toBe("-1");
    expect(screen.getByText("None yet")).toBeInTheDocument();
  });
});
