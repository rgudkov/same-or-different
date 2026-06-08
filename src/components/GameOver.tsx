// The end-of-game screen: final cumulative score, a celebration when the high
// score was beaten, and actions to replay or return home.
export function GameOver({
  score,
  highScore,
  isNewHighScore,
  onPlayAgain,
  onHome,
}: {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  return (
    <main className="app over">
      <h1 className="title">Game Over</h1>

      {isNewHighScore && (
        <p className="celebrate" role="status">
          🎉 New best!
        </p>
      )}

      <p className="final-score">
        Score: <strong aria-label="Final score">{score}</strong>
      </p>
      <p className="high-score">
        Best: <strong aria-label="High score">{highScore}</strong>
      </p>

      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={onPlayAgain}>
          Play again
        </button>
        <button type="button" className="btn" onClick={onHome}>
          Home
        </button>
      </div>
    </main>
  );
}
