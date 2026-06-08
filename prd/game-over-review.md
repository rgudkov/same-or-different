# Game Over Set Review & Vertical Layout

## Problem Statement

When the timer runs out, the player is shown only their final score. They never
get to see the board they ended on or learn which sets they missed — the boards
they were puzzling over simply disappear. There's no teaching moment and no
sense of "here's what was actually there," which is the most instructive part of
a round.

Separately, on mobile the app content hugs the top of the screen with a band of
empty space beneath it. The intro pages, the game-over screen, and even the main
game leave dead space at the bottom, so the layout feels unfinished and the
primary action isn't in the comfortable bottom thumb-zone.

## Solution

On the Game Over screen, show the player every set that existed on the **last
board they were playing** — rendered as a grid of small boards, one per set, with
the three set-cells highlighted and the set's coordinates captioned. Missed sets
are shown first (the teaching moment), then the sets they found. This turns the
end of a round into a quick, visual review of what was on the board.

To make those coordinates legible, every cell — on the live game board and on the
review thumbnails — carries a faint position number (1–9).

For layout, the intro and game-over screens are distributed to fill the full
mobile viewport height (`space-between`), putting the primary action in the
bottom thumb-zone. The game screen is gently filled so its content reaches the
bottom without tearing the board away from its Complete button. These changes are
scoped to mobile viewports; desktop is unchanged.

## User Stories

1. As a player who just ran out of time, I want to see the board I was playing
   when the clock hit zero, so that the round ends with closure instead of a bare
   score.
2. As a player, I want to see every set that existed on my final board, so that I
   understand what I was looking at.
3. As a player, I want the sets I **missed** shown first and clearly marked, so
   that I learn what I failed to spot.
4. As a player, I want the sets I **found** shown too (after the missed ones), so
   that I can confirm what I got right, even though I already know them.
5. As a player, I want each set rendered as a full little board with its three
   cells highlighted, so that I can see the actual set, not just abstract numbers.
6. As a player, I want each set's cell coordinates captioned (e.g. "1,3,5"), so
   that I can map the highlight to grid positions.
7. As a player, I want the missed sets highlighted in red and the found sets in
   green, so that I can tell the two groups apart at a glance.
8. As a player, I want the non-set cells on each review thumbnail dimmed, so that
   the highlighted triple stands out immediately.
9. As a player on a phone, I want the review thumbnails small enough that several
   fit per screen, so that I'm not scrolling through six screens of near-identical
   boards.
10. As a player, I want the review thumbnails arranged in a responsive grid (a few
    across on mobile, more on desktop), so that the screen stays scannable.
11. As a player who missed nothing, I want the "Missed sets" section omitted
    entirely, so that I'm not shown an empty section.
12. As a player who found no sets on the final board, I want the "Found sets"
    section omitted, so that the screen isn't cluttered with an empty group.
13. As a player, I want the Game Over screen to still show my final score, best
    score, and the "New best!" celebration, so that I keep the existing summary.
14. As a player, I want the "Play again" button to remain the single route onward,
    pinned to the bottom of the screen, so that it's easy to reach with my thumb.
15. As a player, I want faint numbers 1–9 on every cell of the live game board, so
    that I can reference and discuss cell positions during play.
16. As a player, I want those same faint numbers on the review thumbnails, so that
    the "1,3,5" captions are self-explanatory.
17. As a player, I want the numbers subtle (small, low-opacity, in a corner), so
    that they never compete with the shapes.
18. As a mobile player, I want the intro pages to fill the full height of my
    screen, so that the layout feels intentional and the Continue/Start action
    sits in the bottom thumb-zone.
19. As a mobile player, I want the Game Over screen to fill the full height, so
    that the summary sits up top and "Play again" lands at the bottom.
20. As a mobile player, I want the main game screen to fill down to the bottom of
    my screen without a band of dead space, so that it feels complete.
21. As a player, I want the board and its "No more sets" button to stay visually
    together, so that the game screen's full-height fill never separates them.
