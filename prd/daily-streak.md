# PRD: Daily Mode & Streak

## Problem Statement

Today the game only has one mode — a continuous, timed score-attack — and
nothing brings a player back the next day. Once someone has played a session
and seen their high score, there's no reason to return tomorrow rather than
next week or never. I want a reason to open the app again tomorrow: a short,
low-commitment daily ritual, shared with everyone else playing that day, that
builds a personal streak worth protecting.

## Solution

A new **Daily mode** becomes the app's default launch experience, alongside
the existing mode (renamed **Timed mode** now that it's no longer the only
one). Daily mode serves one **Daily puzzle** — a single, untimed 3×3 board,
identical for every player on a given local calendar date — which the player
solves by finding every set on it. Completing a Daily puzzle extends a
**streak** of consecutive days played, tracked and shown alongside a
personal-best **longest streak**, mirroring how high score already works for
Timed mode. After finishing, the player can share their result (time taken +
mistakes) via the device's native share sheet. Web ads and any form of
streak-freeze/grace period are explicitly deferred to a later PRD.

## User Stories

1. As a returning player, I want the app to open into today's Daily puzzle by default, so that the daily ritual is the first thing I see.
2. As a first-time player, I want the existing intro to explain that Daily is untimed and single-board (distinct from Timed mode), so that I understand what I'm starting.
3. As a player, I want a landing screen for today's Daily puzzle with a Start button, so that I have a clear on-ramp before play begins.
4. As a player, I want a link on the Daily landing screen to play Timed mode instead, so that I can still play the original mode any time I want.
5. As a player, I want today's Daily puzzle to be the same board every other player sees today, so that my result is meaningfully comparable to theirs.
6. As a player, I want the Daily puzzle to have no timer, so that I can take my time finding every set without pressure.
7. As a player, I want to win Daily mode by finding every set on the board, so that the goal is thoroughness rather than speed under a clock.
8. As a player, I want the same Complete button and set-selection mechanic I already know from Timed mode, so that Daily feels immediately familiar.
9. As a player, I want a wrong Complete in Daily mode (declaring done with sets still unfound) to count as a mistake without ending the session, so that the mechanic behaves consistently with Timed mode.
10. As a player, I want mistakes in Daily mode (wrong 3-cell picks and wrong Completes) counted the same way they are in Timed mode, so that "mistakes" means one consistent thing across the app.
11. As a player, I want only one attempt at each day's Daily puzzle, so that today's result is a single, honest ritual rather than something I can retry until it looks good.
12. As a player, I want to be told a completed Daily puzzle can't be replayed, so that I'm not confused about why I can't start it again.
13. As a player, if I close the app mid-Daily-puzzle and reopen it the same day, I want to start that day's puzzle fresh rather than resume, so that behavior stays simple and predictable.
14. As a player, I want to see a streak-status screen right after completing today's Daily puzzle, so that I immediately see the result of my ritual.
15. As a player, I want the streak-status screen to reappear (instead of the landing screen) if I reopen the app later the same day, so that I'm not offered a puzzle I've already finished.
16. As a player, I want the streak-status screen to show my current streak, so that I know how many consecutive days I've played.
17. As a player, I want the streak-status screen to show my longest streak ever, so that I have a personal best to chase, the way high score already works.
18. As a player, I want the streak-status screen to recap today's time taken and mistake count, so that I can see how I did even if I reopen the app hours later.
19. As a player, I want my streak to increase by one when I complete a Daily puzzle the day after my last completed one, so that consecutive daily play is rewarded.
20. As a player, I want my streak to reset if I miss a calendar day without completing a Daily puzzle, so that the streak reflects genuinely consecutive play.
21. As a player, I want a share button on the streak-status screen, so that I can post my result to friends.
22. As a player, I want sharing to use my device's native share sheet (so I can pick WhatsApp, Facebook, or anything else installed), so that I'm not limited to a couple of hardcoded destinations.
23. As a player on a browser without native share support, I want a "copy result" fallback, so that I can still share manually.
24. As a player, I want the streak-status screen to also link to Timed mode, so that I can keep playing after my Daily puzzle is done.
25. As a developer, I want the streak update logic covered by automated tests, so that streak increments/resets never silently regress.
26. As a developer, I want the date-seeded board generation covered by automated tests, so that every player is guaranteed to see the same board on a given date.

## Implementation Decisions

- **New mode, not a variant flag**: Daily mode is a distinct mode from Timed
  mode, with its own screens, but reuses the existing set-evaluation/Complete
  reducer unmodified — Daily's win condition ("every set found") is just the
  existing "no unfound sets remain" Complete-correct check, on a session that
  never advances to a next board.
