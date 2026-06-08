// The landing screen: title, Play, and a concise how-to + scoring summary.
export function Home({ onPlay }: { onPlay: () => void }) {
  return (
    <main className="app home">
      <h1 className="title">Same or Different</h1>

      <button type="button" className="btn btn--primary" onClick={onPlay}>
        Play
      </button>

      <section className="how-to" aria-label="How to play">
        <h2 className="how-to-title">How to play</h2>
        <p>
          Tap three cells that form a <strong>set</strong>: for each of the three
          attributes — background color, shape, and shape color — the values must
          be either all the same or all different. Find as many sets as you can
          before the timer runs out.
        </p>
        <ul className="scoring">
          <li>Valid set: +1</li>
          <li>Not a set: −1</li>
          <li>Already found: 0</li>
          <li>Correct Complete (all sets found): +3</li>
          <li>Wrong Complete: −1</li>
        </ul>
      </section>
    </main>
  );
}
