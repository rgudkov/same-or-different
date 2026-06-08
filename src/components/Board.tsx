import type { Cell } from "../types";
import { CellView } from "./CellView";

// Renders 9 cells in reading order (left-to-right, top-to-bottom) as a square
// 3×3 grid. `selected` holds the 0-based indices currently highlighted;
// `onSelect` is called with the tapped cell's index. `flash`, when present,
// briefly animates the listed cells in the outcome's color (e.g. a green "set"
// pulse); `flashKey` retriggers the animation on each new outcome.
export function Board({
  cells,
  selected,
  flash,
  onSelect,
}: {
  cells: Cell[];
  selected: number[];
  flash?: { cells: number[]; kind: string; key: number };
  onSelect: (index: number) => void;
}) {
  return (
    <div className="board" role="grid" aria-label="Set board">
      {cells.map((cell, i) => (
        <CellView
          key={i}
          cell={cell}
          position={i + 1}
          selected={selected.includes(i)}
          flash={flash?.cells.includes(i) ? flash.kind : undefined}
          flashKey={flash?.key}
          onSelect={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
