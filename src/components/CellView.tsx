import type { Cell } from "../types";
import { BACKGROUND_HEX, SHAPE_COLOR_HEX } from "../types";

// Outline stroke applied to every shape so it stays visible against any
// background (e.g. a white shape on a white cell).
const OUTLINE = "#222";
const STROKE_WIDTH = 4;

// Shapes are drawn in a 100×100 viewBox, centered with padding so the
// outline never clips at the edges.
function ShapeSvg({ cell }: { cell: Cell }) {
  const fill = SHAPE_COLOR_HEX[cell.shapeColor];
  const common = {
    fill,
    stroke: OUTLINE,
    strokeWidth: STROKE_WIDTH,
    strokeLinejoin: "round" as const,
  };

  switch (cell.shape) {
    case "triangle":
      return <polygon points="50,15 85,80 15,80" {...common} />;
    case "square":
      return <rect x="20" y="20" width="60" height="60" rx="6" {...common} />;
    case "circle":
      return <circle cx="50" cy="50" r="32" {...common} />;
  }
}

// A single board cell. Tapping toggles selection (handled by the parent);
// `selected` drives the highlight. `position` is the 1-based reading-order
// number used for accessibility labels. `flash`, when set, applies a brief
// color-coded outcome animation (e.g. "set", "not-set") to this cell.
export function CellView({
  cell,
  position,
  selected,
  flash,
  flashKey,
  onSelect,
}: {
  cell: Cell;
  position: number;
  selected: boolean;
  flash?: string;
  // Re-keys the element when a new flash fires so the animation replays even on
  // back-to-back identical outcomes.
  flashKey?: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      key={flash ? flashKey : undefined}
      className={
        "cell" +
        (selected ? " cell--selected" : "") +
        (flash ? ` cell--flash cell--flash-${flash}` : "")
      }
      style={{ background: BACKGROUND_HEX[cell.background] }}
      role="gridcell"
      aria-pressed={selected}
      aria-label={`Cell ${position}`}
      onClick={onSelect}
    >
      <svg viewBox="0 0 100 100" className="cell-shape" aria-hidden="true">
        <ShapeSvg cell={cell} />
      </svg>
    </button>
  );
}
