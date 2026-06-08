import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
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

// Steps through the 3-step intro and presses Play on the final step.
async function playThroughIntro(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Play" }));
}

afterEach(() => {
  localStorage.clear();
});

describe("App first-run intro", () => {
  it("shows the intro on first launch, not a home screen", () => {
    render(<App />);
    expect(screen.getByLabelText("Intro progress")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    // No Play button until the final step; the old static home is gone.
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "How to play" })).not.toBeInTheDocument();
  });

  it("steps to Play, which sets the seen flag and starts a fresh game", async () => {
    const user = userEvent.setup();
    render(<App initialBoard={fixtureBoard()} />);

    await playThroughIntro(user);

    expect(screen.getByRole("grid", { name: "Set board" })).toBeInTheDocument();
    expect(screen.getByLabelText("Time left")).toHaveTextContent("2:00");
    expect(localStorage.getItem("sod.introSeen")).toBe("true");
  });
});

describe("App returning player", () => {
  it("skips the intro and launches straight into a game", () => {
    localStorage.setItem("sod.introSeen", "true");
    render(<App initialBoard={fixtureBoard()} />);

    expect(screen.getByRole("grid", { name: "Set board" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Intro progress")).not.toBeInTheDocument();
  });
});

describe("App game-over flow", () => {
  beforeEach(() => {
    // Seed the seen flag so the app launches straight into play, skipping the
    // intro these tests don't exercise.
    localStorage.setItem("sod.introSeen", "true");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Uses fireEvent (synchronous) rather than userEvent, which doesn't cooperate
  // with fake timers here.
  function scoreOneSet() {
    for (const pos of [1, 2, 3]) {
      fireEvent.click(screen.getByRole("gridcell", { name: `Cell ${pos}` }));
    }
  }

  it("ends the game at timer zero and shows the final score", () => {
    render(<App initialBoard={fixtureBoard()} />);

    scoreOneSet();
    act(() => {
      vi.advanceTimersByTime(GAME_DURATION_SECONDS * 1000);
    });

    expect(screen.getByRole("heading", { name: "Game Over" })).toBeInTheDocument();
    expect(screen.getByLabelText("Final score")).toHaveTextContent("1");
    expect(screen.getByText("🎉 New best!")).toBeInTheDocument();
  });

  it("offers Play again and no Home button on Game Over", () => {
    render(<App initialBoard={fixtureBoard()} />);

    act(() => {
      vi.advanceTimersByTime(GAME_DURATION_SECONDS * 1000);
    });

    expect(screen.getByRole("button", { name: "Play again" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Home" })).not.toBeInTheDocument();
  });

  it("persists the high score so a later session sees it", () => {
    const { unmount } = render(<App initialBoard={fixtureBoard()} />);

    scoreOneSet();
    act(() => {
      vi.advanceTimersByTime(GAME_DURATION_SECONDS * 1000);
    });
    unmount();

    // A fresh app: play a scoreless game and confirm Game Over still reports the
    // persisted best of 1 (and doesn't celebrate, since 0 < 1).
    render(<App initialBoard={fixtureBoard()} />);
    act(() => {
      vi.advanceTimersByTime(GAME_DURATION_SECONDS * 1000);
    });

    expect(screen.getByLabelText("Final score")).toHaveTextContent("0");
    expect(screen.getByLabelText("High score")).toHaveTextContent("1");
    expect(screen.queryByText("🎉 New best!")).not.toBeInTheDocument();
  });
});
