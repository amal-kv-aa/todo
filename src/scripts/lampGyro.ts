// ─────────────────────────────────────────────────────────────────────────────
// Gyroscope-driven lamp swing: each hanging lamp is simulated as a damped
// pendulum whose rest target is driven by the device's left-right tilt (gamma).
// The feel is "the phone is a room, the lamps hang in that room" — tilt the
// phone and the lamps lean opposite the tilt, oscillating with their own
// natural frequency, then settle back to rest when the device is still.
//
// Why a spring-around-target model instead of simulating gravity directly?
// Because the device gives us tilt, not translational acceleration. The target
// model gives natural overshoot/settle, lets each lamp carry its own period
// (long cord = slow swing), and gracefully returns to zero when input stops.
// ─────────────────────────────────────────────────────────────────────────────

interface LampSim {
  pivot: SVGGElement;
  angle: number;    // current rotation, degrees
  vel: number;      // angular velocity, degrees per second
  omega: number;    // natural angular frequency, rad/s (sqrt(k))
  damping: number;  // 2·ζ·ω — slightly under-damped for a soft overshoot
}

// Natural frequencies tuned to the visible cord lengths. Longer cord → lower
// frequency → slower swing, matching physical pendulum intuition.
const OMEGA_BY_INDEX: Record<string, number> = {
  '1': 2.6, // short cord (70)
  '5': 2.6,
  '2': 2.2, // medium cord (110)
  '4': 2.2,
  '3': 1.9, // long cord (145)
};

const CLAMP_ANGLE = 32;    // deg — hard limit so wild shakes can't fling the lamp
const CLAMP_VEL = 480;     // deg/s — stability bound on the integrator
const TARGET_COUPLING = 0.55; // how strongly phone tilt pulls the lamp (lower = calmer)
const INPUT_LPF = 0.18;    // low-pass smoothing per frame on raw gamma (0..1)
const IDLE_DECAY = 0.045;  // how fast gamma drifts back to 0 when device is still
const IDLE_TIMEOUT_MS = 350; // after this long with no new reading, start decaying

export function initLampGyro(): void {
  const pivots = Array.from(document.querySelectorAll<SVGGElement>('.lamp-pivot'));
  if (pivots.length === 0) return;

  // Respect reduced motion — do nothing, let the CSS fallback (also disabled
  // under reduced motion) decide.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const sims: LampSim[] = pivots.map((pivot) => {
    const lamp = pivot.closest('.lamp') as SVGGElement | null;
    const classes = lamp?.getAttribute('class') ?? '';
    const idx = (classes.match(/lamp-(\d)/) ?? ['', '3'])[1];
    const omega = OMEGA_BY_INDEX[idx] ?? 2.3;
    const zeta = 0.09; // ~9% damping — enough overshoot to feel alive, settles quickly
    return { pivot, angle: 0, vel: 0, omega, damping: 2 * zeta * omega };
  });

  // ── Device input state ────────────────────────────────────────────────────
  let gammaRaw = 0;      // most recent raw gamma from the sensor
  let gammaSmooth = 0;   // low-pass filtered gamma used as the drive signal
  let lastInputMs = 0;   // last time we got a non-null gamma reading
  let gyroLive = false;  // flipped on when at least one sample lands

  function onOrientation(e: DeviceOrientationEvent) {
    // gamma = left-right tilt, −90..90 (positive = right side down)
    const g = e.gamma;
    if (g == null || !Number.isFinite(g)) return;
    gammaRaw = g;
    lastInputMs = performance.now();
    if (!gyroLive) {
      gyroLive = true;
      // Signal to CSS so the keyframe sway stops and JS takes over.
      document.body.setAttribute('data-gyro-active', '');
    }
  }

  function startListener() {
    // Prefer the modern `deviceorientationabsolute` on Android where available
    // for a stable frame, but fall back to the plain event. We're only reading
    // gamma, which is relative-tilt around the device y-axis and is reliable
    // on both.
    window.addEventListener('deviceorientation', onOrientation, { passive: true });
  }

  // iOS 13+ requires an explicit permission request made from a user gesture.
  // We hook it to the very first touch/pointer so the lamps are already live
  // before the user taps the "open invitation" button.
  const needsPermission =
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function';

  if (needsPermission) {
    const requestOnce = () => {
      document.removeEventListener('touchstart', requestOnce);
      document.removeEventListener('pointerdown', requestOnce);
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .then((response) => {
          if (response === 'granted') startListener();
        })
        .catch(() => { /* permission denied — CSS keyframe sway continues */ });
    };
    document.addEventListener('touchstart', requestOnce, { once: true, passive: true });
    document.addEventListener('pointerdown', requestOnce, { once: true, passive: true });
  } else {
    startListener();
  }

  // ── Integration loop ──────────────────────────────────────────────────────
  // Semi-implicit Euler: cheap, stable for lightly-damped springs, 60 Hz.
  let last = performance.now();
  let rafId = 0;
  let running = true;

  function step(now: number) {
    rafId = requestAnimationFrame(step);
    let dt = (now - last) / 1000;
    last = now;
    // Clamp dt so tab-switches / slow frames don't blow up the integrator.
    if (dt > 0.05) dt = 0.05;
    if (dt <= 0) return;

    // Smooth the raw gamma to kill high-frequency sensor jitter.
    gammaSmooth += (gammaRaw - gammaSmooth) * INPUT_LPF;

    // When no fresh reading arrives, bleed gamma back to zero so the lamps
    // naturally return to rest (also handles the "device is still" case).
    if (now - lastInputMs > IDLE_TIMEOUT_MS) {
      gammaRaw += (0 - gammaRaw) * IDLE_DECAY;
    }

    // Lamps lean OPPOSITE the phone tilt (the room's gravity still points
    // down; from the screen's frame the lamps appear to swing the other way).
    const targetDeg = -gammaSmooth * TARGET_COUPLING;

    for (const s of sims) {
      const k = s.omega * s.omega;
      // damped driven oscillator: θ'' = -k(θ-target) - c·θ'
      const accel = -k * (s.angle - targetDeg) - s.damping * s.vel;
      s.vel += accel * dt;
      // Numerical stability clamps.
      if (s.vel > CLAMP_VEL) s.vel = CLAMP_VEL;
      else if (s.vel < -CLAMP_VEL) s.vel = -CLAMP_VEL;
      s.angle += s.vel * dt;
      if (s.angle > CLAMP_ANGLE) { s.angle = CLAMP_ANGLE; s.vel *= -0.3; }
      else if (s.angle < -CLAMP_ANGLE) { s.angle = -CLAMP_ANGLE; s.vel *= -0.3; }

      // One style write per lamp per frame.
      s.pivot.style.transform = `rotate(${s.angle.toFixed(3)}deg)`;
    }
  }

  rafId = requestAnimationFrame((t) => { last = t; step(t); });

  // Pause when the tab is hidden so we don't drain battery on backgrounded tabs.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(rafId);
    } else if (!running) {
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(step);
    }
  });
}
