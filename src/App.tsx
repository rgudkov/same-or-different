import { useState } from "react";
import { DailyLanding } from "./components/DailyLanding";
import { DailyPlay } from "./components/DailyPlay";
import type { DailyResult } from "./components/DailyPlay";
import { Game } from "./components/Game";
import { GameOver } from "./components/GameOver";
import { Intro } from "./components/Intro";
import { StreakStatus } from "./components/StreakStatus";
import type { Board as BoardModel } from "./lib/board";
import { generateDailyBoard } from "./lib/dailyBoard";
import { loadHighScore, saveHighScore } from "./lib/highScore";
import { loadIntroSeen, saveIntroSeen } from "./lib/introSeen";
import { loadStreak, saveStreak, updateStreak } from "./lib/streak";
import type { StreakState } from "./lib/streak";
import { todayLocalDate } from "./lib/today";

type Screen = "intro" | "daily-landing" | "daily-playing" | "streak-status" | "playing" | "over";

// Whether today's local Daily has already been completed, per the persisted
// streak state.
function dailyCompletedToday(streak: StreakState): boolean {
  return streak.lastCompletedDate === todayLocalDate();
}

// The screen a launch (or a return from Timed mode) should land on, driven
// purely by whether today's local Daily has been completed — not by which
// mode the player used last.
function dailyEntryScreen(streak: StreakState): Screen {
  return dailyCompletedToday(streak) ? "streak-status" : "daily-landing";
}

// Top-level session orchestrator: owns which screen is shown, the persisted
// high score, and the persisted streak, while `Game`/`DailyPlay` own in-board
// play. On launch a player who has already seen the intro drops straight into
// Daily's landing screen (or the streak-status screen, if today's Daily is
// already done); a first-timer sees the intro first. `initialBoard` lets tests
// drive a deterministic board into Timed mode's playing screen.
export default function App({
  initialBoard,
  initialDailyBoard,
}: {
  initialBoard?: BoardModel;
  // Lets tests drive a deterministic board into the Daily playing screen,
  // mirroring `initialBoard` for Timed mode.
  initialDailyBoard?: BoardModel;
} = {}) {
  const [screen, setScreen] = useState<Screen>(() => {
    if (!loadIntroSeen()) return "intro";
    return dailyEntryScreen(loadStreak());
  });
  const [highScore, setHighScore] = useState(() => loadHighScore());
  const [finalScore, setFinalScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  // The board the player ended on and the sets they found on it, captured at
  // game over so the Game Over screen can review them. Null until a game ends.
  const [finalBoard, setFinalBoard] = useState<BoardModel | null>(null);
  const [finalFound, setFinalFound] = useState<number[][]>([]);
  // Incremented each time a Timed game starts so `Game` remounts fresh (new
  // board, reset timer) even when consecutive games end on the same score.
  const [sessionId, setSessionId] = useState(0);
  const [streak, setStreak] = useState(() => loadStreak());
  // True only when streak-status is reached straight from finishing today's
  // Daily (not on a later same-day reopen), so the confetti/celebration copy
  // shows once rather than on every revisit.
  const [justCompletedDaily, setJustCompletedDaily] = useState(false);

  function startGame() {
    setSessionId((id) => id + 1);
    setScreen("playing");
  }

  // First-run intro completion: remember the intro was seen (so future
  // launches skip it), then land on the same screen a returning player would
  // see.
  function finishIntro() {
    saveIntroSeen(true);
    setScreen(dailyEntryScreen(streak));
  }

  function handleDailyComplete(result: DailyResult) {
    const today = todayLocalDate();
    const updated: StreakState = {
      ...updateStreak(streak, today),
      lastResult: { date: today, ...result },
    };
    saveStreak(updated);
    setStreak(updated);
    setJustCompletedDaily(true);
    setScreen("streak-status");
  }

  function handleGameOver(result: { score: number; board: BoardModel; found: number[][] }) {
    const { score, board, found } = result;
    const beaten = score > highScore;
    if (beaten) {
      setHighScore(score);
      saveHighScore(score);
    }
    setFinalScore(score);
    setIsNewHighScore(beaten);
    setFinalBoard(board);
    setFinalFound(found);
    setScreen("over");
  }

  switch (screen) {
    case "intro":
      return <Intro onComplete={finishIntro} />;

    case "daily-landing":
      return (
        <DailyLanding onStart={() => setScreen("daily-playing")} onPlayTimed={startGame} />
      );

    case "daily-playing":
      return (
        <DailyPlay
          board={initialDailyBoard ?? generateDailyBoard(todayLocalDate())}
          onComplete={handleDailyComplete}
        />
      );

    case "streak-status":
      return (
        <StreakStatus
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
          result={streak.lastResult}
          justCompleted={justCompletedDaily}
          onPlayTimed={startGame}
        />
      );

    case "playing":
      return (
        <Game
          key={sessionId}
          initialBoard={initialBoard}
          highScore={highScore}
          onGameOver={handleGameOver}
        />
      );

    case "over":
      // finalBoard is always set before switching to "over" (handleGameOver runs
      // first); the guard satisfies the type and falls back to a fresh game.
      if (!finalBoard) return null;
      return (
        <GameOver
          score={finalScore}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          board={finalBoard}
          found={finalFound}
          onPlayAgain={startGame}
        />
      );
  }
}
