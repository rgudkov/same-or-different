import { afterEach, describe, expect, it, vi } from "vitest";
import { loadMuted, saveMuted } from "./mute";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
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

  it("degrades to not muted when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(loadMuted()).toBe(false);
  });

  it("silently no-ops a save when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(() => saveMuted(true)).not.toThrow();
  });
});
