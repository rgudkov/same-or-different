import { describe, expect, it } from "vitest";
import { todayLocalDate } from "./today";

describe("todayLocalDate", () => {
  it("formats a date as local YYYY-MM-DD", () => {
    expect(todayLocalDate(new Date(2026, 6, 7))).toBe("2026-07-07");
  });

  it("pads single-digit months and days", () => {
    expect(todayLocalDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("defaults to the current date when none is given", () => {
    const now = new Date();
    const expected = todayLocalDate(now);
    expect(todayLocalDate()).toBe(expected);
  });
});
