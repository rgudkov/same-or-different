import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameOver } from "./GameOver";
import type { Cell } from "../types";
import type { Board } from "../lib/board";
import { findAllSets } from "../lib/board";

function cell(
  background: Cell["background"],
  shape: Cell["shape"],
  shapeColor: Cell["shapeColor"],
): Cell {
  return { background, shape, shapeColor };
}

// A board with several sets; cells 1,2,3 (1-based) form one of them, so a found
// list of [[0,1,2]] leaves the rest as "missed".
function reviewBoard(): Board {
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
  if (board.sets.length < 2) {
    throw new Error("fixture invariant broken: need at least 2 sets to review");
  }
  return board;
}

const noop = () => {};

describe("GameOver summary", () => {
  it("renders the score, best, celebration, and the single Play again route", () => {
    const board = reviewBoard();
    render(
      <GameOver
        score={5}
        highScore={5}
        isNewHighScore
        board={board}
        found={[]}
        onPlayAgain={noop}
      />,
    );

    expect(screen.getByRole("heading", { name: "Game Over" })).toBeInTheDocument();
    expect(screen.getByLabelText("Final score")).toHaveTextContent("5");
    expect(screen.getByLabelText("High score")).toHaveTextContent("5");
    expect(screen.getByText("🎉 New best!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play again" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Home" })).not.toBeInTheDocument();
  });
});

describe("GameOver set review", () => {
  it("shows missed sets first, then found sets, as static thumbnails", () => {
    const board = reviewBoard();
    const found = [board.sets[0]];

    render(
      <GameOver
        score={1}
        highScore={1}
        isNewHighScore={false}
        board={board}
        found={found}
        onPlayAgain={noop}
      />,
    );

    const missed = screen.getByRole("region", { name: "Missed sets" });
    const foundSection = screen.getByRole("region", { name: "Found sets" });
    expect(missed).toBeInTheDocument();
    expect(foundSection).toBeInTheDocument();

    // Missed renders before Found in document order (the teaching moment first).
    expect(missed.compareDocumentPosition(foundSection)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    // One thumbnail per set, none of them interactive (no buttons in the review).
    const thumbnails = screen.getAllByRole("grid");
    expect(thumbnails).toHaveLength(board.sets.length);
    for (const thumb of thumbnails) {
      expect(within(thumb).queryByRole("button")).not.toBeInTheDocument();
    }
  });

  it("captions a found thumbnail with its 1-based coordinates", () => {
    const board = reviewBoard();
    // board.sets[0] is [0,1,2] in enumeration order → caption "1,2,3".
    render(
      <GameOver
        score={1}
        highScore={1}
        isNewHighScore={false}
        board={board}
        found={[board.sets[0]]}
        onPlayAgain={noop}
      />,
    );

    const foundSection = screen.getByRole("region", { name: "Found sets" });
    expect(within(foundSection).getByText("1,2,3")).toBeInTheDocument();
    // The found thumbnail is labeled by its coordinates for assistive tech.
    expect(within(foundSection).getByRole("grid", { name: "Set 1,2,3" })).toBeInTheDocument();
  });

  it("omits the Missed section when nothing was missed", () => {
    const board = reviewBoard();
    render(
      <GameOver
        score={10}
        highScore={10}
        isNewHighScore={false}
        board={board}
        found={board.sets}
        onPlayAgain={noop}
      />,
    );

    expect(screen.queryByRole("region", { name: "Missed sets" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Found sets" })).toBeInTheDocument();
  });

  it("omits the Found section when nothing was found", () => {
    const board = reviewBoard();
    render(
      <GameOver
        score={0}
        highScore={0}
        isNewHighScore={false}
        board={board}
        found={[]}
        onPlayAgain={noop}
      />,
    );

    expect(screen.getByRole("region", { name: "Missed sets" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Found sets" })).not.toBeInTheDocument();
  });
});
