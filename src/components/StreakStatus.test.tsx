import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StreakStatus } from "./StreakStatus";

describe("StreakStatus", () => {
  it("shows current streak, longest streak, and today's recap", () => {
    render(
      <StreakStatus
        currentStreak={5}
        longestStreak={9}
        result={{ date: "2026-07-07", timeTakenSeconds: 65, mistakeCount: 2 }}
        onPlayTimed={() => {}}
      />,
    );

    expect(screen.getByLabelText("Current streak")).toHaveTextContent("5");
    expect(screen.getByLabelText("Longest streak")).toHaveTextContent("9");
    expect(screen.getByLabelText("Today's result")).toHaveTextContent("1:05");
    expect(screen.getByLabelText("Today's result")).toHaveTextContent("2 mistakes");
  });

  it("singularizes a one-mistake recap", () => {
    render(
      <StreakStatus
        currentStreak={1}
        longestStreak={1}
        result={{ date: "2026-07-07", timeTakenSeconds: 30, mistakeCount: 1 }}
        onPlayTimed={() => {}}
      />,
    );

    expect(screen.getByLabelText("Today's result")).toHaveTextContent("1 mistake");
  });

  it("tells the player the puzzle can't be replayed", () => {
    render(
      <StreakStatus currentStreak={1} longestStreak={1} result={null} onPlayTimed={() => {}} />,
    );

    expect(screen.getByText(/can't be replayed/)).toBeInTheDocument();
  });

  it("links to Timed mode", async () => {
    const user = userEvent.setup();
    const onPlayTimed = vi.fn();
    render(
      <StreakStatus currentStreak={1} longestStreak={1} result={null} onPlayTimed={onPlayTimed} />,
    );

    await user.click(screen.getByRole("button", { name: "Play Timed mode" }));

    expect(onPlayTimed).toHaveBeenCalled();
  });
});
