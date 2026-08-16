/** Scalar helpers. No dependencies, no side effects. */

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Normalise v to 0..1 within [a,b], clamped. */
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** expo.out, the easing ui-ux-pro-max specifies for this visual style. */
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const smoothstep = (t: number) => t * t * (3 - 2 * t);

export const DEG = Math.PI / 180;
