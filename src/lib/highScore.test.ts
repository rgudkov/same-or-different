import { afterEach, describe, expect, it, vi } from "vitest";
import { loadHighScore, saveHighScore } from "./highScore";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
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
    localStorage.setItem("sod.highScore", "not-a-number");
    expect(loadHighScore()).toBe(0);
  });

  it("degrades to 0 when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(loadHighScore()).toBe(0);
  });

  it("silently no-ops a save when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(() => saveHighScore(10)).not.toThrow();
  });
});
