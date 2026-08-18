import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PROCEDURAL } from "../../config/stage";
import { useCompactMode } from "../../hooks/useCompactMode";
import { INTRO_DURATION, createIntroFilm } from "../../lib/introFilm";
import { INTRO_START, introOpacityAt, laptopOpacityAt } from "../../lib/timeline";

/**
 * The boot film, on the display itself.
 *
 * Sits a hair in front of the greeting on the same panel, so the two crossfade
 * on one surface instead of one of them moving out of the way. Both are unlit
 * planes inside the lid group, so they tilt with the lid and grow with the
 * dolly without either of them knowing about the camera.
 *
 * The film runs on its own wall clock rather than on scroll. It is a ten second
 * piece with typed code, counters and a closing beat; scrubbing that to scroll
 * position would mean its pacing is set by how fast the reader happens to move,
 * and the code would type backwards on a scroll up. Scroll decides *whether* it
 * plays; the clock decides where it is.
 */

const PANEL = PROCEDURAL.panel;

/**
 * Texture width. Every frame is a full re-upload plus a mipmap rebuild, so this
 * is a straight trade of sharpness at the end of the dolly against per-frame
 * bandwidth. 1536 matches the greeting's texture and holds up at full zoom.
 */
const TEX_W_DEFAULT = 1536;

/**
 * Phones get a smaller one. The whole texture is re-uploaded every frame, and
 * on a device whose panel is a few hundred CSS pixels wide, 1536 is texels
 * nobody can see paid for in bandwidth every frame.
 */
const TEX_W_SMALL = 1024;

export function ScreenIntro({ progress }: { progress: React.RefObject<number> }) {
  const { reduced, isSmall } = useCompactMode();
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  /**
   * When the film started, on the page's own clock. An anchored timestamp
   * rather than an accumulated per-frame delta: accumulating is only correct if
   * the callback runs exactly once per frame, and it silently runs at double
   * speed the moment anything subscribes twice. This way ten seconds of film is
   * ten seconds no matter what the frame loop does.
   */
  const startedAt = useRef<number | null>(null);
  /** Last time actually painted, so a held final frame stops re-uploading. */
  const painted = useRef(-1);

  const { texture, film } = useMemo(() => {
    const w = isSmall ? TEX_W_SMALL : TEX_W_DEFAULT;
    const h = Math.round(w * (PANEL.h / PANEL.w));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;

    return { texture: tex, film: ctx ? createIntroFilm(ctx, w, h) : null };
  }, [isSmall]);

  /**
   * Canvas measures text against whatever face is resolved at draw time, so a
   * frame painted before the webfont lands is laid out on fallback metrics.
   * Every frame is repainted anyway while the film runs; this only matters for
   * the one held frame in compact mode, which is why it just invalidates.
   */
  useEffect(() => {
    let alive = true;
    const fonts = document.fonts;
    if (!fonts) return;
    Promise.all([
      fonts.load('400 100px "JetBrains Mono"'),
      fonts.load('500 100px "JetBrains Mono"'),
      fonts.load('600 100px "Outfit"'),
    ])
      .then(() => fonts.ready)
      .then(() => {
        if (alive) painted.current = -1;
      })
      .catch(() => {
        /* Fallback metrics already painted. */
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(() => {
    const p = progress.current ?? 0;
    const o = introOpacityAt(p) * laptopOpacityAt(p);

    if (mat.current) mat.current.opacity = o;
    if (mesh.current) mesh.current.visible = o > 0.001;

    // Scrolled back before the start: rewind, so coming down again replays the
    // film from the top rather than resuming mid-sentence.
    if (p < INTRO_START) {
      startedAt.current = null;
      painted.current = -1;
      return;
    }
    if (!film) return;

    /**
     * Reduced motion parks the scene on a poster frame and runs the canvas on
     * demand, so there is no clock to advance and nothing would move. Park the
     * film on its closing lockup instead, which is the frame the poster wants.
     * Phones are not included: they play it like anything else.
     */
    if (reduced) {
      if (painted.current !== INTRO_DURATION) {
        film.render(INTRO_DURATION);
        texture.needsUpdate = true;
        painted.current = INTRO_DURATION;
      }
      return;
    }

    const now = performance.now();
    if (startedAt.current === null) startedAt.current = now;

    const t = Math.min(now - startedAt.current, INTRO_DURATION);
    if (painted.current === t) return; // Finished, holding.

    film.render(t);
    texture.needsUpdate = true;
    painted.current = t;
  });

  return (
    <mesh
      ref={mesh}
      visible={false}
      position={[0, PROCEDURAL.panelShiftY, PROCEDURAL.panelOffset.z + 0.004]}
    >
      <planeGeometry args={[PANEL.w, PANEL.h]} />
      {/* Same reasoning as the greeting: a display emits light, so unlit and
          untone-mapped, or ACES crushes the whites the bloom pass wants. */}
      <meshBasicMaterial
        ref={mat}
        map={texture}
        transparent
        opacity={0}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}
