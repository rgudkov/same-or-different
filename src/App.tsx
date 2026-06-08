import { useState } from "react";
import { Game } from "./components/Game";
import { GameOver } from "./components/GameOver";
import { Intro } from "./components/Intro";
import type { Board as BoardModel } from "./lib/board";
import { loadHighScore, saveHighScore } from "./lib/highScore";
import { loadIntroSeen, saveIntroSeen } from "./lib/introSeen";

type Screen = "intro" | "playing" | "over";

// Top-level session orchestrator: owns which screen is shown and the persisted
// high score, while `Game` owns in-board play and the timer. On launch a player
// who has already seen the intro drops straight into a fresh game; a first-timer
// sees the intro. `initialBoard` lets tests drive a deterministic board into the
// playing screen.
export default function App({ initialBoard }: { initialBoard?: BoardModel } = {}) {
  const [screen, setScreen] = useState<Screen>(() =>
    loadIntroSeen() ? "playing" : "intro",
  );
  const [highScore, setHighScore] = useState(() => loadHighScore());
  const [finalScore, setFinalScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  // The board the player ended on and the sets they found on it, captured at
  // game over so the Game Over screen can review them. Null until a game ends.
  const [finalBoard, setFinalBoard] = useState<BoardModel | null>(null);
  const [finalFound, setFinalFound] = useState<number[][]>([]);
  // Incremented each time a game starts so `Game` remounts fresh (new board,
  // reset timer) even when consecutive games end on the same score.
  const [sessionId, setSessionId] = useState(0);

  function startGame() {
    setSessionId((id) => id + 1);
    setScreen("playing");
  }

  // First-run intro completion: remember the intro was seen (so future launches
  // skip it), then drop into a fresh game.
  function finishIntro() {
    saveIntroSeen(true);
    startGame();
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
