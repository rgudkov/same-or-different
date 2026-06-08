// High-score persistence via localStorage — the only thing the game remembers
// between sessions. All access is wrapped so a disabled/unavailable storage
// (private mode, quota errors) degrades to "no high score" rather than crashing.

const STORAGE_KEY = "set3x3.highScore";

// Returns the stored high score, or 0 when absent or unreadable.
export function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

// Persists `score` as the new high score. Silently no-ops if storage is
// unavailable.
export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    // Ignore: an unavailable store just means the high score isn't remembered.
  }
}
