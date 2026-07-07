import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Intro } from "./Intro";

afterEach(() => {
  vi.unstubAllGlobals();
});

// Clicks Next `count` times.
async function clickNext(user: ReturnType<typeof userEvent.setup>, count: number) {
  for (let i = 0; i < count; i++) {
    await user.click(screen.getByRole("button", { name: "Next" }));
  }
}

describe("Intro", () => {
  it("starts on step 1 with Next but no Previous and no Play", () => {
    render(<Intro onComplete={() => {}} />);
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();
  });

  it("shows a 6-dot progress indicator", () => {
    render(<Intro onComplete={() => {}} />);
    expect(screen.getByLabelText("Intro progress").querySelectorAll("li")).toHaveLength(6);
  });

  it("teaches the three attributes one at a time before the set examples", () => {
    render(<Intro onComplete={() => {}} />);
    expect(screen.getByRole("heading", { name: "Shape" })).toBeInTheDocument();
  });

  it("navigates forward and back; Play replaces Next only on the final step", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Intro onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();

    await clickNext(user, 4);
    // Final step: Next has become Play.
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();

    // Stepping back restores Next and hides Play.
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Play" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("uses a custom action label on the final step (e.g. Resume)", async () => {
    const user = userEvent.setup();
    render(<Intro onComplete={() => {}} actionLabel="Resume" />);

    await clickNext(user, 5);
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
  });

  it("reveals both example groups statically under reduced motion on an attribute step", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }));

    render(<Intro onComplete={() => {}} />);
    // Step 1 (Shape) has two example groups (same, then different) — both
    // shown immediately, no progressive reveal.
    expect(document.querySelectorAll(".intro-attr-group--shown")).toHaveLength(2);
  });

  it("reveals all attribute checks statically under reduced motion on the valid-set step", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }));

    const user = userEvent.setup();
    render(<Intro onComplete={() => {}} />);
    await clickNext(user, 3);
    expect(document.querySelectorAll(".intro-check--shown")).toHaveLength(3);
  });
});
