# Plan: Onboarding Intro & Centered Score — "Same or Different"

> Source PRD: `prd/onboarding-and-centered-score.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Screen flow**: the app state machine is `intro → playing → over`. The animated
  intro replaces the former static Home screen; there is no separate title/Play
  landing page. Game Over keeps "Play Again" and drops its "Home" button.
- **Launch routing**: if the intro-seen flag is set, launch into `playing` (a
  fresh game); otherwise launch into `intro`.
- **Intro shape**: exactly 3 steps — (1) valid-set rule, (2) one-attribute
  counter-example, (3) how-to + scoring. Navigated with Previous/Next plus a
  3-dot progress indicator. The final-step action button is **Play** on first
  run and **Resume** when replaying. No "Skip" on first run.
- **Intro-seen flag**: flips to true only when the player presses **Play** from
  the final step of a first run. Never set on render; never changed by a replay.
- **Replay**: reachable only via an in-game help (`?`) button. Opens the intro as
  an overlay over the current game with the timer paused; closing/Resume restores
  the same game and resumes the timer.
- **Persistence**: localStorage, wrapped for graceful degradation (private mode /
  quota errors), following the existing storage-module convention. All keys use
  the **`sod.`** prefix: high score, mute, intro-seen. **No migration** from the
  old prefix — existing local values reset to defaults.
- **Top bar layout (play screen)**: three zones — timer left, large bold score
  centered, mute/help controls right — with the best score small and quiet under
  the centered score.
- **Animation approach**: sequenced per-attribute check reveals with cell pulses,
  rendered on the existing cell component and existing CSS keyframes. Plays once
  per visit to a step; degrades to static under `prefers-reduced-motion`.
- **Example cells**: hand-authored constants (deterministic), not generated.
- **Out of scope**: core game logic (set predicate, board generation, scoring
  values, timer duration, "No more sets" mechanic) is unchanged.

---

## Phase 1: Centered score & `sod.` storage layer

**User stories**: 12, 13, 14, 17

### What to build

Two independent, low-risk changes bundled together.

First, restructure the play-screen top bar into three zones: timer on the left,
the live score large and bold in the center as the focal point, and the mute
control on the right. Move the best score to small, quiet text directly under the
centered score. No flow or game-logic changes.

Second, move the persistence layer onto the `sod.` key prefix: rename the
high-score and mute keys, and add a new wrapped intro-seen module (load/save a
boolean, defaulting to "not seen", silently no-op on storage failure) mirroring
the existing storage modules. No migration from the old prefix.

### Acceptance criteria

- [ ] During play, the live score renders large and centered, with the timer left and mute right.
- [ ] The best score appears small and quiet beneath the centered score, not competing with it.
- [ ] Layout remains usable and uncrowded on a phone-width viewport.
- [ ] High score and mute preference persist under `sod.`-prefixed keys.
- [ ] A new intro-seen storage module reads/writes a boolean, defaults to "not seen", and degrades gracefully when storage is unavailable.
- [ ] Storage modules have tests covering load defaults, round-trip save/load, and the unavailable-storage path.

---

## Phase 2: Animated intro replacing Home

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 15, 16, 18

### What to build

Replace the static Home screen with the full 3-step animated intro and wire the
`intro → playing → over` flow end-to-end.

The intro presents three steps with Previous/Next navigation and a 3-dot progress
indicator. Step 1 shows a hand-authored valid set with the three attribute checks
(background color, shape, shape color) revealing one at a time, each marked as
all-same-or-all-different. Step 2 shows a hand-authored near-set that fails on
exactly one attribute, flagging the failing attribute. Step 3 is a concise
how-to: tap 3 cells, use "No more sets" when none remain, the 2-minute clock, and
one-line scoring. The final step's Next control becomes the **Play** button.

Animations are sequenced reveals with cell pulses on the existing cell component,
playing once per visit to a step and re-triggering on navigation; they degrade to
clear static examples under `prefers-reduced-motion`.

Pressing Play from the final step sets the intro-seen flag and enters a fresh
game. On launch, a player who has already seen the intro skips straight into a
game; a first-timer sees the intro. Game Over keeps "Play Again" (straight into a
new game) and no longer offers a Home button.

### Acceptance criteria

- [ ] First launch shows the intro; the static Home screen no longer exists.
- [ ] The intro has exactly 3 steps with working Previous/Next and a 3-dot progress indicator; Previous is absent on step 1.
- [ ] The Play button appears only on the final step (the Next control becomes Play).
- [ ] Step 1 reveals the three attribute checks one-by-one on a hand-authored valid set; both "all same" and "all different" appear in the example.
- [ ] Step 2 shows a hand-authored near-set failing exactly one attribute, with that attribute flagged.
- [ ] Step 3 conveys tap-3-cells, the "No more sets" button, the 2-minute timer, and scoring concisely.
- [ ] Step animations play once per visit and re-trigger on navigation; under reduced motion they render as clear static examples.
- [ ] Pressing Play from the final step sets the intro-seen flag and starts a fresh game.
- [ ] A returning player (flag set) launches straight into a game, skipping the intro.
- [ ] Game Over offers Play Again (into a new game) and has no Home button.
- [ ] Tests cover: intro→Play sets the flag and routes into the game, and a returning player skips the intro.

---

## Phase 3: Replay intro from the game (paused overlay)

**User stories**: 9, 10, 11

### What to build

Add a compact help (`?`) icon button to the top bar, next to the mute control.
Tapping it opens the intro as an overlay over the current game with the countdown
paused. While the overlay is open the board, score, and timer state are
preserved. On the final step the action button reads **Resume** (not Play);
pressing Resume — or otherwise closing the overlay — returns to the same game with
the timer continuing where it left off. Replaying does not change the intro-seen
flag.

### Acceptance criteria

- [ ] A `?` help button sits beside the mute control in the top bar.
- [ ] Tapping it overlays the intro on the current game and pauses the countdown.
- [ ] Board, score, and timer state are preserved while the overlay is open.
- [ ] On the final step the action button reads "Resume", not "Play".
- [ ] Resuming (or closing) returns to the same game with the timer continuing from where it paused.
- [ ] Replaying the intro does not alter the intro-seen flag.
- [ ] Tests cover: opening the overlay pauses the timer, and Resume restores the same game with the timer continuing.
