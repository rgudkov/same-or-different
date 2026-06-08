import { afterEach, describe, expect, it } from "vitest";
import { loadMuted, saveMuted } from "./mute";

afterEach(() => {
  localStorage.clear();
});

describe("mute", () => {
  it("defaults to not muted when nothing is stored", () => {
    expect(loadMuted()).toBe(false);
  });

  it("round-trips a saved preference", () => {
    saveMuted(true);
    expect(loadMuted()).toBe(true);
  });

  it("can be toggled back off", () => {
    saveMuted(true);
    saveMuted(false);
    expect(loadMuted()).toBe(false);
  });
});
