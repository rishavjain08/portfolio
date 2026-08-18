/**
 * Stage geometry.
 *
 * Every camera constant in lib/timeline.ts is derived from the numbers here.
 * Change a chassis dimension and the camera path follows automatically, which
 * is the point: the framing arithmetic lives in one place instead of being
 * hand-tuned per phase.
 */

export type LaptopVariant = "model" | "procedural";

export const stage = {
  /**
   * "procedural" Built from primitives. Slim aluminium wedge. Default.
   * "model"      Poly Haven `classic_laptop` (CC0). Vintage beige, and a
   *              genuinely thick machine: 0.101 base on 0.652 width, a 15%
   *              thickness ratio. It cannot be made sleek without distorting
   *              the geometry, so it is opt-in.
   */
  variant: "procedural" as LaptopVariant,

  /**
   * Built from BASE_URL rather than written as "/models/...". Vite rewrites
   * asset URLs it can see at build time, but this one is a plain string handed
   * to a loader at runtime, so nothing would have rewritten it and it would
   * still request the domain root once the app moved under /portfolio/.
   *
   * Loaded regardless of `variant`: ModelLaptop preloads it on import.
   */
  modelUrl: `${import.meta.env.BASE_URL}models/classic_laptop/classic_laptop_2k.gltf`,

  /**
   * Length of the pinned hero, in viewports.
   *
   * The timeline scrubs across (scrollPages - 1) viewports of scrolling. The
   * act runs shut lid to open lid to panel filling the frame, so it gets 1.6
   * viewports: the dolly needs room or the zoom reads as a jump cut.
   */
  scrollPages: 2.6,
} as const;

const DEG = Math.PI / 180;

/* ------------------------------------------------------------------ */
/* Procedural chassis                                                  */
/* ------------------------------------------------------------------ */

/**
 * Slim wedge proportions. A 15" MacBook Pro is roughly 1.56cm thick on a 35.6cm
 * body, a ratio of 0.044; the base below is 0.075 on 2.4, or 0.031, so it reads
 * slightly slimmer than reality, which is what "sleek" wants at this scale.
 *
 * Bezels are 0.05 at the sides and 0.045 top and bottom. The corner radii are a
 * large fraction of each part's thickness, so the edges read as machined
 * chamfers rather than as rounded boxes.
 */
/**
 * A 15" MacBook Pro is 1.56cm thick on a 35.6cm body: a ratio of 0.044. At
 * 2.4 units wide that is 0.105, which is what BASE.h below is. The previous
 * 0.075 read as a sheet of paper with no chassis; the Poly Haven model at
 * 0.155 read as a brick. This is the real proportion.
 */
const BASE = { w: 2.4, h: 0.105, d: 1.66 };
const LID = { w: 2.4, h: 1.5, d: 0.05 };
/** Even 0.05 bezel on three sides, thicker chin at the bottom, as on a real one. */
const BEZEL = { side: 0.05, top: 0.05, chin: 0.11 };
const PANEL = {
  w: LID.w - BEZEL.side * 2,
  h: LID.h - BEZEL.top - BEZEL.chin,
};
/** The panel sits above lid centre because the chin is deeper than the top. */
const PANEL_SHIFT_Y = (BEZEL.chin - BEZEL.top) / 2;

/**
 * Deck width leaves a real margin either side. At 1.92 the keyboard filled 80%
 * of the body and left no honest room for speakers; a MacBook keyboard is
 * closer to 74% of chassis width.
 */
const DECK = { w: 1.78, d: 0.72, z: -0.24 };

/** Grille runs from just outside the keyboard well to just inside the edge. */
const WELL_HALF = (DECK.w + 0.06) / 2;
const GRILLE_INNER = WELL_HALF + 0.05;
const GRILLE_OUTER = BASE.w / 2 - 0.09;

export const PROCEDURAL = {
  base: BASE,
  lid: LID,
  panel: PANEL,
  bezel: BEZEL,
  /**
   * Hinge, in world space, on the centre line of the barrel so the lid pivots
   * flush against the back of the base with no floating gap.
   */
  hinge: { x: 0, y: BASE.h / 2, z: -BASE.d / 2 + BASE.h / 2 },
  /** Panel centre offset from the hinge, along the lid's local axes. */
  panelOffset: { y: LID.h / 2 + PANEL_SHIFT_Y, z: LID.d / 2 + 0.002 },
  /** Where the panel sits inside the lid, relative to lid centre. */
  panelShiftY: PANEL_SHIFT_Y,
  /** Chamfer radii, sized against each part's own thickness. */
  radius: { base: BASE.h * 0.42, lid: LID.d * 0.45 },
  /** Keyboard deck footprint, inset into the top of the base. */
  deck: DECK,
  trackpad: { w: 0.74, d: 0.48, z: 0.42 },
  /**
   * Speaker grilles fill the gap between the keyboard well and the chassis
   * edge, derived rather than offset by hand. The previous value put the outer
   * edge at 1.22 against a 1.20 half-width, so each grille hung 0.02 off the
   * side of the machine.
   */
  grille: {
    w: GRILLE_OUTER - GRILLE_INNER,
    x: (GRILLE_OUTER + GRILLE_INNER) / 2,
    d: DECK.d * 0.86,
    z: DECK.z,
  },
} as const;

/* ------------------------------------------------------------------ */
/* Poly Haven model                                                    */
/* ------------------------------------------------------------------ */

/**
 * Measured from the glTF accessor bounds, in metres:
 *
 *   keyboard_low      0.652 W x 0.101 H x 0.486 D   the base
 *   lid_floaters_low  0.649 W x 0.466 H x 0.052 D   the lid, authored UPRIGHT
 *   panel primitive   0.448 W x 0.367 H x 0     D   the display surface
 *
 * The model has no hinge rig: `classic_laptop_screen` is a sibling node, not a
 * child of the base. Its own origin sits at the hinge line, so rotating that
 * node about X is enough once we know which way is shut.
 */
