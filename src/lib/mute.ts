// Mute-preference persistence via localStorage, mirroring highScore.ts. Wrapped
// so an unavailable store (private mode, quota errors) degrades to "not muted"
// rather than crashing.

const STORAGE_KEY = "set3x3.muted";

// Returns the stored mute preference, defaulting to false (sound on).
export function loadMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

// Persists the mute preference. Silently no-ops if storage is unavailable.
export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(muted));
  } catch {
    // Ignore: an unavailable store just means the preference isn't remembered.
  }
}
