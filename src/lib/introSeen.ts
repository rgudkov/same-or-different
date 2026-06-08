// Intro-seen persistence via localStorage, mirroring mute.ts. Records whether
// the player has stepped through the onboarding intro to its end at least once.
// Wrapped so an unavailable store (private mode, quota errors) degrades to "not
// seen" — a returning player simply gets the intro again rather than a crash.

const STORAGE_KEY = "sod.introSeen";

// Returns whether the intro has been seen, defaulting to false (not seen).
export function loadIntroSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

// Records that the intro has been seen. Silently no-ops if storage is
// unavailable.
export function saveIntroSeen(seen: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(seen));
  } catch {
    // Ignore: an unavailable store just means the flag isn't remembered.
  }
}
