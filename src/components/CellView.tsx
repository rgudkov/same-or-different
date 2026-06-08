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

// A single board cell. On the live board it is a tappable button; in the Game
// Over review (`static`) it is a non-interactive tile. `position` is the 1-based
// reading-order number, rendered both as a faint corner label on the cell and in
// the accessibility label. `selected` drives the live highlight; `flash`, when
// set, applies a brief color-coded outcome animation. On review thumbnails
// `dimmed` quietens the non-set cells and `highlight` ("found"/"missed") rings
// the set cells green or red.
export function CellView({
  cell,
  position,
  selected = false,
  flash,
  flashKey,
  onSelect,
  static: isStatic = false,
  dimmed = false,
  highlight,
}: {
  cell: Cell;
  position: number;
  selected?: boolean;
  flash?: string;
  // Re-keys the element when a new flash fires so the animation replays even on
  // back-to-back identical outcomes.
  flashKey?: number;
  onSelect?: () => void;
  // Renders a non-interactive tile (Game Over review) instead of a button.
  static?: boolean;
  // Quietens a non-set cell on a review thumbnail.
  dimmed?: boolean;
  // Color-codes a set cell on a review thumbnail: green for found, red for missed.
  highlight?: "found" | "missed";
}) {
  const className =
    "cell" +
    (selected ? " cell--selected" : "") +
    (dimmed ? " cell--dimmed" : "") +
    (highlight ? ` cell--highlight cell--highlight-${highlight}` : "") +
    (flash ? ` cell--flash cell--flash-${flash}` : "");

  // The faint reading-order number tucked into a corner and the shape itself.
  // Shared by both the interactive and static renderings.
  const content = (
    <>
      <span className="cell-num" aria-hidden="true">
        {position}
      </span>
      <svg viewBox="0 0 100 100" className="cell-shape" aria-hidden="true">
        <ShapeSvg cell={cell} />
      </svg>
    </>
  );

  if (isStatic) {
    return (
      <div
        className={className}
        style={{ background: BACKGROUND_HEX[cell.background] }}
        role="gridcell"
        aria-label={`Cell ${position}`}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      key={flash ? flashKey : undefined}
      className={className}
      style={{ background: BACKGROUND_HEX[cell.background] }}
      role="gridcell"
      aria-pressed={selected}
      aria-label={`Cell ${position}`}
      onClick={onSelect}
    >
      {content}
    </button>
  );
}
