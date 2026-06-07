# PRD: "Set 3×3" — A Shape-and-Color Set-Finding Game

## Problem Statement

I want a quick, fun, brain-teasing puzzle game I can play in spare moments on
both my phone and my desktop browser, without installing anything from an app
store and without needing an account or internet connection. Existing "Set"-style
games are often desktop-oriented, cluttered, or locked behind apps. I want
something I can host for free, share with a link, and even install to my home
screen so it feels like a real app and works offline.

## Solution

A lightweight, installable Progressive Web App (PWA) built as a static site and
hosted on GitHub Pages. The player is shown a 3×3 grid of cells. Each cell has
three independent attributes — a **background color**, a **shape**, and a **shape
color** — each drawn from three possible values. The player races a 2-minute
timer to find as many valid "sets" as possible across a continuous stream of
boards, banking points for correct finds and for correctly declaring a board
complete. The game is touch-first and responsive, works offline, persists the
high score locally, and can be added to a phone's home screen.

### Core definitions

- **Attributes & values** (3 each → 27 unique cells total):
  - Background color: **black, white, grey**
  - Shape: **triangle, square, circle**
  - Shape color: **red, blue, yellow** (color-blind-safe palette by default)
- **A set** = three cells where, for **each** of the three attributes
  independently, the values are **either all the same or all different**.
  - Example (a set): all backgrounds black, shapes are triangle/circle/square
    (all different), all shape colors yellow.
  - Example (not a set): backgrounds all black, shapes all different, but shape
    colors are yellow/yellow/red (not all same and not all different).
- A board shows **9 distinct cells**. A board may legitimately contain **zero
  sets** (a maximal "cap"), which is a deliberate, recurring scenario.

## User Stories

1. As a player, I want to open a single URL in any mobile or desktop browser, so that I can start playing without installing anything.
2. As a player, I want to install the game to my phone's home screen, so that it launches like a native app.
3. As a player, I want the game to work offline after first load, so that I can play on a plane or with no signal.
4. As a player, I want a Home screen with the game title and a Play button, so that I know where to start.
5. As a player, I want concise "how to play" rules and the scoring shown on the Home screen, so that I understand the goal before playing.
6. As a player, I want to see my best score on the Home screen, so that I have a target to beat.
7. As a player, I want a 3×3 grid of cells each showing a background color, a shape, and a shape color, so that I have the visual information needed to find sets.
8. As a player, I want shapes to remain clearly visible against any background, so that I can always read a cell (subtle outline on every shape).
9. As a color-blind player, I want a palette that avoids the red/green ambiguity by default, so that I can distinguish all shape colors.
10. As a player, I want to tap a cell to select it and tap again to deselect, so that I can build my candidate set.
11. As a player, I want selected cells to be visibly highlighted, so that I can see my current selection at a glance.
12. As a player, I want the third tapped cell to immediately evaluate my three-cell selection, so that play is fast and I don't need a separate submit button.
13. As a player, I want my selection to clear automatically after each evaluation, so that I can immediately start the next attempt.
14. As a player, I want a clear "+1 — Set!" confirmation with a green cell flash, a toast, and a sound when I find a valid set, so that I get immediate positive feedback.
15. As a player, I want a "−1 — Not a set" red flash, toast, and sound when my three cells are not a set, so that I learn from the mistake.
16. As a player, I want a neutral "Already found — 0" indication when I re-select a set I already found, so that I know it doesn't count again.
17. As a player, I want a running list of the sets I've found on the current board, shown as sorted cell numbers (e.g. `1,5,9`), so that I can track my progress.
18. As a player, I want the found-sets list to reset when a new board appears, so that it always reflects the current board.
19. As a player, I want an always-available Complete button, so that I can declare when I believe all sets are found.
20. As a player, I want a correct Complete (no unfound sets remain) to award +3 and load a fresh board, so that I'm rewarded for thoroughness and keep playing.
21. As a player, I want a correct Complete on a zero-set board to award +3, so that recognizing "there are no sets" is a valid, rewarded skill.
22. As a player, I want a wrong Complete (sets still remain) to cost −1 and keep the game going, so that careless declarations are discouraged but not game-ending.
23. As a player, I want a single 2-minute timer for the whole game that keeps running across boards, so that the game is a continuous score-attack.
24. As a player, I want the timer to be clearly visible and counting down, so that I can pace myself.
25. As a player, I want the game to end only when the timer reaches zero, so that I can keep banking points across as many boards as I can solve.
26. As a player, I want a Game Over screen showing my final cumulative score, so that I know how I did.
27. As a player, I want a celebration when I beat my previous best, so that achievements feel rewarding.
28. As a player, I want "Play again" and "Home" buttons on Game Over, so that I can quickly replay or return.
29. As a player, I want my high score saved between sessions, so that my best is remembered when I come back.
30. As a player, I want a mute toggle for sounds, with my preference remembered, so that I can play silently when needed.
31. As a mobile player, I want a portrait-first layout with a large, thumb-reachable Complete button, so that the game is comfortable to play one-handed.
32. As a desktop player, I want the grid centered with the found-sets list and stats in a side panel, so that the wide screen is used well.
33. As a player, I want the grid to always render as a clean square with large tap targets, so that cells are easy to read and hit on any device.
34. As a player, I want roughly a third of boards to contain no sets, so that "declare complete" is a genuine, recurring strategic decision rather than a rarity.
35. As a player, I want every cell on a board to be unique, so that "all different" is never ambiguous.
36. As a player, I want scoring to be exact and trustworthy, so that the game feels fair (the set list is computed authoritatively).
37. As a player, I want a smooth transition into the next board after a correct Complete, so that momentum is maintained.
38. As a developer, I want the core set logic covered by automated tests, so that scoring never silently regresses.

