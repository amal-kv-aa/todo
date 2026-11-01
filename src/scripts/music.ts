// ─────────────────────────────────────────────────────────────────────────────
// Background-music controller.
//
// If the couple configured an audio file, it is played (with graceful fades).
// Otherwise a gentle, generative ambient melody is synthesised with the Web
// Audio API — so the invitation has tasteful music with no external file or
// dependency, and nothing ever plays before the guest's first interaction.
// ─────────────────────────────────────────────────────────────────────────────

export interface MusicController {
  play(): Promise<void>;
  pause(): void;
  isPlaying(): boolean;
}

const FADE_MS = 1100;

function createFileController(src: string, volume: number): MusicController {
  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;
  // Surface decode / network errors in devtools so a dead track is visible.
  audio.addEventListener('error', () => {
    const err = audio.error;
    console.warn('[music] audio element error:', err?.code, err?.message, src);
  });
  // Kick off loading immediately so the file is ready when the user taps.
  try { audio.load(); } catch { /* non-fatal */ }

  let playing = false;
  let raf = 0;

  function fade(to: number, done?: () => void) {
    cancelAnimationFrame(raf);
    const from = audio.volume;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS);
      audio.volume = from + (to - from) * t;
      if (t < 1) raf = requestAnimationFrame(step);
      else done?.();
    };
    raf = requestAnimationFrame(step);
  }

  return {
    // NOT async — critical. `audio.play()` must be invoked synchronously from
    // the user-gesture call stack on mobile browsers (iOS Safari especially).
    // Returning the promise lets the caller `await` it without breaking the
    // gesture-attribution chain.
    play(): Promise<void> {
      const p = audio.play();
      return p.then(
        () => {
          playing = true;
          fade(volume);
        },
        (err) => {
          playing = false;
          console.warn('[music] audio.play() rejected:', err?.name, err?.message || err);
        },
      );
    },
    pause() {
      playing = false;
      fade(0, () => audio.pause());
    },
    isPlaying: () => playing,
  };
}

function createGenerativeController(volume: number): MusicController {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let droneGain: GainNode | null = null;
  let droneOsc1: OscillatorNode | null = null;
  let droneOsc2: OscillatorNode | null = null;
  let timer = 0;
  let playing = false;

  // Raag Yaman — a bright evening raga commonly heard at Indian weddings:
  //   Sa  Re  Ga  Ma#  Pa  Dha  Ni  Sa'
  //   C   D   E   F#   G   A    B   C'   (one octave; we extend ±1 octave)
  const yaman: number[] = (() => {
    const base = [261.63, 293.66, 329.63, 369.99, 392.0, 440.0, 493.88];
    return [
      ...base.map((f) => f / 2), // lower octave
      ...base,
      ...base.map((f) => f * 2), // upper octave
    ];
  })();

  // Flowing melodic phrases — indices into `yaman`. Chosen to curve up and
  // down gracefully rather than march; last beat of each phrase lands on a
  // "rest" tone (Sa or Pa) for a sense of resolution.
  const phrases: number[][] = [
    [7, 9, 11, 9, 7, 9, 11, 7],       // Sa Ga Pa Ga Sa Ga Pa Sa
    [9, 11, 12, 11, 9, 7, 9, 11],     // Ga Pa Dha Pa Ga Sa Ga Pa
    [11, 12, 13, 12, 11, 9, 11, 7],   // Pa Dha Ni Dha Pa Ga Pa Sa
    [14, 13, 12, 11, 9, 7, 9, 7],     // Sa' Ni Dha Pa Ga Sa Ga Sa (descend)
  ];
  let phraseIx = 0;
  let noteIx = 0;

  // One plucked note — two slightly detuned triangle oscillators layered for
  // warmth (sitar-adjacent timbre, kept soft so it never gets harsh). The
  // envelope is gentle-attack / long-tail, so overlapping notes blur into a
  // continuous shimmer like an open-string instrument.
  function pluck(freq: number, time: number, gainPeak: number, release = 2.6) {
    if (!ctx || !master) return;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const g = ctx.createGain();
    osc1.type = 'triangle';
    osc2.type = 'triangle';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.004; // tiny detune — adds chorus warmth
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gainPeak, time + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, time + release);
    osc1.connect(g);
    osc2.connect(g);
    g.connect(master);
    osc1.start(time); osc1.stop(time + release + 0.1);
    osc2.start(time); osc2.stop(time + release + 0.1);
  }

  // One beat of music: pluck the next scale degree, step through the phrase.
  function schedule() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const phrase = phrases[phraseIx % phrases.length];
    const degree = phrase[noteIx % phrase.length];
    pluck(yaman[degree], t, 0.11);
    // Soft octave sparkle on the "sam" (first beat) of each new phrase.
    if (noteIx % phrase.length === 0) {
      pluck(yaman[degree] * 2, t + 0.06, 0.04, 2.2);
    }
    noteIx++;
    if (noteIx % phrase.length === 0) {
      noteIx = 0;
      phraseIx++;
    }
  }

  function fadeMaster(to: number, done?: () => void) {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(to, now + FADE_MS / 1000);
    if (done) window.setTimeout(done, FADE_MS);
  }

  return {
    async play() {
      try {
        if (!ctx) {
          ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          master = ctx.createGain();
          master.gain.value = 0;
          // Low-pass for warmth; keep the top end gentle.
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 2400;
          master.connect(filter).connect(ctx.destination);

          // Tanpura-style drone: a sustained root (Sa = C) + fifth (Pa = G)
          // at low volume, giving every melodic phrase a quiet harmonic bed.
          droneGain = ctx.createGain();
          droneGain.gain.value = 0.045;
          droneOsc1 = ctx.createOscillator();
          droneOsc2 = ctx.createOscillator();
          droneOsc1.type = 'sine';
          droneOsc2.type = 'sine';
          droneOsc1.frequency.value = 130.81;    // Sa (C3)
          droneOsc2.frequency.value = 196.0;     // Pa (G3)
          droneOsc1.connect(droneGain);
          droneOsc2.connect(droneGain);
          droneGain.connect(master);
          droneOsc1.start();
          droneOsc2.start();
        }
        await ctx.resume();
        playing = true;
        schedule();
        // ~1.5s per beat — slower than before, feels more ceremonial.
        timer = window.setInterval(schedule, 1500);
        fadeMaster(volume);
      } catch {
        playing = false;
      }
    },
    pause() {
      playing = false;
      window.clearInterval(timer);
      fadeMaster(0, () => {
        if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
      });
    },
    isPlaying: () => playing,
  };
}

export function createMusicController(src: string, volume: number): MusicController {
  return src ? createFileController(src, volume) : createGenerativeController(volume);
}