22. As a desktop player, I want the layout to stay as it is today, so that the
    full-height mobile spread doesn't leave my content sparsely scattered on a
    tall window.
23. As a player, I want the review thumbnails to be non-interactive, so that I
    understand the Game Over screen is a summary, not another puzzle.

## Implementation Decisions

### Game Over set review

- The game-over callback is widened from passing only the final score to also
  passing the **final board** and the **found sets** (list of index triples). The
  top-level session orchestrator stores these alongside the final score and hands
  them to the Game Over screen.
- "Missed/unfound" sets are derived in (or near) the Game Over screen as the
  board's authoritative set list minus the found list. The board object already
  carries its full set list, so the board plus the found list is sufficient.
- Scope is strictly the **final on-screen board** and the sets found on it since
  the last successful Complete (found resets on each new board). This is not a
  cumulative whole-game tally and must not be labeled as overall performance.
- Each set is rendered as its own **thumbnail board (~150px)** in a **responsive
  grid** (a few columns on mobile, more on desktop), captioned with its
  coordinates (1-based cell numbers, e.g. "1,3,5").
- Ordering: **Missed sets section first, then Found sets section.** No separate
  neutral "final board" is shown — every set already appears, so a plain board
  would be redundant.
- The set-cell highlight is **color-coded**: red for missed, green for found,
  reusing the existing flash palette tokens. The six non-set cells on each
  thumbnail are **dimmed**.
- Thumbnails are **static / non-interactive**. This implies a read-only board
  rendering path — either a read-only renderer or `static`/`dimmed`/`highlight`
  props on the existing board/cell components — rather than reusing the live
  tap-handling board.
- Empty sections are **omitted** entirely (no "Missed sets" when nothing missed;
  no "Found sets" when nothing found).
- The existing Game Over content (title, "New best!" celebration, final score,
  best score, "Play again") is retained. Vertical order: summary block → Missed
  grid → Found grid → "Play again" pinned to the bottom.
- Tests that exercise the game-over callback signature and the Game Over render
  are updated to the new contract.

### Cell position numbers

- A faint position number (1–9) is rendered on **every** cell, both on the live
  game board and on the review thumbnails, driven by the position the cell
  component already receives.
- Visual treatment: small, low-opacity (~0.4), tucked into a corner (e.g.
  top-left) so it never fights the shape. Always on (not toggleable).

### Vertical layout

- All layout changes are **gated behind a mobile media query** (around
  `max-width: 600px`); desktop layout is unchanged.
- Intro and Game Over screens: `min-height: 100svh` with `justify-content:
  space-between` so content is distributed across the full height and the primary
  action lands in the bottom thumb-zone.
- Game screen: **gentle fill only** — `min-height: 100svh` with the top bar at the
  top and the board/Complete-button/found-list grouped naturally; only the
  residual slack is pushed so content reaches the bottom. The board and its
  Complete button must stay glued together. Not full `space-between`.
- Use `100svh` (small viewport height) rather than `100vh` so mobile browser
  chrome doesn't cause clipping or jump.

## Out of Scope

- Tap-to-highlight or any interactivity on the review thumbnails (they are static).
- A cumulative, whole-game history of every set found across all boards in the
  session.
- Showing a separate neutral "the board you ended on" board in addition to the
  per-set thumbnails.
- Rendering found/missed sets at full play size in a single stacked column.
- Any desktop layout changes; desktop stays as it is today.
- A user-facing toggle for the cell position numbers.
- Changes to scoring, timing, or core game rules.

## Further Notes

- A random 9-cell board commonly contains 4–8 sets, which is why thumbnails (not
  full-size boards) and a responsive grid were chosen — full-size stacked boards
  would be a five-to-six-screen scroll on a phone.
- Because found ∪ missed equals the board's complete set list, the review
  effectively visualizes every set on the final board, split into two
  color-coded, ordered groups.
- The faint cell numbers do double duty: an in-play reference aid and the key that
  makes the thumbnail coordinate captions self-explanatory.
