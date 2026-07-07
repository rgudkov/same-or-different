import { useEffect, useState } from "react";
import type { Cell } from "../types";
import { isSet } from "../lib/board";
import { CellView } from "./CellView";

// The onboarding intro: a short, animated explanation that teaches the set
// rule by first introducing each attribute in isolation (shape, shape color,
// background), then showing a full valid-set example, a near-miss
// counter-example, and how to play. It reveals the action button (Play on
// first run, Resume when replayed) only on the final step. It replaces the
// former static Home screen.

// The intro is always exactly six steps: one per attribute, then the
// valid-set example, the near-miss example, and how-to-play.
const STEP_COUNT = 6;

// Delay between each staged reveal — per-attribute checks on the set-level
// example steps, or the same-then-different pair on the attribute steps.
const REVEAL_INTERVAL_MS = 650;

const CELL_KEYS = ["background", "shape", "shapeColor"] as const;
type CellKey = (typeof CELL_KEYS)[number];

// The two attribute keys not being taught by a given attribute step — used to
// check that they vary (in the "same" example) or stay constant (in the
// "different" example).
function otherKeys(key: CellKey): CellKey[] {
  return CELL_KEYS.filter((k) => k !== key);
}

function allEqual<T>(values: T[]): boolean {
  return values.every((v) => v === values[0]);
}

function allDistinct<T>(values: T[]): boolean {
  return new Set(values).size === values.length;
}

// A single attribute verdict shown on a set-level example step.
type Check = {
  label: string;
  // The reason the attribute passes or fails, e.g. "all the same".
  verdict: string;
  pass: boolean;
};

// One hand-authored example (deterministic, never generated) used on an
// attribute-teaching step.
type AttributeExample = {
  cells: [Cell, Cell, Cell];
  caption: string;
};

// Config for one attribute-teaching step: the attribute it isolates, an
// example where that attribute is the same across all three cells (the other
// two vary, so it isn't a trivial triple-clone), and an example where it's
// different across all three (the other two held constant, so it's the only
// thing that visibly changes).
type AttributeConfig = {
  key: CellKey;
  label: string;
  lead: string;
  same: AttributeExample;
  different: AttributeExample;
};

const SHAPE_CONFIG: AttributeConfig = {
  key: "shape",
  label: "Shape",
  lead: "A cell's shape can be the same across all three cells, or different across all three.",
  same: {
    cells: [
      { background: "black", shape: "triangle", shapeColor: "red" },
      { background: "white", shape: "triangle", shapeColor: "blue" },
      { background: "grey", shape: "triangle", shapeColor: "yellow" },
    ],
    caption: "Shape: all the same (triangle).",
  },
  different: {
    cells: [
      { background: "black", shape: "triangle", shapeColor: "red" },
      { background: "black", shape: "square", shapeColor: "red" },
      { background: "black", shape: "circle", shapeColor: "red" },
    ],
    caption: "Shape: all different.",
  },
};

const SHAPE_COLOR_CONFIG: AttributeConfig = {
  key: "shapeColor",
  label: "Shape color",
  lead: "A cell's shape color can be the same across all three cells, or different across all three.",
  same: {
    cells: [
      { background: "black", shape: "triangle", shapeColor: "red" },
      { background: "white", shape: "square", shapeColor: "red" },
      { background: "grey", shape: "circle", shapeColor: "red" },
    ],
    caption: "Shape color: all the same (red).",
  },
  different: {
    cells: [
      { background: "black", shape: "square", shapeColor: "red" },
      { background: "black", shape: "square", shapeColor: "blue" },
      { background: "black", shape: "square", shapeColor: "yellow" },
    ],
    caption: "Shape color: all different.",
  },
};

const BACKGROUND_CONFIG: AttributeConfig = {
  key: "background",
  label: "Background",
  lead: "A cell's background can be the same across all three cells, or different across all three.",
  same: {
    cells: [
      { background: "black", shape: "triangle", shapeColor: "yellow" },
      { background: "black", shape: "square", shapeColor: "red" },
      { background: "black", shape: "circle", shapeColor: "blue" },
    ],
    caption: "Background: all the same (black).",
  },
  different: {
    cells: [
      { background: "black", shape: "circle", shapeColor: "blue" },
      { background: "white", shape: "circle", shapeColor: "blue" },
      { background: "grey", shape: "circle", shapeColor: "blue" },
    ],
    caption: "Background: all different.",
  },
};

