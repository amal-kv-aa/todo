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
    async play() {
      try {
        await audio.play();
        playing = true;
        fade(volume);
      } catch {
        playing = false;
      }
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
  let timer = 0;
  let playing = false;

  // A warm, slow progression (frequencies in Hz) — soft and romantic.
  // Chords voiced gently; one note plucked every beat, cycling through chords.
  const chords = [
    [261.63, 329.63, 392.0], // C major
    [220.0, 277.18, 329.63], // A minor
    [174.61, 261.63, 349.23], // F major
    [196.0, 246.94, 392.0], // G major
  ];
  let step = 0;

  function note(freq: number, time: number, gainPeak: number) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    // Soft bell-like envelope: gentle attack, long release.
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gainPeak, time + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 2.4);

    osc.connect(g).connect(master);
    osc.start(time);
    osc.stop(time + 2.6);
  }

  function schedule() {
    if (!ctx) return;
    const now = ctx.currentTime;
    const chord = chords[step % chords.length];
    // Root + a shimmer of the chord, softly staggered.
    note(chord[0] / 2, now, 0.18);
    chord.forEach((f, i) => note(f, now + 0.12 + i * 0.16, 0.12));
    // Occasional high sparkle.
    if (step % 2 === 0) note(chord[2] * 2, now + 0.5, 0.05);
    step++;
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
          // Soft low-pass for warmth.
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 2200;
          master.connect(filter).connect(ctx.destination);
        }
        await ctx.resume();
        playing = true;
        schedule();
        timer = window.setInterval(schedule, 2600);
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
