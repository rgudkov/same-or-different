import { useReducer } from "react";
import { Board } from "./components/Board";
import type { Board as BoardModel } from "./lib/board";
import { generateBoard } from "./lib/board";
import { gameReducer, initGameState } from "./lib/game";

// Formats a found set (0-based index triple) as sorted 1-based cell numbers,
// e.g. [0, 4, 8] → "1,5,9".
function formatFoundSet(triple: number[]): string {
  return triple.map((i) => i + 1).join(",");
}

// `initialBoard` lets tests inject a deterministic board; in normal use a fresh
// random board is generated once on load.
export default function App({ initialBoard }: { initialBoard?: BoardModel } = {}) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    initGameState(initialBoard ?? generateBoard()),
  );

  return (
    <main className="app">
      <h1 className="title">Set 3×3</h1>

      <div className="stats">
        <span className="stat">
          Score: <strong aria-label="Score">{state.score}</strong>
        </span>
      </div>

      <Board
        cells={state.board.cells}
        selected={state.selected}
        onSelect={(index) => dispatch({ type: "toggle", index })}
      />

      <section className="found" aria-label="Found sets">
        <h2 className="found-title">Found sets</h2>
        {state.found.length === 0 ? (
          <p className="found-empty">None yet</p>
        ) : (
          <ul className="found-list">
            {state.found.map((triple) => (
              <li key={formatFoundSet(triple)} className="found-item">
                {formatFoundSet(triple)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
