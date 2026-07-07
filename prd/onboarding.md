# PRD: Onboarding Intro & Centered Score — "Same or Different"

## Problem Statement

A new player who opens "Same or Different" lands on a static text wall ("How to
play" paragraph + a scoring list) and is expected to absorb the game's one hard
concept — that a valid set requires each of three attributes to be *all the same
or all different* — by reading. That rule is unintuitive and easy to skim past,
so first-timers start playing without really understanding it, tap wrong sets,
lose points, and bounce.

Meanwhile, returning players who already understand the game are forced through
that same static page every launch, adding friction to the thing they actually
want: playing. And during play, the live score — the number the player cares
about most — is tucked into the top-right corner at the same size as everything
else, so it doesn't read as the focal point.

## Solution

Replace the static Home page with a short, animated, step-by-step introduction
that teaches the set rule by showing it, then reveals the Play button only after
the player has stepped through every concept. Remember that the player has seen
it: returning players skip the intro and drop straight into a fresh game. Give
players who want a refresher a way to replay the intro from the game screen
without losing their current round.

On the play screen, make the live score the visual focal point — large and
centered — with the timer and controls flanking it and the best score present
but quiet.

## User Stories

1. As a first-time player, I want the rule explained by a worked visual example rather than a paragraph, so that I actually understand what a "set" is before I start.
2. As a first-time player, I want to see the three attributes (background color, shape, shape color) checked off one at a time on a real example, so that I understand each must be all-same-or-all-different independently.
3. As a first-time player, I want to see a counter-example that fails on exactly one attribute, so that the "same *or* different" rule clicks and I learn what a non-set looks like.
4. As a first-time player, I want a concise final step covering how to play (tap 3 cells, the "No more sets" button, the 2-minute timer, and scoring), so that I know the controls and stakes before I begin.
5. As a first-time player, I want to move forward and backward through the intro steps, so that I can re-read a step I didn't fully absorb.
6. As a first-time player, I want a progress indicator showing how many steps there are and where I am, so that I know the intro is short and finite.
7. As a first-time player, I want the Play button to appear only after the last step, so that I don't skip the explanation by accident.
8. As a returning player, I want to launch straight into a new game without seeing the intro again, so that I can start playing immediately.
9. As a returning player, I want a way to replay the intro from the game screen, so that I can refresh my memory of the rules whenever I want.
10. As a player replaying the intro mid-game, I want my current game paused (board, score, and timer preserved) while the intro is open, so that I don't lose my round just to check the rules.
11. As a player replaying the intro, I want the final step's button to say "Resume" and return me to my paused game, so that the replay is clearly a detour and not a fresh start.
12. As a player, I want the live score shown large and centered during play, so that I can read my score at a glance as the focal point of the screen.
13. As a player, I want the timer and mute control to stay accessible alongside the centered score, so that the layout stays usable on a phone.
14. As a player, I want my best score shown small and quiet near the score, so that it's available for context without competing with the live score.
15. As a player who prefers reduced motion, I want the intro animations to degrade to static, clear examples, so that the explanation still works without movement.
16. As a player, I want the intro example cells to be deliberately chosen, so that the lesson is always visually clear and unambiguous.
17. As a returning player, I want my mute preference and high score to persist between sessions, so that the app respects my settings.
18. As a player who finishes a game, I want to play again in one tap without passing through a home screen, so that consecutive rounds are frictionless.

## Implementation Decisions

### Screen flow
- The app's screen state machine becomes `intro → playing → over`.
- The animated intro **replaces** the former static Home screen; there is no separate title/Play landing page.
- On launch: if the player has seen the intro, start at `playing` (a fresh game); otherwise start at `intro`.
- The Game Over screen keeps "Play Again" (straight into a new game) and **removes** its "Home" button.

### Intro structure
- **Six steps**, navigated with Previous/Next plus a 6-dot progress indicator. No "Skip" on the first run.
  1. **Shape** — names the attribute, then reveals a "same" example (shape fixed, background and shape color vary) followed by a "different" example (shape takes all three values, background and shape color held constant).
  2. **Shape color** — the same same/different pair, isolating shape color.
  3. **Background** — the same same/different pair, isolating background.
  4. **The rule** — a valid-set example with the three attribute checks revealed one-by-one (each marked ✓), chosen so both "all same" and "all different" appear in one example.
  5. **The counter-example** — a near-set that fails on exactly one attribute (the only way to fail); the failing attribute is flagged with an ✗.
  6. **How to play** — concise combined note: tap 3 cells, use "No more sets" when none remain, 2-minute clock, one-line scoring.
- The Next control on the final step **becomes** the action button: **Play** on first run, **Resume** when replaying.
- **Animation approach:** sequenced reveal — per-attribute checks on the rule/counter-example steps, and a same-then-different example pair on the attribute steps — with cell pulses, rendered on the game's real cell component. Animations **play once per visit to a step** (re-triggered by navigating to a step), with no continuous loop. They degrade to static under `prefers-reduced-motion`.
- **Example cells are hand-authored constants**, not randomly generated, so the lesson is deterministic and pedagogically clean. Each attribute step's examples are checked at dev time to genuinely isolate their attribute (target attribute all-same or all-distinct as claimed, other two held constant or varied as claimed).

### Replay from the game screen
- A compact **help (`?`) icon button** sits next to the mute button in the top bar.
- Tapping it opens the intro as an **overlay over the current game with the timer paused** (the countdown stops while the overlay is open).
- Closing the overlay (or pressing **Resume** on the final step) returns to the *same* game with board, score, and timer state intact; the timer resumes.
- Replaying does not change the "intro seen" flag.

### Score & top bar layout (play screen)
- The top bar is a three-zone row: **timer on the left, live score large and bold in the center, mute (and help) controls on the right**.
- The **best score** is shown small and quiet directly under the centered score.

### Persistence
- A new wrapped-localStorage module mirrors the existing mute/high-score modules: read returns a safe default when storage is unavailable; write silently no-ops on failure.
- A new flag records that the intro has been seen. It flips to true the moment the player presses **Play** from the final intro step (not on first render, and not when replaying).
- All localStorage keys are renamed to a **`sod.`** prefix (high score, mute, intro-seen). **No migration** from the old prefix is provided — existing local data resets to defaults.

### Testing
- The intro→Play path sets the "seen" flag and routes into the game.
- A returning player (flag set) skips the intro and lands in the game.
- The help overlay pauses the timer, and Resume restores the same game with the timer continuing.

## Out of Scope

- A separate persistent Home/title screen for returning players.
- Migrating existing `set3x3.*` localStorage values to the new `sod.*` keys.
- A "Skip intro" affordance on the first run.
- Server-side or cross-device persistence of the intro-seen flag (it is per-device localStorage only).
- Changes to core game logic: the set predicate, board generation, scoring values, timer duration, and the "No more sets" mechanic are unchanged.
- Richer animation styles such as cells morphing/transitioning between same and different states (the morph-based "full motion" option was rejected).
- Localization/translation of the intro copy.

## Further Notes

- The hard concept the intro exists to teach is the per-attribute "all same or all different" rule; the counter-example step is the load-bearing moment where that insight lands, which is why it earns its own step despite the "as few steps as possible" goal.
- Reusing the existing cell-rendering component and the established CSS flash/pulse keyframes keeps the intro animations cheap and visually consistent with the live game.
- Keeping the storage-access modules wrapped (graceful degradation in private mode / on quota errors) is an existing project convention the new intro-seen module should follow.
- Because returning players never see a home screen, "Play Again" and launch-into-game are the only routes into a round; the intro is reachable only on first run or via the in-game help button.
