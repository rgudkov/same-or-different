// Today's local calendar date as "YYYY-MM-DD", per ADR 0001 (Daily mode is
// seeded by the player's local date, not UTC). Accepts an injectable `now` so
// tests can pin a specific date without mocking the system clock.
export function todayLocalDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
