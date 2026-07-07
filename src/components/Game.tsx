import { useEffect, useRef, useState } from "react";
import { PlaySession } from "./PlaySession";
import type { PlaySessionHandle } from "./PlaySession";
import type { Board as BoardModel } from "../lib/board";
import { generateBoard } from "../lib/board";

// One continuous countdown spans the whole game (all boards). Two minutes.
export const GAME_DURATION_SECONDS = 120;

// Formats remaining seconds as m:ss (e.g. 120 → "2:00", 9 → "0:09").
function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Timed mode's playing screen: wraps the shared `PlaySession` core with a
// countdown and "correct Complete loads a fresh board" behavior. When the
// timer reaches zero it reads the live score/board/found off `PlaySession` via
// its imperative handle and reports the final result to the parent, which
// switches to Game Over. `initialBoard` lets tests inject a deterministic
// board.
export function Game({
  onGameOver,
  highScore,
  initialBoard,
}: {
  // Reports the final score plus the last board played and the sets found on it,
  // so Game Over can show a review of what was on that board.
  onGameOver: (result: { score: number; board: BoardModel; found: number[][] }) => void;
  highScore: number;
  initialBoard?: BoardModel;
}) {
  const [board] = useState(() => initialBoard ?? generateBoard());
  const [secondsLeft, setSecondsLeft] = useState(GAME_DURATION_SECONDS);
  // Mirrors PlaySession's help-overlay state so the countdown can pause while
  // it's open.
  const [helpOpen, setHelpOpen] = useState(false);
  const sessionRef = useRef<PlaySessionHandle>(null);

  // One interval drives the countdown for the whole game; it stops itself at 0.
  // While the help overlay is open the countdown is paused: the interval is torn
  // down and re-created (resuming from the same `secondsLeft`) when it closes.
  useEffect(() => {
    if (helpOpen) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [helpOpen]);

  // When the clock hits zero, end the game with the current score.
  useEffect(() => {
    if (secondsLeft === 0) {
      const result = sessionRef.current?.getResult();
      if (result) onGameOver(result);
    }
    // Only react to the clock reaching zero; state is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  return (
    <PlaySession
      ref={sessionRef}
      initialBoard={board}
      highScore={highScore}
      getNextBoard={generateBoard}
      onHelpOpenChange={setHelpOpen}
      timerSlot={
        <span className="timer" aria-label="Time left">
          {formatTime(secondsLeft)}
        </span>
      }
    />
  );
}
