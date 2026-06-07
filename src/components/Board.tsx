import type { Cell } from "../types";
import { CellView } from "./CellView";

// Renders 9 cells in reading order (left-to-right, top-to-bottom) as a
// square 3×3 grid.
export function Board({ cells }: { cells: Cell[] }) {
  return (
    <div className="board" role="grid" aria-label="Set board">
      {cells.map((cell, i) => (
        <CellView key={i} cell={cell} />
      ))}
    </div>
  );
}
