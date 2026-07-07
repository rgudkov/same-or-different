import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StreakStatus } from "./StreakStatus";

describe("StreakStatus", () => {
  it("shows current streak, longest streak, and today's recap", () => {
    render(
      <StreakStatus
        currentStreak={5}
        longestStreak={9}
        result={{ date: "2026-07-07", timeTakenSeconds: 65, mistakeCount: 2 }}
        justCompleted={false}
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
        justCompleted={false}
        onPlayTimed={() => {}}
      />,
    );

    expect(screen.getByLabelText("Today's result")).toHaveTextContent("1 mistake");
  });

  it("tells the player the puzzle can't be replayed", () => {
    render(
      <StreakStatus
        currentStreak={1}
        longestStreak={1}
        result={null}
        justCompleted={false}
        onPlayTimed={() => {}}
      />,
    );

    expect(screen.getByText(/can't be replayed/)).toBeInTheDocument();
  });

  it("links to Timed mode", async () => {
    const user = userEvent.setup();
    const onPlayTimed = vi.fn();
    render(
      <StreakStatus
        currentStreak={1}
        longestStreak={1}
        result={null}
        justCompleted={false}
        onPlayTimed={onPlayTimed}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Play Timed mode" }));

    expect(onPlayTimed).toHaveBeenCalled();
  });

  it("shows congratulatory copy right after completing", () => {
    render(
      <StreakStatus
        currentStreak={1}
        longestStreak={1}
        result={null}
        justCompleted={true}
        onPlayTimed={() => {}}
      />,
    );

    expect(screen.getByText(/nice work/i)).toBeInTheDocument();
  });

  it("shows quieter status copy on a later same-day visit", () => {
    render(
      <StreakStatus
        currentStreak={1}
        longestStreak={1}
        result={null}
        justCompleted={false}
        onPlayTimed={() => {}}
      />,
    );

    expect(screen.getByText(/today's daily is done/i)).toBeInTheDocument();
  });

  describe("sharing today's result", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("hands off to the OS share sheet when the Web Share API is available", async () => {
      const user = userEvent.setup();
      const share = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { ...navigator, share });

      render(
        <StreakStatus
          currentStreak={5}
          longestStreak={9}
          result={{ date: "2026-07-07", timeTakenSeconds: 65, mistakeCount: 2 }}
          justCompleted={false}
          onPlayTimed={() => {}}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Share" }));

      expect(share).toHaveBeenCalledWith({
        text: "🎉 I finished today's puzzle in 1:05 with 2 mistakes. How quick are you? Try https://rgudkov.github.io/same-or-different/ 🧩",
      });
      expect(share.mock.calls[0][0].text).not.toMatch(/day \d/i);
    });

    it("copies the result text to the clipboard when the Web Share API is unavailable", async () => {
      const user = userEvent.setup();
      // userEvent.setup() installs its own clipboard stub on navigator, so it
      // must run before vi.stubGlobal or it clobbers the override below.
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });

      render(
        <StreakStatus
          currentStreak={5}
          longestStreak={9}
          result={{ date: "2026-07-07", timeTakenSeconds: 65, mistakeCount: 2 }}
          justCompleted={false}
          onPlayTimed={() => {}}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Share" }));

      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("1:05"));
      expect(await screen.findByText(/copied/i)).toBeInTheDocument();
    });

    it("does not show a Share button when there is no result to share", () => {
      render(
        <StreakStatus
          currentStreak={1}
          longestStreak={1}
          result={null}
          justCompleted={false}
          onPlayTimed={() => {}}
        />,
      );

      expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
    });
  });
});
