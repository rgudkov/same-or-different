import { afterEach, describe, expect, it } from "vitest";
import { loadHighScore, saveHighScore } from "./highScore";

afterEach(() => {
  localStorage.clear();
});

describe("highScore", () => {
  it("returns 0 when nothing is stored", () => {
    expect(loadHighScore()).toBe(0);
  });

  it("round-trips a saved score", () => {
    saveHighScore(17);
    expect(loadHighScore()).toBe(17);
  });

  it("overwrites a previous score", () => {
    saveHighScore(5);
    saveHighScore(12);
    expect(loadHighScore()).toBe(12);
  });

  it("treats non-numeric stored values as no high score", () => {
    localStorage.setItem("set3x3.highScore", "not-a-number");
    expect(loadHighScore()).toBe(0);
  });
});
