# Plan: "Set 3×3" Game

> Source PRD: `prd/set-3x3-game.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Stack**: React + Vite + TypeScript, single-page app, fully static (no backend).
- **Rendering**: Shapes drawn as inline **SVG** with a subtle outline stroke on every shape for contrast on any background.
- **Hosting**: GitHub Pages, deployed via GitHub Actions on push to `main`. Vite `base` must equal the repository path so assets resolve under the Pages subpath.
- **PWA**: Web app manifest + service worker (offline-first caching) + icons; installable to home screen.
- **Persistence**: `localStorage` only — high score and mute preference. No accounts, no network at runtime.
- **Audio**: Feedback sounds synthesized via the **Web Audio API** (oscillator tones); no audio files shipped.
- **Testing**: Vitest for core logic; React Testing Library for component behavior. No E2E for v1.
- **Domain model**:
  - A **cell** = `{ background: black|white|grey, shape: triangle|square|circle, shapeColor: red|blue|yellow }` → 27 unique combinations.
  - Color/shape value sets defined as **swappable constants** (default shape palette is the color-blind-safe red/blue/yellow).
  - A **set** = 3 cells where each attribute independently is all-same or all-different.
  - A **board** = 9 distinct cells + the authoritative list of all its sets.
  - Cells are indexed **1–9** in reading order (left-to-right, top-to-bottom) for the found-sets display.
- **Core logic interfaces** (names indicative): `isSet(a, b, c)`, `findAllSets(board)`, board generator that yields 9 distinct cells **guaranteed to contain at least 2 sets** (no zero-set boards) and always recomputes the actual set list.
- **Scoring** (authoritative): correct set **+1**, already-found set **0**, wrong set **−1**, correct Complete **+3** (→ next board), wrong Complete **−1** (continue).
- **Session**: one continuous **2:00** timer spanning all boards; game ends only at timer zero.

---

## Phase 1: Walking skeleton + live deploy

**User stories**: 1, 7, 8, 33 (partial)

### What to build

Scaffold the Vite + React + TS project. Render a static 3×3 grid of hardcoded
cells as SVG shapes, exercising all three backgrounds (black/white/grey), all
three shapes (triangle/square/circle), and all three shape colors
(red/blue/yellow), each shape with an outline stroke. Set up the GitHub Actions
workflow that builds and publishes to GitHub Pages, with the correct Vite `base`.
This proves the entire pipeline from source to a live, shareable URL.

### Acceptance criteria

- [ ] `npm run dev` serves the app locally; `npm run build` produces static output.
- [ ] A 3×3 grid renders 9 hardcoded cells; backgrounds, shapes, and shape colors all display correctly with visible outlines.
- [ ] Grid renders as a clean square with reasonable tap targets.
- [ ] Pushing to `main` triggers the Actions workflow and the app is reachable at the GitHub Pages URL with assets loading correctly.

---

## Phase 2: Core set logic + random boards

**User stories**: 35, 36, 9 (palette constant)

### What to build

Implement the pure domain logic: the cell model and value constants, `isSet`,
`findAllSets`, and a board generator that produces 9 distinct random cells. Cover
it with Vitest unit tests. Replace the hardcoded grid with a freshly generated
random board so each load shows a new valid board.

### Acceptance criteria

- [ ] `isSet` is correct across all-same, all-different, and mixed cases per attribute (unit-tested).
- [ ] `findAllSets` returns exactly the sets for hand-verified small boards (unit-tested).
- [ ] The generator always yields 9 **distinct** cells (unit-tested).
- [ ] Shape palette is a single swappable constant defaulting to red/blue/yellow.
- [ ] Loading the app shows a randomly generated 9-cell board.

---

## Phase 3: Selection & set scoring

**User stories**: 10–18, 38

### What to build

Make cells selectable: tap toggles selection with a visible highlight; selecting
the **3rd** cell immediately evaluates the three-cell candidate, then clears the
selection. Apply scoring (+1 new set / 0 already-found / −1 not a set) against the
authoritative set list, tracking found sets without marking or removing cells.
Display a live score and a found-sets list as sorted cell numbers (e.g. `1,5,9`).
Add component tests for selection and scoring.

### Acceptance criteria

- [ ] Tapping a cell toggles its selection with a visible highlight; the 3rd tap auto-evaluates and clears selection.
- [ ] Correct new set adds +1 and appends to the found-sets list; re-submitting a found set adds 0; a non-set subtracts 1.
- [ ] Found-sets list shows sorted cell numbers; cells are never marked or removed.
- [ ] Live score reflects all outcomes accurately.
- [ ] Component tests cover selection toggling and each scoring outcome.

---

## Phase 4: Complete & board progression

**User stories**: 19–22, 34, 37

### What to build

Add an always-available Complete button. On a correct Complete (all sets on the
board have been found), award +3, reset the found-sets list, and load the next
board with a smooth transition. On a wrong Complete (unfound sets remain),
subtract 1 and continue. Update the generator to **guarantee every board contains
at least 2 sets** (no zero-set boards) while always recomputing the real set list.

### Acceptance criteria

- [ ] Complete is always tappable during play.
- [ ] Correct Complete (all sets found) awards +3 and loads a fresh board; found-sets list resets.
- [ ] Wrong Complete subtracts 1 and the same board continues.
- [ ] Every generated board contains **at least 2 sets** (verifiable via logic tests); no zero-set boards ever appear.

---

## Phase 5: Game session — timer, screens, high score

**User stories**: 4–6, 23–29

### What to build

Introduce the full session: a single continuous 2:00 countdown timer spanning all
boards, ending the game only at zero. Add the Home screen (title, Play, how-to +
scoring, high score) and Game Over screen (final cumulative score, new-high
celebration, Play again / Home). Persist the high score in localStorage.

### Acceptance criteria

- [ ] A visible 2:00 timer counts down continuously across board transitions and ends the game at zero.
- [ ] Home screen shows title, Play button, rules/scoring summary, and current high score.
- [ ] Game Over screen shows final cumulative score with a celebration when the high score is beaten.
- [ ] Play again and Home buttons work.
- [ ] High score persists across sessions via localStorage.

---

## Phase 6: Feedback polish & responsive layout

**User stories**: 14–16, 30, 31, 32, 33

### What to build

Add color-coded, non-blocking feedback for every action: cell flash + text toast
+ Web Audio sound (correct/already-found/wrong/correct-Complete/wrong-Complete),
with a persisted mute toggle. Finalize the portrait-first adaptive layout: phone
single-column (top bar → square grid → found list → large Complete button) and
desktop centered grid with side panel, grid always square with large tap targets.

### Acceptance criteria

- [ ] Each action produces the correct color-coded flash + toast + sound, all short and non-blocking.
- [ ] Mute toggle silences sounds and its state persists across sessions.
- [ ] Layout is comfortable in portrait on a phone (thumb-reachable Complete) and well-arranged on desktop (grid + side panel).
- [ ] Grid remains square with large tap targets across breakpoints.

---

## Phase 7: Full PWA

**User stories**: 2, 3

### What to build

Add the web app manifest, icon set, and a service worker providing offline-first
caching of all static assets, making the game installable to a home screen and
playable with no network after first load.

### Acceptance criteria

- [ ] A valid manifest and icons are present; browsers offer "Add to Home Screen".
- [ ] The installed app launches standalone like a native app.
- [ ] After first load, the game works fully offline (airplane mode).
- [ ] Service worker caching does not break deploys (new versions are picked up).
