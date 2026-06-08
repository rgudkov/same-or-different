import { afterEach, describe, expect, it, vi } from "vitest";
import { loadIntroSeen, saveIntroSeen } from "./introSeen";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("introSeen", () => {
  it("defaults to not seen when nothing is stored", () => {
    expect(loadIntroSeen()).toBe(false);
  });

  it("round-trips a saved flag", () => {
    saveIntroSeen(true);
    expect(loadIntroSeen()).toBe(true);
  });

  it("can be reset back to not seen", () => {
    saveIntroSeen(true);
    saveIntroSeen(false);
    expect(loadIntroSeen()).toBe(false);
  });

  it("degrades to not seen when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(loadIntroSeen()).toBe(false);
  });

  it("silently no-ops a save when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(() => saveIntroSeen(true)).not.toThrow();
  });
});
