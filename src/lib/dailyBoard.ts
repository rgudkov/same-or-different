// Deterministic board generation for Daily mode: the same local calendar date
// always maps to the same board (per ADR 0001 — seeded by the player's local
// date, not UTC). Feeds the existing `generateBoard(random)` unchanged; this
// module only supplies a deterministic `random` source in its place.

import type { Board } from "./board";
import { generateBoard } from "./board";

// Hashes a "YYYY-MM-DD" date string into a 32-bit seed. djb2, a small
// well-distributed string hash — any change to the date string (even by a
// single day) scrambles the seed.
function hashDate(dateLocal: string): number {
  let hash = 5381;
  for (let i = 0; i < dateLocal.length; i++) {
    hash = (hash * 33) ^ dateLocal.charCodeAt(i);
  }
  return hash >>> 0;
}

// A small, fast PRNG (mulberry32) seeded from a 32-bit integer, producing
// floats in [0, 1) compatible with `generateBoard`'s `random` parameter.
// Deterministic: the same seed always produces the same sequence.
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Converts a local-date string ("YYYY-MM-DD") into a deterministic random
// source usable as `generateBoard`'s `random` argument.
export function randomFromDate(dateLocal: string): () => number {
  return mulberry32(hashDate(dateLocal));
}

// Generates the Daily puzzle board for a given local calendar date: always the
// same board for the same date, and (in the common case) a different board for
// a different date.
export function generateDailyBoard(dateLocal: string): Board {
  return generateBoard(randomFromDate(dateLocal));
}
