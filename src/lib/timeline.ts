/**
 * The scroll timeline, as pure functions.
 *
 * Single source of truth for "what does the stage look like at progress p".
 * Imports only scalar maths and the stage geometry: no Three.js, no GSAP, no
 * React. GSAP writes exactly one number (progress) and everything here derives
 * from it, which is what stops two libraries writing the same property on the
 * same frame.
 */

import {
  LID_OPEN,
  LID_SQUARE,
  PANEL_CENTRE,
  SCREEN_FOV,
  SCREEN_STANDOFF,
} from "../config/stage";
import { easeInOutCubic, lerp, range, smoothstep } from "./math";

/**
 * The hero is one continuous move: a shut laptop lifts its lid, the greeting
 * comes up on the display, and the camera closes in until the panel fills the
 * viewport. The pin releases there and the projects follow.
 *
 * The camera stops at the panel rather than passing through it. That is the
 * whole difference from the version that restated the greeting full-screen: the
 * text does not get replaced by a second copy of itself, it simply grows into
 * place as the display approaches.
 */
export const PHASES = {
  rest: [0.0, 0.08],
  open: [0.08, 0.52],
  dolly: [0.52, 1.0],
} as const;

export type Phase = keyof typeof PHASES;

export function phaseAt(p: number): Phase {
  if (p < PHASES.open[0]) return "rest";
  if (p < PHASES.dolly[0]) return "open";
  return "dolly";
}

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

export type CameraState = { x: number; y: number; z: number; fov: number };

const REST: CameraState = { x: 0, y: 3.4, z: 5.2, fov: 45 };
const FRONT: CameraState = { x: 0, y: 0.55, z: 4.6, fov: 45 };

/**
 * Derived, not tuned: SCREEN_STANDOFF is the distance at which the panel covers
 * SCREEN_FILL of the frame height. The dolly stops short of a full-bleed screen,
 * so the bezel stays in shot and it still reads as a laptop.
 */
const SCREEN: CameraState = {
  x: 0,
  y: PANEL_CENTRE.y,
  z: PANEL_CENTRE.z + SCREEN_STANDOFF,
  fov: SCREEN_FOV,
};

export function cameraAt(p: number): CameraState {
  if (p < PHASES.open[0]) return { ...REST };

  if (p < PHASES.open[1]) {
    const t = easeInOutCubic(range(p, PHASES.open[0], PHASES.open[1]));
    return {
      x: lerp(REST.x, FRONT.x, t),
      y: lerp(REST.y, FRONT.y, t),
      z: lerp(REST.z, FRONT.z, t),
      fov: lerp(REST.fov, FRONT.fov, t),
    };
  }

  const t = easeInOutCubic(range(p, PHASES.dolly[0], PHASES.dolly[1]));
  return {
    x: lerp(FRONT.x, SCREEN.x, t),
    y: lerp(FRONT.y, SCREEN.y, t),
    z: lerp(FRONT.z, SCREEN.z, t),
    fov: lerp(FRONT.fov, SCREEN.fov, t),
  };
}

/** Aim lifts off the chassis and settles on the panel centre as it fills. */
export function lookAtAt(p: number) {
  if (p < PHASES.dolly[0]) {
    const t = smoothstep(range(p, PHASES.open[0], PHASES.open[1]));
    return { x: 0, y: PANEL_CENTRE.y * lerp(0.35, 0.6, t), z: -0.2 };
  }
  const t = smoothstep(range(p, PHASES.dolly[0], PHASES.dolly[1]));
  return {
    x: 0,
    y: lerp(PANEL_CENTRE.y * 0.6, PANEL_CENTRE.y, t),
    z: lerp(-0.2, PANEL_CENTRE.z, t),
  };
}

/* ------------------------------------------------------------------ */
/* Laptop                                                              */
/* ------------------------------------------------------------------ */

/**
 * Lid angle in radians. 0 is fully shut, which is where the experience starts.
 * It opens past vertical to LID_OPEN, then squares up to LID_SQUARE as the
 * camera closes in, so the panel is face-on by the time it fills the frame.
 * Without that squaring the display keeps a visible keystone at full zoom.
 */