// The three attribute-teaching steps, in the order they're taught.
const ATTRIBUTE_CONFIGS: AttributeConfig[] = [SHAPE_CONFIG, SHAPE_COLOR_CONFIG, BACKGROUND_CONFIG];

// A valid set. Background is all-same while shape and shape color are
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

// A near-set that fails on exactly one attribute. The shape colors are two
// reds and a blue (neither all same nor all different); the other two
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

// Dev-time invariants: keep the hand-authored examples honest if cells are
// ever edited. A valid-set example that isn't a set (or a near-miss that is),
// or an attribute example that doesn't actually isolate its attribute, would
// silently teach the wrong lesson.
if (import.meta.env.DEV) {
  if (!isSet(...VALID_EXAMPLE)) {
    throw new Error("Intro: VALID_EXAMPLE must be a set");
  }
  if (isSet(...NEAR_MISS_EXAMPLE)) {
    throw new Error("Intro: NEAR_MISS_EXAMPLE must not be a set");
  }

  for (const config of ATTRIBUTE_CONFIGS) {
    const sameTarget = config.same.cells.map((c) => c[config.key]);
    if (!allEqual(sameTarget)) {
      throw new Error(`Intro: ${config.label} same-example must share ${config.key}`);
    }
    const sameOthersVary = otherKeys(config.key).some(
      (k) => !allEqual(config.same.cells.map((c) => c[k]))
    );
    if (!sameOthersVary) {
      throw new Error(`Intro: ${config.label} same-example must vary the other attributes`);
    }

    const differentTarget = config.different.cells.map((c) => c[config.key]);
    if (!allDistinct(differentTarget)) {
      throw new Error(
        `Intro: ${config.label} different-example must use 3 distinct ${config.key} values`
      );
    }
    const differentOthersConstant = otherKeys(config.key).every((k) =>
      allEqual(config.different.cells.map((c) => c[k]))
    );
    if (!differentOthersConstant) {
      throw new Error(
        `Intro: ${config.label} different-example must hold the other attributes constant`
      );
    }
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

// A set-level example step: the three example cells with their per-attribute
// checks revealed one by one (the cells pulse on each reveal via the keyed
// container).
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

// One example group (three cells plus a caption) on an attribute step. Keyed
// on `shown` so it pulses in the moment it's revealed, without re-triggering
// once already shown.
function AttributeExampleGroup({ example, shown }: { example: AttributeExample; shown: boolean }) {
  return (
    <div className={"intro-attr-group" + (shown ? " intro-attr-group--shown" : "")}>
      <div className="intro-cells" key={shown ? "shown" : "hidden"} aria-hidden="true">
        {example.cells.map((cell, i) => (
          <CellView
            key={i}
            cell={cell}
            position={i + 1}
            selected={false}
            onSelect={() => {}}
          />
        ))}
      </div>
      <p className="intro-attr-caption">{example.caption}</p>
    </div>
  );
}

// An attribute-teaching step: names the attribute, then reveals a
// "same"-example followed by a "different"-example, staggered so the lesson
// builds one comparison at a time.
function AttributeStep({
  config,
  reducedMotion,
}: {
  config: AttributeConfig;
  reducedMotion: boolean;
}) {
  const revealed = useStaggeredReveal(2, reducedMotion);
  return (
    <>
      <h1 className="intro-title">{config.label}</h1>
      <p className="intro-lead">{config.lead}</p>
      <div className="intro-attr-examples">
        <AttributeExampleGroup example={config.same} shown={revealed >= 1} />
        <AttributeExampleGroup example={config.different} shown={revealed >= 2} />
      </div>
    </>
  );
}

function StepContent({ step, reducedMotion }: { step: number; reducedMotion: boolean }) {
  if (step < ATTRIBUTE_CONFIGS.length) {
    return <AttributeStep config={ATTRIBUTE_CONFIGS[step]} reducedMotion={reducedMotion} />;
  }

  switch (step - ATTRIBUTE_CONFIGS.length) {
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
              Set <strong>+1</strong>, not a set <strong>−1</strong>, cleared
              board <strong>+3</strong>, wrong call <strong>−1</strong>.
            </li>
            <li>
              <strong>Daily mode</strong> is one untimed board a day, the
              same for everyone. Prefer a clock? <strong>Timed mode</strong>{" "}
              is a separate 2-minute rush through as many boards as you can
              clear.
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
