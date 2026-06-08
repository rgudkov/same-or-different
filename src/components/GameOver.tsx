import type { Cell } from "../types";
import type { Board as BoardModel } from "../lib/board";
import { CellView } from "./CellView";

// Formats a set (0-based index triple) as sorted 1-based cell numbers, matching
// the faint position numbers on the cells, e.g. [0, 4, 8] → "1,5,9".
function formatCoords(triple: number[]): string {
  return [...triple].sort((a, b) => a - b).map((i) => i + 1).join(",");
}

// Stable key/compare for a set: its sorted coordinate string. Both the board's
// authoritative set list and the found list hold sorted triples already, so this
// doubles as identity for the "missed = all − found" derivation.
function setKey(triple: number[]): string {
  return [...triple].sort((a, b) => a - b).join(",");
}

// One set rendered as a static, non-interactive thumbnail board: the three
// set-cells highlighted (green for found, red for missed), the other six dimmed,
// captioned with its coordinates.
function SetThumbnail({
  cells,
  set,
  kind,
}: {
  cells: Cell[];
  set: number[];
  kind: "found" | "missed";
}) {
  const coords = formatCoords(set);
  return (
    <figure className="thumb">
      <div className="board board--thumb" role="grid" aria-label={`Set ${coords}`}>
        {cells.map((cell, i) => (
          <CellView
            key={i}
            cell={cell}
            position={i + 1}
            static
            dimmed={!set.includes(i)}
            highlight={set.includes(i) ? kind : undefined}
          />
        ))}
      </div>
      <figcaption className="thumb-caption">{coords}</figcaption>
    </figure>
  );
}

// A titled responsive grid of set thumbnails. Renders nothing when its set list
// is empty, so empty "Missed"/"Found" sections are omitted entirely.
function ReviewSection({
  title,
  sets,
  cells,
  kind,
}: {
  title: string;
  sets: number[][];
  cells: Cell[];
  kind: "found" | "missed";
}) {
  if (sets.length === 0) return null;
  return (
    <section className="review" aria-label={title}>
      <h2 className="review-title">{title}</h2>
      <div className="review-grid">
        {sets.map((set) => (
          <SetThumbnail key={setKey(set)} cells={cells} set={set} kind={kind} />
        ))}
      </div>
    </section>
  );
}

// The end-of-game screen: final cumulative score, a celebration when the high
// score was beaten, a visual review of every set on the last board played
// (missed first, then found), and a one-tap replay into a fresh game. There is
// no Home button — returning players never see a home screen, so Play Again is
// the only route onward.
export function GameOver({
  score,
  highScore,
  isNewHighScore,
  board,
  found,
  onPlayAgain,
}: {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  // The board the player was on when the clock hit zero.
  board: BoardModel;
  // The sets found on that final board (sorted 0-based index triples).
  found: number[][];
  onPlayAgain: () => void;
}) {
  // Missed = the board's authoritative set list minus the found list. Found and
  // missed together are exactly every set on the final board.
  const foundKeys = new Set(found.map(setKey));
  const missed = board.sets.filter((set) => !foundKeys.has(setKey(set)));

  return (
    <main className="app over">
      <div className="over-summary">
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
      </div>

      <ReviewSection title="Missed sets" sets={missed} cells={board.cells} kind="missed" />
      <ReviewSection title="Found sets" sets={found} cells={board.cells} kind="found" />

      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={onPlayAgain}>
          Play again
        </button>
      </div>
    </main>
  );
}
