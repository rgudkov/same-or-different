import { useRef, useState } from "react";
import { PlaySession } from "./PlaySession";
import type { Board as BoardModel } from "../lib/board";

// The result of a completed Daily session, recapped on the streak-status
// screen and folded into streak persistence.
export type DailyResult = { timeTakenSeconds: number; mistakeCount: number };

// Daily mode's playing screen: wraps the shared `PlaySession` core with no
// timer. A Mistake is a `not-set` selection or a `complete-wrong` outcome,
// counted identically to Timed mode (per CONTEXT.md). The session ends the
// moment every set is found and Complete is pressed correctly — there is no
// next board to advance to, so `getNextBoard` just hands back the same board
// (PlaySession requires one, but the parent switches away from this screen
// before it would ever render).
export function DailyPlay({
  board,
  onComplete,
}: {
  board: BoardModel;
  onComplete: (result: DailyResult) => void;
}) {
  const [mistakeCount, setMistakeCount] = useState(0);
  const startedAt = useRef(Date.now());

  return (
    <PlaySession
      initialBoard={board}
      getNextBoard={() => board}
      onOutcome={(outcome) => {
        if (outcome === "not-set" || outcome === "complete-wrong") {
          setMistakeCount((count) => count + 1);
        }
      }}
      onCorrectComplete={() => {
        const timeTakenSeconds = Math.round((Date.now() - startedAt.current) / 1000);
        onComplete({ timeTakenSeconds, mistakeCount });
      }}
    />
  );
}
