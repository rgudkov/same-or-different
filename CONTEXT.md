# Same or Different

A Set-clone puzzle game (3×3 grid, 3 attributes). Single context — this file is the glossary for the whole repo.

## Language

**Timed mode**:
The original game mode: a continuous stream of freshly-generated boards played against a fixed 2-minute clock, scored by sets found minus mistakes.
_Avoid_: "the game", "classic mode", "endless mode"

**Daily mode**:
A single, untimed board that is identical for every player on a given local calendar date. Won by finding every set on that board and confirming with the Complete button; ends the session either way (no retry, no resume).
_Avoid_: "daily puzzle" (that's the board itself, not the mode — see below), "practice mode"

**Daily puzzle**:
The specific 9-cell board served by Daily mode on a given local calendar date, deterministically generated from that date so every player sees the same board that day.
_Avoid_: "today's board", "the daily"

**Complete button**:
The control a player presses to declare they've found every set on the current board. Correct only when every set on the board has been found; pressing it early is a mistake but does not end the session. Shared mechanic between Timed and Daily mode.

**Mistake**:
A `not-set` selection (three cells that don't form a set) or a `complete-wrong` outcome (pressing Complete before every set is found). Counted identically in Timed and Daily mode.
_Avoid_: "wrong guess", "penalty" (those describe the scoring effect, not the event itself)

**Streak**:
The count of consecutive local calendar days on which the player completed that day's Daily puzzle. Broken the moment one local day passes with no completed Daily — no grace period.
_Avoid_: "streak count" (redundant), "daily streak" (the "daily" is implied — see Current streak / Longest streak)

**Current streak**:
The streak as of the most recently completed Daily puzzle; resets to 0 the next time the player completes a Daily after having missed a day.

**Longest streak**:
The player's personal-best Current streak ever reached, persisted independently so it survives a streak reset. Mirrors how High score already tracks a running best alongside the current session's score.

**Streak-status screen**:
The screen shown when a player opens Daily mode after already completing today's puzzle: current streak, longest streak, a recap of today's result, and a share action. Distinct from the (Timed-only) Game Over set-review screen — Daily never shows that screen, since finishing Daily means every set was already found.
_Avoid_: "come back tomorrow screen", "daily results screen"
