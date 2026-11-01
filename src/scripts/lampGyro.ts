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
  // Sign flip applied when writing the transform. Needed for lamps inside a
  // horizontally-mirrored container (the right bouquet uses `scaleX(-1)`),
  // so both sides visually sway the same world direction under one gamma.
  flipSign: number;
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
  // The welcome arch uses `.lamp-pivot`; the invitation's top-corner bouquets
  // use `.bq-pivot`. Both are driven by the same pendulum simulation.
  const pivots = Array.from(
    document.querySelectorAll<SVGGElement>('.lamp-pivot, .bq-pivot'),
  );
  if (pivots.length === 0) return;

  // Respect reduced motion — do nothing, let the CSS fallback (also disabled
  // under reduced motion) decide.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const sims: LampSim[] = pivots.map((pivot) => {
    // Welcome-arch lamps carry a `.lamp-N` sibling class on their anchor
    // (`.lamp.lamp-1`), which keys into OMEGA_BY_INDEX. Bouquet lamps don't
    // — their short cord (~70 SVG units) maps to the same omega as a short
    // arch lamp, so fall through to 2.6.
    const lamp = pivot.closest('.lamp, .bq-lamp') as SVGGElement | null;
    const classes = lamp?.getAttribute('class') ?? '';
    const idxMatch = classes.match(/lamp-(\d)/);
    const omega = idxMatch
      ? OMEGA_BY_INDEX[idxMatch[1]] ?? 2.3
      : /\bbq-lamp\b/.test(classes) ? 2.6 : 2.3;
    const zeta = 0.09; // ~9% damping — enough overshoot to feel alive, settles quickly
    // Right bouquet is CSS-mirrored (`scaleX(-1)`); flip the applied angle
    // so both sides sway with the same world-direction phase.
    const flipSign = pivot.closest('.bouquet-right') ? -1 : 1;
    return { pivot, angle: 0, vel: 0, omega, damping: 2 * zeta * omega, flipSign };
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

  // iOS 13+ requires an explicit permission request made from a direct user
  // gesture. The automatic request-on-first-touch pattern is fragile there —
  // the native permission dialog often collides with the "Tap to open" gesture
  // and gets dismissed, or the user misses it. Instead we show an explicit
  // button so the permission grant is a deliberate, isolated action.
  const DOE = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<string>;
  };
  const needsPermission = typeof DOE.requestPermission === 'function';

  if (!needsPermission) {
    // Android / desktop with sensors: start listening immediately.
    startListener();
    return;
  }

  // iOS branch: DeviceOrientationEvent only exposes requestPermission on
  // secure contexts (HTTPS / localhost). If the page is served over plain
  // HTTP (e.g. visiting the dev server via LAN IP from the phone), the API
  // is gone and we should say so loudly in the console.
  if (!window.isSecureContext) {
    console.warn(
      '[lampGyro] DeviceOrientationEvent requires a secure context (HTTPS or localhost). ' +
        'Load this page over HTTPS to enable gyroscope-driven lamp motion on iOS.',
    );
    return;
  }

  // Visible one-tap "Enable motion" chip in the top-right (next to the music
  // toggle), only on iOS, only until permission is resolved.
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'motion-enable';
  btn.setAttribute('aria-label', 'Enable motion effects');
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">' +
    '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" ' +
    'stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
    '<span>Enable motion</span>';
  document.body.appendChild(btn);

  let asked = false;
  btn.addEventListener('click', () => {
    if (asked) return;
    asked = true;
    btn.disabled = true;
    // IMPORTANT: this call MUST be the direct result of a user gesture.
    // We invoke requestPermission inline (no await / no setTimeout) so iOS
    // sees the user-activation flag.
    DOE.requestPermission!()
      .then((response) => {
        console.log('[lampGyro] permission response:', response);
        if (response === 'granted') {
          startListener();
          btn.remove();
        } else {
          btn.textContent = 'Motion blocked';
          // Keep it visible so the user knows what happened; they can enable
          // it in iOS Settings → Safari → Motion & Orientation Access.
        }
      })
      .catch((err: unknown) => {
        console.warn('[lampGyro] requestPermission failed:', err);
        btn.disabled = false;
        asked = false;
        btn.textContent = 'Tap to retry';
      });
  });

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

      // One style write per lamp per frame. `flipSign` keeps mirrored-right
      // bouquet lamps swinging the same way visually as their left pair.
      s.pivot.style.transform = `rotate(${(s.angle * s.flipSign).toFixed(3)}deg)`;
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
