import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { content } from "../../config/content";
import { PROCEDURAL } from "../../config/stage";
import { laptopOpacityAt, screenTextOpacityAt } from "../../lib/timeline";

/**
 * The greeting, drawn on the display itself.
 *
 * It has to be in the scene rather than in the DOM overlay: the overlay is a
 * full-viewport centred block, so showing it this early would float the text
 * across the whole page while the laptop is still small and far away. Painting
 * it into a texture on the panel means it sits inside the bezel, tilts with the
 * lid, and grows on its own as the camera closes in.
 */

const PANEL = PROCEDURAL.panel;

/** Texture matches the panel aspect, so nothing is stretched. */
const TEX_W = 1536;
const TEX_H = Math.round(TEX_W * (PANEL.h / PANEL.w));

const GREETING = "Hey, I'm";

function paint(ctx: CanvasRenderingContext2D, fontReady: boolean) {
  ctx.clearRect(0, 0, TEX_W, TEX_H);

  // Before the webfont resolves this would silently fall back to a different
  // metric and the text would jump when it loads, so we repaint on ready.
  const family = fontReady ? '"JetBrains Mono", ui-monospace, monospace' : "ui-monospace, monospace";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `500 ${Math.round(TEX_H * 0.082)}px ${family}`;
  ctx.fillStyle = "rgba(198,220,238,0.6)";
  ctx.fillText(GREETING, TEX_W / 2, TEX_H * 0.395);

  ctx.font = `600 ${Math.round(TEX_H * 0.168)}px ${family}`;
  ctx.fillStyle = "#eaf4ff";
  ctx.fillText(content.name, TEX_W / 2, TEX_H * 0.55);

  // A hairline under the name, inset to the text block rather than the panel.
  const rule = TEX_W * 0.17;
  ctx.strokeStyle = "rgba(198,220,238,0.22)";
  ctx.lineWidth = Math.max(1, TEX_H * 0.0022);
  ctx.beginPath();
  ctx.moveTo(TEX_W / 2 - rule, TEX_H * 0.665);
  ctx.lineTo(TEX_W / 2 + rule, TEX_H * 0.665);
  ctx.stroke();
}

export function ScreenText({ progress }: { progress: React.RefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  const { texture, redraw } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const ctx = canvas.getContext("2d");
    if (ctx) paint(ctx, false);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;

    return {
      texture: tex,
      redraw: () => {
        if (!ctx) return;
        paint(ctx, true);
        tex.needsUpdate = true;
      },
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const fonts = document.fonts;
    if (!fonts) return;
    // Load the exact weights used above, not just any face of the family.
    Promise.all([
      fonts.load('500 100px "JetBrains Mono"'),
      fonts.load('600 100px "JetBrains Mono"'),
    ])
      .then(() => fonts.ready)
      .then(() => {
        if (alive) redraw();
      })
      .catch(() => {
        /* Fallback metrics already painted. */
      });
    return () => {
      alive = false;
    };
  }, [redraw]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(() => {
    const p = progress.current ?? 0;
    // Chassis opacity as well, so the text cannot outlive the laptop it is on.
    const o = screenTextOpacityAt(p) * laptopOpacityAt(p);
    if (mat.current) mat.current.opacity = o;
    if (mesh.current) mesh.current.visible = o > 0.001;
  });

  return (
    <mesh ref={mesh} position={[0, PROCEDURAL.panelShiftY, PROCEDURAL.panelOffset.z + 0.0025]}>
      <planeGeometry args={[PANEL.w, PANEL.h]} />
      {/* Unlit and untone-mapped: this is a display emitting light, not a
          surface catching it, and ACES would otherwise crush the whites. */}
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
