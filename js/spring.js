/**
 * Spring physics.
 *
 * Parameterised the way Apple exposes springs to designers — damping ratio and
 * response — rather than mass/stiffness/damping, because those two map to what
 * you actually feel:
 *
 *   damping  1.0  critically damped, settles with no overshoot (default for UI)
 *            0.8  a little bounce — only earn this after a flick or a drag
 *   response  seconds to reach the target. Lower is snappier. NOT a duration:
 *            a spring has no fixed duration, settle time emerges from the params.
 *
 * The important property: re-targeting never resets velocity. That is what lets
 * a moving element be grabbed and reversed mid-flight without a visible seam.
 */

const TWO_PI = Math.PI * 2;

/* One RAF loop shared by every spring on the page. */
const active = new Set();
let frame = null;
let lastTime = 0;

function tick(now) {
  // Clamp dt so a backgrounded tab does not integrate a huge step and explode.
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
  lastTime = now;

  for (const spring of active) spring.step(dt);

  frame = active.size ? requestAnimationFrame(tick) : null;
  if (!frame) lastTime = 0;
}

function schedule() {
  if (frame === null) {
    lastTime = 0;
    frame = requestAnimationFrame(tick);
  }
}

export class Spring {
  constructor({ damping = 1, response = 0.4, value = 0, onUpdate, onRest } = {}) {
    this.value = value;
    this._target = value;
    this.velocity = 0;
    this.onUpdate = onUpdate;
    this.onRest = onRest;
    this.configure({ damping, response });

    this.restDelta = 0.01;
    this.restVelocity = 0.05;
  }

  configure({ damping, response }) {
    if (damping !== undefined) this.damping = damping;
    if (response !== undefined) this.response = response;
    const omega = TWO_PI / this.response;
    this.k = omega * omega;        // stiffness
    this.c = 2 * this.damping * omega; // damping coefficient
    return this;
  }

  get target() { return this._target; }

  /** Re-target without touching velocity — the whole point of using a spring. */
  set target(next) {
    if (next === this._target) return;
    this._target = next;
    active.add(this);
    schedule();
  }

  /** Jump instantly, killing momentum. For initialising, not for animating. */
  set(value) {
    this.value = value;
    this._target = value;
    this.velocity = 0;
    active.delete(this);
    this.onUpdate?.(this.value);
    return this;
  }

  /** Hand off a gesture's release velocity, in units per second. */
  impulse(velocity) {
    this.velocity = velocity;
    active.add(this);
    schedule();
    return this;
  }

  step(dt) {
    // Sub-step at a fixed rate so stiff springs stay stable on slow frames.
    const steps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / steps;

    for (let i = 0; i < steps; i++) {
      const accel = -this.k * (this.value - this._target) - this.c * this.velocity;
      this.velocity += accel * h;
      this.value += this.velocity * h;
    }

    const settled =
      Math.abs(this.velocity) < this.restVelocity &&
      Math.abs(this.value - this._target) < this.restDelta;

    if (settled) {
      this.value = this._target;
      this.velocity = 0;
      active.delete(this);
      this.onUpdate?.(this.value);
      this.onRest?.();
      return;
    }

    this.onUpdate?.(this.value);
  }

  stop() {
    this.velocity = 0;
    active.delete(this);
    return this;
  }
}

/**
 * Where a flick would come to rest, given its release velocity.
 *
 * This is Apple's projection function from the Designing Fluid Interfaces
 * sample code — exponential decay, the same model scroll deceleration uses.
 * Deliberately NOT the textbook v^2/(2a): that lands short and feels wrong.
 */
export function project(velocity, decelerationRate = 0.998) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary. The further you push, the less it
 * follows — real things slow before they stop. A hard stop reads as frozen.
 */
export function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Tracks recent pointer samples so release velocity is real, not a guess. */
export class VelocityTracker {
  constructor(window = 100) {
    this.window = window;
    this.samples = [];
  }

  add(value) {
    const now = performance.now();
    this.samples.push({ value, time: now });
    while (this.samples.length > 2 && now - this.samples[0].time > this.window) {
      this.samples.shift();
    }
  }

  /** Units per second across the retained window. */
  get velocity() {
    if (this.samples.length < 2) return 0;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const elapsed = (last.time - first.time) / 1000;
    if (elapsed <= 0) return 0;
    return (last.value - first.value) / elapsed;
  }

  reset() { this.samples.length = 0; }
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
