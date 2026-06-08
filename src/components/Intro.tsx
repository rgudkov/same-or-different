import { useEffect, useState } from "react";
import type { Cell } from "../types";
import { isSet } from "../lib/board";
import { CellView } from "./CellView";

// The onboarding intro: a short, 3-step, animated explanation that teaches the
// set rule by showing it, then reveals the action button (Play on first run,
// Resume when replayed) only on the final step. It replaces the former static
// Home screen.

// The intro is always exactly three steps.
const STEP_COUNT = 3;

// Delay between each attribute check revealing on the example steps.
const REVEAL_INTERVAL_MS = 650;

// A single attribute verdict shown on an example step.
type Check = {
  label: string;
  // The reason the attribute passes or fails, e.g. "all the same".
  verdict: string;
  pass: boolean;
};

// Hand-authored example cells (deterministic, never generated) so the lesson is
// always visually clear and unambiguous.

// Step 1 — a valid set. Background is all-same while shape and shape color are
// all-different, so both "all same" and "all different" appear in one example.
const VALID_EXAMPLE: [Cell, Cell, Cell] = [
  { background: "black", shape: "triangle", shapeColor: "red" },
  { background: "black", shape: "square", shapeColor: "blue" },
  { background: "black", shape: "circle", shapeColor: "yellow" },
];

const VALID_CHECKS: Check[] = [
  { label: "Background", verdict: "all the same", pass: true },
  { label: "Shape", verdict: "all different", pass: true },
  { label: "Shape color", verdict: "all different", pass: true },
];

// Step 2 — a near-set that fails on exactly one attribute. The shape colors are
// two reds and a blue (neither all same nor all different); the other two
// attributes still pass, so a single ✗ is the whole lesson.
const NEAR_MISS_EXAMPLE: [Cell, Cell, Cell] = [
  { background: "black", shape: "triangle", shapeColor: "red" },
  { background: "black", shape: "square", shapeColor: "red" },
  { background: "black", shape: "circle", shapeColor: "blue" },
];

const NEAR_MISS_CHECKS: Check[] = [
  { label: "Background", verdict: "all the same", pass: true },
  { label: "Shape", verdict: "all different", pass: true },
  { label: "Shape color", verdict: "two red, one blue", pass: false },
];

// Dev-time invariants: keep the hand-authored examples honest if cells are ever
// edited. A valid-set example that isn't a set (or a near-miss that is) would
// silently teach the wrong lesson.
if (import.meta.env.DEV) {
  if (!isSet(...VALID_EXAMPLE)) {
    throw new Error("Intro: VALID_EXAMPLE must be a set");
  }
  if (isSet(...NEAR_MISS_EXAMPLE)) {
    throw new Error("Intro: NEAR_MISS_EXAMPLE must not be a set");
  }
}

// Tracks the user's reduced-motion preference, defaulting to "no preference"
// (and to motion-on) when matchMedia is unavailable (e.g. jsdom).
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(getInitialReducedMotion);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function getInitialReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Reveals `count` items one at a time on a timer. Under reduced motion every
// item is revealed at once (a clear static example). The hook resets whenever it
// mounts, so keying the step container re-triggers the reveal on each visit.
function useStaggeredReveal(count: number, reducedMotion: boolean): number {
  const [revealed, setRevealed] = useState(reducedMotion ? count : 0);
  useEffect(() => {
    if (reducedMotion) {
      setRevealed(count);
      return;
    }
    setRevealed(0);
    let shown = 0;
    const id = setInterval(() => {
      shown += 1;
      setRevealed(shown);
      if (shown >= count) clearInterval(id);
    }, REVEAL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, reducedMotion]);
  return revealed;
}

// An example step: the three example cells with their per-attribute checks
// revealed one by one (the cells pulse on each reveal via the keyed container).
function ExampleStep({
  cells,
  checks,
  reducedMotion,
}: {
  cells: [Cell, Cell, Cell];
  checks: Check[];
  reducedMotion: boolean;
}) {
  const revealed = useStaggeredReveal(checks.length, reducedMotion);
  return (
    <>
      <div className="intro-cells" key={revealed} aria-hidden="true">
        {cells.map((cell, i) => (
          <CellView
            key={i}
            cell={cell}
            position={i + 1}
            selected={false}
            onSelect={() => {}}
          />
        ))}
      </div>
      <ul className="intro-checks">
        {checks.map((check, i) => (
          <li
            key={check.label}
            className={
              "intro-check" +
              (i < revealed ? " intro-check--shown" : "") +
              (check.pass ? " intro-check--pass" : " intro-check--fail")
            }
          >
            <span className="intro-check-mark" aria-hidden="true">
              {check.pass ? "✓" : "✗"}
            </span>
            <span className="intro-check-text">
              {check.label}: {check.verdict}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function StepContent({ step, reducedMotion }: { step: number; reducedMotion: boolean }) {
  switch (step) {
    case 0:
      return (
        <>
          <h1 className="intro-title">What makes a set?</h1>
          <p className="intro-lead">
            Pick three cells where each attribute is{" "}
            <strong>all the same</strong> or <strong>all different</strong> —
            judged on its own.
          </p>
          <ExampleStep cells={VALID_EXAMPLE} checks={VALID_CHECKS} reducedMotion={reducedMotion} />
          <p className="intro-note">All three pass, so these are a set.</p>
        </>
      );
    case 1:
      return (
        <>
          <h1 className="intro-title">A near miss</h1>
          <p className="intro-lead">
            Break just one attribute and it&apos;s not a set — that&apos;s the
            only way to fail.
          </p>
          <ExampleStep
            cells={NEAR_MISS_EXAMPLE}
            checks={NEAR_MISS_CHECKS}
            reducedMotion={reducedMotion}
          />
          <p className="intro-note">One ✗ is enough — not a set.</p>
        </>
      );
    default:
      return (
        <>
          <h1 className="intro-title">How to play</h1>
          <ul className="intro-howto">
            <li>
              Tap <strong>3 cells</strong> that form a set to score.
            </li>
            <li>
              Tap <strong>No more sets</strong> when the board has none left.
            </li>
            <li>
              One <strong>2-minute</strong> clock runs the whole game.
            </li>
            <li>
              Set <strong>+1</strong>, not a set <strong>−1</strong>, cleared
              board <strong>+3</strong>, wrong call <strong>−1</strong>.
            </li>
          </ul>
        </>
      );
  }
}

// `onComplete` fires when the player presses the final-step action button.
// `actionLabel` is that button's text — "Play" on first run, "Resume" when the
// intro is replayed over a paused game (Phase 3).
export function Intro({
  onComplete,
  actionLabel = "Play",
}: {
  onComplete: () => void;
  actionLabel?: string;
}) {
  const [step, setStep] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const isLastStep = step === STEP_COUNT - 1;

  return (
    <main className="app intro">
      {/* Keyed on step so navigating remounts it and re-triggers the reveal. */}
      <div key={step} className="intro-step">
        <StepContent step={step} reducedMotion={reducedMotion} />
      </div>

      <ol className="intro-dots" aria-label="Intro progress">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <li
            key={i}
            className={"intro-dot" + (i === step ? " intro-dot--active" : "")}
            aria-current={i === step ? "step" : undefined}
          />
        ))}
      </ol>

      <div className="intro-nav">
        {step > 0 && (
          <button type="button" className="btn" onClick={() => setStep((s) => s - 1)}>
            Previous
          </button>
        )}
        {isLastStep ? (
          <button type="button" className="btn btn--primary" onClick={onComplete}>
            {actionLabel}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        )}
      </div>
    </main>
  );
}
