import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DailyLanding } from "./DailyLanding";

describe("DailyLanding", () => {
  it("starts the Daily puzzle on Start", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<DailyLanding onStart={onStart} onPlayTimed={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Start" }));

    expect(onStart).toHaveBeenCalled();
  });

  it("links to Timed mode instead", async () => {
    const user = userEvent.setup();
    const onPlayTimed = vi.fn();
    render(<DailyLanding onStart={() => {}} onPlayTimed={onPlayTimed} />);

    await user.click(screen.getByRole("button", { name: "Play Timed mode instead" }));

    expect(onPlayTimed).toHaveBeenCalled();
  });
});
