import { useState } from "react";
import { Game } from "./components/Game";
import { GameOver } from "./components/GameOver";
import { Home } from "./components/Home";
import type { Board as BoardModel } from "./lib/board";
import { loadHighScore, saveHighScore } from "./lib/highScore";

type Screen = "home" | "playing" | "over";

// Top-level session orchestrator: owns which screen is shown and the persisted
// high score, while `Game` owns in-board play and the timer. `initialBoard` lets
// tests drive a deterministic board into the playing screen.
export default function App({ initialBoard }: { initialBoard?: BoardModel } = {}) {
  const [screen, setScreen] = useState<Screen>("home");
  const [highScore, setHighScore] = useState(() => loadHighScore());
  const [finalScore, setFinalScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  // Incremented each time a game starts so `Game` remounts fresh (new board,
  // reset timer) even when consecutive games end on the same score.
  const [sessionId, setSessionId] = useState(0);

  function startGame() {
    setSessionId((id) => id + 1);
    setScreen("playing");
  }

  function handleGameOver(score: number) {
    const beaten = score > highScore;
    if (beaten) {
      setHighScore(score);
      saveHighScore(score);
    }
    setFinalScore(score);
    setIsNewHighScore(beaten);
    setScreen("over");
  }

  switch (screen) {
    case "home":
      return <Home highScore={highScore} onPlay={startGame} />;

    case "playing":
      return (
        <Game
          key={sessionId}
          initialBoard={initialBoard}
          onGameOver={handleGameOver}
        />
      );

    case "over":
      return (
        <GameOver
          score={finalScore}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onPlayAgain={startGame}
          onHome={() => setScreen("home")}
        />
      );
  }
}
