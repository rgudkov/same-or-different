// Domain model for the "Set 3×3" game.
//
// A cell is one of 27 unique combinations of three independent attributes.
// Value sets are kept as swappable constants so palettes/shapes can change
// without touching logic. The default shape palette is the color-blind-safe
// red/blue/yellow.

export const BACKGROUNDS = ["black", "white", "grey"] as const;
export const SHAPES = ["triangle", "square", "circle"] as const;
export const SHAPE_COLORS = ["red", "blue", "yellow"] as const;

export type Background = (typeof BACKGROUNDS)[number];
export type Shape = (typeof SHAPES)[number];
export type ShapeColor = (typeof SHAPE_COLORS)[number];

export type Cell = {
  background: Background;
  shape: Shape;
  shapeColor: ShapeColor;
};

// Hex values rendered for each shape color (swappable palette).
export const SHAPE_COLOR_HEX: Record<ShapeColor, string> = {
  red: "#e63946",
  blue: "#1d6fe0",
  yellow: "#f4c20d",
};

// CSS background values for each cell background.
export const BACKGROUND_HEX: Record<Background, string> = {
  black: "#1a1a1a",
  white: "#fafafa",
  grey: "#8a8a8a",
};
