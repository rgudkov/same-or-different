import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Cell } from "./types";
import type { Board } from "./lib/board";
import { findAllSets, isSet } from "./lib/board";
import { GAME_DURATION_SECONDS } from "./components/Game";

function cell(
  background: Cell["background"],
  shape: Cell["shape"],
  shapeColor: Cell["shapeColor"],
): Cell {
  return { background, shape, shapeColor };
}

// 9-cell board whose cells 1,2,3 form a set, so a flow test can score points.
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
  if (!isSet(cells[0], cells[1], cells[2])) {
    throw new Error("fixture invariant broken: 1,2,3 must be a set");
  }
  return board;
}

afterEach(() => {
  localStorage.clear();
});

describe("App home screen", () => {
  it("shows the title, Play button, and rules but not the best score", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Same or Different" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "How to play" })).toBeInTheDocument();
    // The best score is intentionally not shown on Home.
    expect(screen.queryByLabelText("High score")).not.toBeInTheDocument();
  });

  it("starts a game when Play is clicked", async () => {
    const user = userEvent.setup();
    render(<App initialBoard={fixtureBoard()} />);

    await user.click(screen.getByRole("button", { name: "Play" }));

    expect(screen.getByLabelText("Time left")).toHaveTextContent("2:00");
    expect(screen.getByRole("grid", { name: "Set board" })).toBeInTheDocument();
    // The best score is shown on the Game screen as quiet, informative text.
    expect(screen.getByLabelText("Best score")).toHaveTextContent("Best 0");
  });
});

describe("App game-over flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Uses fireEvent (synchronous) rather than userEvent, which doesn't cooperate
  // with fake timers here.
  function playAndScoreOneSet() {
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    // Score one set (+1) before the clock runs out.
    for (const pos of [1, 2, 3]) {
      fireEvent.click(screen.getByRole("gridcell", { name: `Cell ${pos}` }));
    }
  }

  it("ends the game at timer zero and shows the final score", () => {
    render(<App initialBoard={fixtureBoard()} />);

    playAndScoreOneSet();
    act(() => {
      vi.advanceTimersByTime(GAME_DURATION_SECONDS * 1000);
    });

    expect(screen.getByRole("heading", { name: "Game Over" })).toBeInTheDocument();
    expect(screen.getByLabelText("Final score")).toHaveTextContent("1");
    expect(screen.getByText("🎉 New best!")).toBeInTheDocument();
  });

  it("persists the high score so a later session sees it", () => {
    const { unmount } = render(<App initialBoard={fixtureBoard()} />);

    playAndScoreOneSet();
    act(() => {
      vi.advanceTimersByTime(GAME_DURATION_SECONDS * 1000);
    });
    unmount();

    // A fresh app: play a scoreless game and confirm Game Over still reports the
    // persisted best of 1 (and doesn't celebrate, since 0 < 1).
    render(<App initialBoard={fixtureBoard()} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => {
      vi.advanceTimersByTime(GAME_DURATION_SECONDS * 1000);
    });

    expect(screen.getByLabelText("Final score")).toHaveTextContent("0");
    expect(screen.getByLabelText("High score")).toHaveTextContent("1");
    expect(screen.queryByText("🎉 New best!")).not.toBeInTheDocument();
  });
});