export const MODEL_RAW = {
  baseWidth: 0.652,
  hinge: { x: 0, y: 0.088, z: -0.213 },
  /** Panel centre, in lid-local space, measured from the hinge. */
  panelLocal: { y: (0.058 + 0.425) / 2, z: 0.006 },
  panelHeight: 0.425 - 0.058,
  panelWidth: 0.448,
} as const;

/** Scale the model so its base matches the procedural chassis width. */
export const MODEL_SCALE = PROCEDURAL.base.w / MODEL_RAW.baseWidth;

export const MODEL = {
  scale: MODEL_SCALE,
  hinge: {
    x: MODEL_RAW.hinge.x * MODEL_SCALE,
    y: MODEL_RAW.hinge.y * MODEL_SCALE,
    z: MODEL_RAW.hinge.z * MODEL_SCALE,
  },
  panelLocal: {
    y: MODEL_RAW.panelLocal.y * MODEL_SCALE,
    z: MODEL_RAW.panelLocal.z * MODEL_SCALE,
  },
  panelHeight: MODEL_RAW.panelHeight * MODEL_SCALE,
  panelWidth: MODEL_RAW.panelWidth * MODEL_SCALE,
  /**
   * The model is authored with the lid open and vertical, so its rest pose is
   * our "90 degrees". rotation.x = +90deg folds it shut; a 105deg open lid is
   * rotation.x = -15deg.
   */
  closedRotationX: 90 * DEG,
} as const;

/* ------------------------------------------------------------------ */
/* Derived framing                                                     */
/* ------------------------------------------------------------------ */

const active = stage.variant === "model" ? MODEL : null;

/** Lid angle at which the panel is square to the camera. */
export const LID_SQUARE = 92 * DEG;
/** Lid angle at rest once open, before it squares up. */
export const LID_OPEN = 105 * DEG;

/**
 * Where the panel centre ends up in world space once the lid has squared up.
 * Rotating the lid-local panel offset about X by (LID_SQUARE - 90deg).
 */
function panelCentre() {
  /**
   * Both laptop variants use rotation.x = 90deg - lidAngle, so a 92deg lid is
   * rotation.x = -2deg. The panel offset is rotated by that same signed angle.
   */
  const theta = Math.PI / 2 - LID_SQUARE;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);

  const hinge = active ? active.hinge : PROCEDURAL.hinge;
  const local = active ? active.panelLocal : PROCEDURAL.panelOffset;

  return {
    x: 0,
    y: hinge.y + (local.y * cos - local.z * sin),
    z: hinge.z + (local.y * sin + local.z * cos),
  };
}

export const PANEL_CENTRE = panelCentre();
export const PANEL_HEIGHT = active ? active.panelHeight : PROCEDURAL.panel.h;
export const PANEL_WIDTH = active ? active.panelWidth : PROCEDURAL.panel.w;

/** Field of view once the camera has pushed all the way in. */
export const SCREEN_FOV = 32;

/**
 * How much of the frame the display occupies at the end of the dolly.
 *
 * Separate fractions per axis, because the two axes want different things. At
 * 0.6 of the height the whole machine stays in shot on a wide screen, so the
 * zoom reads as closing in on a laptop rather than becoming a full-bleed slide.
 * A portrait phone is width-bound instead, and holding it to 0.6 there left the
 * end of the dolly no larger than its start: the chassis and the panel are
 * nearly the same width, so fitting either to the same fraction lands the
 * camera in the same place. Letting the panel span the full width on portrait
 * restores the push in.
 */
export const SCREEN_FILL = { h: 0.6, w: 1.0 };

/** Same, for the whole chassis before the dolly starts. */
export const CHASSIS_FILL = { h: 0.72, w: 0.72 };

/**
 * Distance at which a subject of the given half extents fits `fill` of the
 * frame, in BOTH axes.
 *
 * The two-axis part is the whole point. Every camera distance here used to be
 * solved from height alone, which is correct only while the viewport is wider
 * than the subject. A perspective camera's vertical fov is fixed and the
 * horizontal one follows the aspect, so on a portrait phone the horizontal
 * angle collapses and a subject that fits vertically is cut off at the sides.
 * At 390x844 the panel needed 14.5 units of standoff and was given 3.9, which
 * is why the display read as a cropped fragment rather than as a screen.
 *
 * Taking the max means the tighter axis wins and the subject always fits.
 */
export function fitDistance(
  halfWidth: number,
  halfHeight: number,
  fovDeg: number,
  aspect: number,
  fill: { h: number; w: number },
) {
  const t = Math.tan((fovDeg / 2) * DEG);
  const byHeight = halfHeight / (t * fill.h);
  const byWidth = halfWidth / (t * aspect * fill.w);
  return Math.max(byHeight, byWidth);
}

/** Standoff from the panel centre for the end of the dolly, at this aspect. */
export function screenStandoff(aspect: number) {
  return fitDistance(PANEL_WIDTH / 2, PANEL_HEIGHT / 2, SCREEN_FOV, aspect, SCREEN_FILL);
}

/** Distance needed for the whole chassis to be in shot, at this aspect. */
export function chassisDistance(fovDeg: number, aspect: number) {
  // Depth counts towards the vertical extent once the lid is up: the machine is
  // taller than it is deep, so the lid height is the binding half-extent.
  const halfHeight = (PROCEDURAL.lid.h + PROCEDURAL.base.h) / 2;
  return fitDistance(PROCEDURAL.base.w / 2, halfHeight, fovDeg, aspect, CHASSIS_FILL);
}