- **Screen flow**: two new screens are added ahead of/alongside the existing
  intro → play → game-over flow: a **Daily landing screen** (shown when
  today's Daily hasn't been completed yet) and a **streak-status screen**
  (shown immediately after completing today's Daily, and on any later launch
  the same day once it's done). Both screens link out to Timed mode. Which
  screen appears on launch is driven purely by whether today's Daily has been
  completed — not by which mode the player used last.
- **Intro update**: the existing first-time onboarding intro's copy is updated
  to introduce Daily mode (untimed, single board) and mention Timed mode
  exists separately. Exact copy is an implementation detail, not specified
  here.
- **Board generation**: the Daily puzzle is generated deterministically from
  the player's local calendar date, reusing the existing seedable board
  generator unchanged — only a date-to-random-source seeding function is new.
  Same board for every player on the same local date; local calendar date is
  the basis (not UTC), so the puzzle boundary is each player's own midnight
  rather than a single global instant.
- **Mistake counting**: identical definition to Timed mode — a `not-set`
  selection or a `complete-wrong` outcome. No new mistake concept for Daily.
- **One attempt per day**: no resume of an in-progress Daily session (closing
  the tab mid-puzzle and reopening the same day restarts that day's puzzle
  from scratch) and no replay after completion. Both are accepted simplicity
  tradeoffs, not oversights.
- **No set-review screen for Daily**: Timed mode's existing Game Over
  set-review screen is not shown after Daily completion, since finishing
  Daily means every set was already found — there's nothing unfound to
  review.
- **Streak persistence**: streak state is persisted the same way high score,
  mute, and intro-seen already are — a small dedicated module following the
  existing wrapped-localStorage pattern (silent no-op on storage failure).
  Persisted state includes: current streak, longest streak, the local date of
  the last completed Daily, and the most recent result (date, time taken,
  mistake count) — the result is persisted (not just held in memory) so the
  streak-status screen shows correct data even after an app restart.
- **Streak update rule**: on completing a Daily puzzle, if the last completed
  date was the local-calendar day before today, current streak increments by
  one; otherwise (any earlier date, or no prior completion) current streak
  resets to one. Longest streak updates whenever current streak exceeds it.
  No grace period, streak-freeze, or streak-recovery mechanic in this PRD.
- **Sharing**: uses the platform's native share API where available, handing
  off to the OS share sheet (which surfaces WhatsApp, Facebook, and anything
  else installed) rather than building bespoke per-platform share buttons.
  Falls back to a "copy result to clipboard" action on browsers without
  native share support. Shared text includes time taken and mistake count;
  it does not include a day number or any other epoch/counter framing.
- **Vocabulary**: this PRD uses the terms defined in `CONTEXT.md` (Timed
  mode, Daily mode, Daily puzzle, Complete button, Mistake, Streak, Current
  streak, Longest streak, Streak-status screen) — refer there for precise
  definitions and terms to avoid.

## Testing Decisions

- Tests target external behavior (inputs/outputs of pure functions), not
  internal implementation, matching the existing `board.ts`/`game.ts` test
  style (`board.test.ts`, `game.test.ts`, `Game.test.tsx`).
- **Streak update logic** is a pure function of (previous streak state,
  today's local date) → new streak state, tested directly without React —
  same pattern as `game.ts`'s reducer tests. Covers: first-ever completion,
  consecutive-day increment, longest-streak update, and reset after a missed
  day.
- **Date-seeded board generation** is a pure function of a date string →
  deterministic random source, tested directly. Covers: same date always
  produces the same board; different dates produce different boards (in the
  common case); the output still satisfies the existing board invariants
  (9 distinct cells, `MIN_SETS` sets) via the existing `generateBoard`
  contract.
- Screen-flow/orchestration behavior (landing vs. streak-status on launch,
  linking to Timed mode) is tested at the component level, following the
  existing pattern used for `App.tsx`'s screen switching.
- No new seams are introduced inside `board.ts` or `game.ts` themselves —
  both are reused unmodified, so their existing test coverage continues to
  apply to Daily mode without changes.

## Out of Scope

- **Web ads / AdSense** — no ad slots or placeholders, deferred entirely to a
  later PRD.
- **Streak grace periods, streak-freeze, or ad-funded streak recovery** —
  streak breaks strictly on any missed local day.
- **Resuming an in-progress Daily attempt** after closing the tab.
- **Replaying a completed Daily puzzle.**
- **Cross-device streak sync** — streak state is localStorage-only, same as
  high score today; no backend, no accounts.
- **Day-number/epoch display** (e.g. "Day 47") in the UI or share text.
- **Global/UTC-synchronized daily puzzle** — the puzzle boundary is each
  player's own local midnight, not a single worldwide instant.
- **Android wrapper** — out of scope for the project's current direction,
  not specific to this feature.
- **Other feature-suggestions.md backlog items** (mid-Timed-game "New Game"
  button, a longer/zen mode, prettier found-sets display, prettier game
  name) — unrelated to this feature.

## Further Notes

- **Why local date over UTC**: a single global instant would make the
  streak's "day boundary" fall at different local times for different
  players, which complicates streak-continuity reasoning for no real benefit
  here — the streak is a personal mechanic, not a live worldwide event.
  Accepting that two players in different timezones may occasionally see
  "today's" puzzle turn over at different real-world moments is a deliberate
  tradeoff in favor of that simplicity.
- **Why the Complete button is reused rather than auto-ending on the last
  set**: keeping the exact same mechanic (and the exact same definition of a
  "mistake") across Timed and Daily mode means the share text's mistake count
  means one consistent thing everywhere, and it reuses the existing reducer
  without a Daily-specific branch.
- **Relationship to ads**: web ads were discussed as part of the same
  retention push but are deferred to their own PRD; the streak-status screen
  is expected to be a natural future ad placement, but no ad-related work
  (including placeholders) is included here.