## Implementation Decisions

### Technology
- **React + Vite + TypeScript** single-page app.
- **SVG** for rendering shapes (crisp, scalable, easy to color/outline).
- **Full PWA from the start**: web app manifest, icons, and a service worker for
  offline-first caching of the static assets.
- **Web Audio API** generates feedback sounds (oscillator tones) — no audio files
  shipped, keeping the bundle small and fully offline.
- **localStorage** persists high score and mute preference. No backend, no
  accounts, no network calls at runtime.
- **Vitest** for unit tests of core logic; **React Testing Library** for
  component tests (selection, scoring, timer behavior).
- **GitHub Actions** workflow builds on push to `main` and publishes the built
  static output to **GitHub Pages**. Vite `base` is set to the repository path so
  asset URLs resolve correctly under the Pages subpath.

### Domain model
- A **cell** is defined by three enumerated attributes: background
  (black/white/grey), shape (triangle/square/circle), and shape color
  (red/blue/yellow) — 27 unique combinations.
- Color palette is defined as a **single swappable constant** so an alternate
  palette (or a future color-blind toggle) is a trivial change. Default shape
  palette is the color-blind-safe red/blue/yellow.
- **`isSet(a, b, c)`**: returns true when, for each attribute independently, the
  three values are all equal or all distinct.
- **`findAllSets(board)`**: enumerates all 3-cell combinations of the 9 cells and
  returns those satisfying `isSet`. This is the authoritative set list used for
  scoring and for the Complete check.
- **Board generation**: pick 9 distinct cells at random, compute the full set
  list, and apply a deliberate bias so that approximately **30%** of boards have
  **zero** sets (constructed/validated as 9-cell caps). The actual set list is
  always recomputed so scoring is exact regardless of how the board was produced.

### Game state & rules
- A board carries: its 9 cells, the authoritative list of all sets, and the list
  of sets the player has **found**.
- Selecting the **3rd** cell triggers evaluation immediately; selection then
  clears.
- **Scoring**:
  - Correct (previously unfound) set: **+1**, added to found list.
  - Re-submitting an already-found set: **0** (ignored, neutral feedback).
  - Three cells that are not a set: **−1**.
  - Complete when **no unfound sets remain** (including zero-set boards): **+3**,
    load next board.
  - Complete when **unfound sets remain**: **−1**, game continues.
- **Found sets are tracked but cells are NOT visually marked or removed** — a cell
  can belong to multiple sets, so the board stays static. Found sets are listed
  separately as sorted cell numbers (cells indexed 1–9 in reading order,
  left-to-right, top-to-bottom).
- A **single 2-minute timer** spans the whole game and continues across board
  transitions. The game ends only at timer zero.

### Screens & flow
- **Home**: title, Play button, how-to/scoring summary, current high score.
- **Game**: top bar with timer + live score; square 3×3 grid; found-sets list;
  always-available Complete button; mute toggle.
- **Game Over**: final cumulative score, new-high-score celebration when beaten,
  Play again and Home actions.

### Feedback
- Every action produces a **color-coded cell flash + text toast + sound**:
  correct (green), already-found (neutral/amber), wrong (red), correct Complete
  (board-level green sweep), wrong Complete (red). Animations are short
  (~300–500ms) and **non-blocking** to preserve the fast pace. Sounds respect the
  mute toggle.

### Layout
- **Portrait-first, adaptive.** Phone: single column (top bar → square grid →
  found list → large Complete button). Desktop/wide: centered square grid with a
  side panel for the found-sets list and stats. Grid stays square via CSS
  (`aspect-ratio`), with large tap targets.

## Out of Scope

- **Hint system** (revealing or flagging a valid set).
- **Difficulty levels** or **configurable timer length**; the timer is fixed at
  2:00 and the zero-set board rate is fixed (~30%).
- **Alternate game modes**, including a relaxed single-board "zen" mode (no timer,
  ends on first correct Complete).
- **Online/shared leaderboards** and anything requiring a backend, server, or user
  accounts.
- **Elaborate animations/transitions** beyond the short feedback flashes/toasts.
- **End-to-end (E2E) browser automation tests** for v1 (covered by manual checks).
- An explicit in-app **color-blind palette toggle** — the safe palette is the
  default, so a toggle is deferred (palette remains a swappable constant).

## Further Notes

- **Why a 3×3 grid is mathematically clean**: this is the classic game *Set* with
  3 attributes instead of 4 (27 cards in AG(3,3)). The maximum number of cards
  with **no** set ("cap") in this space is exactly **9** — matching the 9-cell
  grid. So zero-set boards are well-defined and constructible, validating the
  "declare Complete on an empty board" mechanic.
- **Brute-force resistance**: because wrong sets cost −1, blindly trying all
  C(9,3)=84 combinations is self-penalizing, so no extra anti-cheat is needed.
- **Contrast care**: low-contrast pairings (e.g., yellow shape on white
  background) are mitigated by a subtle outline stroke on every shape.
- **First-build priority**: implement and unit-test the core logic (`isSet`,
  `findAllSets`, board generator/classifier) before UI, since scoring correctness
  is the highest-risk area.
- **Deployment note**: the Vite `base` path must match the GitHub repository name
  for assets to load correctly on GitHub Pages.
