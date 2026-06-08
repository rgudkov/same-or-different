# Plan: Game Over Set Review & Vertical Layout

> Source PRD: `prd/game-over-review.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Screen flow unchanged**: the app state machine stays `intro → playing → over`.
  This work touches only what Game Over renders and how screens fill the viewport;
  no new screens or routes.
- **Game-over data contract**: the game-over callback is widened from carrying
  only the final score to also carrying the **final board** and the **found sets**
  (list of 0-based index triples). The session orchestrator stores all three and
  passes them to the Game Over screen.
- **Review scope**: strictly the **final on-screen board** and the sets found on it
  since the last successful Complete (found resets per board). Not a cumulative
  whole-game tally; never labeled as overall performance.
- **Missed derivation**: missed = the board's authoritative set list minus the
  found list. The board object already carries its full set list, so board + found
  is sufficient; no missed list is plumbed through.
- **Set ordering**: Missed sets section first, then Found sets. No separate neutral
  "final board" — every set already appears as a thumbnail.
- **Static board rendering**: review thumbnails are non-interactive and reuse the
  existing cell rendering through a read-only path (a static/highlight/dim mode on
  the board/cell components, not the live tap-handling board).
- **Color palette**: reuse existing flash tokens — green `#2ec27e` for found, red
  `#e63946` for missed.
- **Cell numbers**: a faint corner position number (1–9, ~0.4 opacity) renders on
  **every** cell everywhere — live board and thumbnails — driven by the position
  prop the cell component already receives. Always on; no toggle.
- **Layout scope**: all vertical-fill changes are gated behind a mobile media
  query (~`max-width: 600px`); desktop is unchanged. Use `100svh` (small viewport
  height), not `100vh`, to avoid mobile browser-chrome clipping.
- **Out of scope**: tap-to-highlight on thumbnails, cumulative session history, a
  separate neutral final board, full-size stacked set boards, any desktop layout
  change, a numbers toggle, and any change to scoring/timing/core rules.

---

## Phase 1: Faint cell position numbers

**User stories**: 15, 17

### What to build

Render a small, low-opacity position number (1–9) tucked into a corner of every
cell, using the 1-based position the cell component already receives. It appears
immediately on the live game board and is styled subtly enough never to compete
with the shape. This is foundational: the same cell rendering is reused for the
Game Over review thumbnails in Phase 2.

### Acceptance criteria

- [ ] Every cell on the live game board shows its position number 1–9 in reading order.
- [ ] The number is small, low-opacity (~0.4), and in a consistent corner.
- [ ] The number does not obscure or visually fight the shape, and does not shift cell layout.
- [ ] Numbers degrade gracefully (still legible) across the three cell backgrounds.

---

## Phase 2: Game Over set review

**User stories**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 23

### What to build

Carry the final board and found sets from the game up through the orchestrator
into the Game Over screen. Derive the missed sets there (all board sets minus
found). Render every set of the final board as its own static, non-interactive
thumbnail board (~150px) in a responsive grid — a few columns on mobile, more on
desktop — with the **Missed sets** section first and **Found sets** second.

On each thumbnail, highlight the three set-cells (red for missed, green for
found), dim the other six cells, reuse the faint position numbers from Phase 1,
and caption the thumbnail with its coordinates (e.g. "1,3,5"). Omit a section
entirely when it has no sets. Keep the existing Game Over summary (title, "New
best!" celebration, final score, best score, and the single "Play again" route).
Update tests covering the widened callback signature and the Game Over render.

### Acceptance criteria

- [ ] Game Over shows the final board's sets as static, non-interactive thumbnails — none are tappable.
- [ ] Missed sets render first (red highlight), then found sets (green highlight).
- [ ] Each thumbnail highlights exactly its three set-cells and dims the other six.
- [ ] Each thumbnail shows its coordinate caption, matching the faint cell numbers.
- [ ] Thumbnails lay out in a responsive grid: several per row on mobile, more on desktop.
- [ ] The "Missed sets" section is omitted when nothing was missed; "Found sets" is omitted when nothing was found.
- [ ] The review reflects only the final on-screen board, not a cumulative tally.
- [ ] The existing summary (title, "New best!", final score, best score, "Play again") still renders.
- [ ] Tests for the new game-over callback contract and Game Over render pass.

---

## Phase 3: Mobile full-height layout

**User stories**: 18, 19, 20, 21, 22

### What to build

CSS-only, gated behind a mobile media query. On the intro and Game Over screens,
fill the full viewport height (`min-height: 100svh`) and distribute content with
`space-between` so the primary action lands in the bottom thumb-zone. On the game
screen, apply a gentler full-height fill that pushes only the residual slack to
the bottom while keeping the board glued to its Complete button — not full
`space-between`. Desktop layout is left exactly as it is today.

### Acceptance criteria

- [ ] On mobile, the intro screens fill the viewport height with content distributed and the primary action near the bottom.
- [ ] On mobile, the Game Over screen fills the height with the summary up top and "Play again" pinned to the bottom.
- [ ] On mobile, the game screen reaches the bottom with no dead band, and the board stays visually attached to its Complete button.
- [ ] All full-height behavior is gated to mobile widths; desktop layout is unchanged.
- [ ] `100svh` is used so mobile browser chrome does not clip or cause jump.
