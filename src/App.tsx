import type { Cell } from "./types";
import { Board } from "./components/Board";

// Phase 1: a hardcoded 9-cell board that exercises every attribute value —
// all three backgrounds, all three shapes, and all three shape colors — each
// with a visible outline. Replaced by a generated board in Phase 2.
const DEMO_CELLS: Cell[] = [
  { background: "black", shape: "triangle", shapeColor: "red" },
  { background: "white", shape: "square", shapeColor: "blue" },
  { background: "grey", shape: "circle", shapeColor: "yellow" },
  { background: "white", shape: "circle", shapeColor: "red" },
  { background: "grey", shape: "triangle", shapeColor: "blue" },
  { background: "black", shape: "square", shapeColor: "yellow" },
  { background: "grey", shape: "square", shapeColor: "red" },
  { background: "black", shape: "circle", shapeColor: "blue" },
  { background: "white", shape: "triangle", shapeColor: "yellow" },
];

export default function App() {
  return (
    <main className="app">
      <h1 className="title">Set 3×3</h1>
      <Board cells={DEMO_CELLS} />
    </main>
  );
}
