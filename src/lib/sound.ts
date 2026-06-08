// Feedback sounds synthesized with the Web Audio API — no audio files shipped,
// so the game stays small and fully offline. Each outcome maps to a short
// oscillator tone (or two). All access is guarded so environments without an
// AudioContext (e.g. jsdom in tests) or with audio disabled simply stay silent.

import type { Outcome } from "./game";

// One note in a cue: a waveform, frequency, and timing relative to cue start.
type Note = {
  type: OscillatorType;
  freq: number;
  // Seconds from the cue's start at which this note begins.
  start: number;
  // How long the note sounds, in seconds.
  duration: number;
};

// Per-outcome cues. Positive events rise; negative events use a lower, blunter
// tone so right and wrong are distinguishable without looking.
const CUES: Record<Outcome, Note[]> = {
  // Bright two-note rise for a found set.
  set: [
    { type: "sine", freq: 660, start: 0, duration: 0.1 },
    { type: "sine", freq: 880, start: 0.09, duration: 0.12 },
  ],
  // Neutral single blip: it counted for nothing, so neither reward nor scold.
  "already-found": [{ type: "triangle", freq: 440, start: 0, duration: 0.12 }],
  // Low buzzer for a wrong selection.
  "not-set": [{ type: "sawtooth", freq: 160, start: 0, duration: 0.22 }],
  // Triumphant three-note arpeggio for clearing the board.
  "complete-correct": [
    { type: "sine", freq: 523, start: 0, duration: 0.11 },
    { type: "sine", freq: 659, start: 0.1, duration: 0.11 },
    { type: "sine", freq: 784, start: 0.2, duration: 0.16 },
  ],
  // Same low buzzer family as a wrong set: a premature Complete is a mistake.
  "complete-wrong": [{ type: "sawtooth", freq: 140, start: 0, duration: 0.28 }],
};

// Peak gain per note — kept well below 1 so the synthesized tones aren't harsh.
const PEAK_GAIN = 0.18;

// Minimal slice of the Web Audio constructor we rely on; avoids depending on lib
// DOM's full typing while still being type-safe about what we call.
type AudioContextCtor = new () => AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

// Lazily created and reused: browsers limit how many contexts a page may open,
// and one shared context is enough for these short cues.
let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (context) return context;
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  try {
    context = new Ctor();
    return context;
  } catch {
    return null;
  }
}

// Plays the cue for `outcome`. No-ops when muted or when audio is unavailable, so
// callers never need to feature-detect. Each note gets its own oscillator and a
// short attack/release envelope to avoid clicks.
export function playOutcome(outcome: Outcome, muted: boolean): void {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  // Autoplay policies suspend the context until a user gesture; resume on the
  // first play (which is itself triggered by a tap/click).
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;
  for (const note of CUES[outcome]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = note.type;
    osc.frequency.value = note.freq;

    const startAt = now + note.start;
    const endAt = startAt + note.duration;
    // Quick ramp up and down so notes don't click on/off.
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(PEAK_GAIN, startAt + 0.01);
    gain.gain.linearRampToValueAtTime(0, endAt);

    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(endAt);
  }
}