export function lidAngleAt(p: number): number {
  if (p < PHASES.open[0]) return 0;
  if (p < PHASES.open[1]) {
    return LID_OPEN * easeInOutCubic(range(p, PHASES.open[0], PHASES.open[1]));
  }
  const t = easeInOutCubic(range(p, PHASES.dolly[0], PHASES.dolly[1]));
  return lerp(LID_OPEN, LID_SQUARE, t);
}

/**
 * How far into the dolly the greeting keeps the display.
 *
 * The greeting owns the whole of the lid coming up and then the first stretch
 * of the push in, so it is on screen for most of the pinned hero rather than
 * for a moment at the top of it. Starting the film here rather than at the
 * phase boundary also buys the film something: its graph is dense, and by this
 * point the panel is close enough for the labels to be read rather than merely
 * seen.
 */
const INTRO_DOLLY_FRACTION = 0.34;

/** Where the screen stops greeting and starts playing. */
export const INTRO_START: number = lerp(PHASES.dolly[0], PHASES.dolly[1], INTRO_DOLLY_FRACTION);

/** Idle yaw while shut, easing to square-on as the lid rises. */
export function laptopYawAt(p: number, elapsed: number): number {
  const settle = 1 - easeInOutCubic(range(p, PHASES.open[0], PHASES.open[1]));
  return Math.sin(elapsed * 0.25) * 0.22 * settle;
}

export function laptopFloatAt(p: number, elapsed: number): number {
  const settle = 1 - easeInOutCubic(range(p, PHASES.open[0], PHASES.open[1]));
  return Math.sin(elapsed * 0.5) * 0.05 * settle;
}

/**
 * The chassis stays solid for the whole hero. It used to dissolve during the
 * handoff to leave only space behind; kept as a function, rather than inlined
 * as 1, so the call sites stay honest and a dissolve is easy to reinstate.
 */
export function laptopOpacityAt(_p: number): number {
  return 1;
}

/**
 * The greeting painted on the display.
 *
 * Up as soon as the panel turns far enough toward the camera to be legible,
 * held for the rest of the opening, and cleared when the screen boots into the
 * film at INTRO_START. The two never share the display: the greeting is the
 * machine waking, the film is what it wakes into, and the film's closing
 * statement is what the viewer leaves on.
 */
export function screenTextOpacityAt(p: number): number {
  const up = smoothstep(range(p, PHASES.open[0] + 0.06, PHASES.open[0] + 0.2));
  return up * (1 - smoothstep(range(p, INTRO_START, INTRO_START + 0.04)));
}

/**
 * The film on the display, which starts once the lid is INTRO_LID_FRACTION
 * open. It crosses over the greeting rather than cutting: the fade is short,
 * because a slow one would read as two things overlapping rather than as one
 * screen changing what it shows.
 */
export function introOpacityAt(p: number): number {
  return smoothstep(range(p, INTRO_START, INTRO_START + 0.05));
}

/* ------------------------------------------------------------------ */
/* Starfield                                                           */
/* ------------------------------------------------------------------ */

/**
 * The field is the backdrop for the whole hero, not something the display wakes
 * up, so it is already lit before the lid moves: starting from black would give
 * the opening frames an empty void around the laptop. It settles early and then
 * holds, and the small lift across the dolly keeps it from going flat as the
 * chassis grows and covers more of the frame.
 */
export function starBrightnessAt(p: number): number {
  const rise = smoothstep(range(p, 0.0, PHASES.open[0] + 0.1)) * 0.62;
  const lift = smoothstep(range(p, PHASES.dolly[0], PHASES.dolly[1])) * 0.22;
  return rise + lift;
}

/* ------------------------------------------------------------------ */
/* Overlay                                                             */
/* ------------------------------------------------------------------ */

export function scrollHintOpacityAt(p: number): number {
  return 1 - range(p, 0.02, 0.12);
}
