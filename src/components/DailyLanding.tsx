// The screen shown when today's Daily has not yet been completed: a Start
// button into the Daily puzzle, plus a link to Timed mode for a player who
// wants a clock instead.
export function DailyLanding({
  onStart,
  onPlayTimed,
}: {
  onStart: () => void;
  onPlayTimed: () => void;
}) {
  return (
    <main className="app daily-landing">
      <h1 className="title">Daily</h1>
      <p className="daily-lead">
        One board, once a day, the same for everyone. Find every set to keep
        your streak going.
      </p>
      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={onStart}>
          Start
        </button>
        <button type="button" className="btn btn--link" onClick={onPlayTimed}>
          Play Timed mode instead
        </button>
      </div>
    </main>
  );
}
