import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PROCEDURAL } from "../../config/stage";
import { laptopFloatAt, laptopOpacityAt, laptopYawAt, lidAngleAt } from "../../lib/timeline";
import { ScreenIntro } from "./ScreenIntro";
import { ScreenText } from "./ScreenText";

const {
  base: BASE,
  lid: LID,
  hinge: HINGE,
  panel: PANEL,
  panelOffset,
  panelShiftY,
  radius,
  deck,
  trackpad,
  grille,
} = PROCEDURAL;

/** Closed is the lid folded flat onto the base: rotation.x = +90 degrees. */
const CLOSED_X = Math.PI / 2;

/* ------------------------------------------------------------------ */
/* Keyboard layout                                                     */
/* ------------------------------------------------------------------ */

type Key = { x: number; z: number; w: number; d: number };

/**
 * Six rows, laid out as unit widths so the whole block scales with the deck.
 * Negative z is towards the hinge, so the function row is first.
 */
const ROWS: { h: number; keys: number[] }[] = [
  { h: 0.62, keys: [1.35, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }, // function row, short
  { h: 1, keys: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.6] }, // numbers + backspace
  { h: 1, keys: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.1] }, // tab + qwerty
  { h: 1, keys: [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.85] }, // caps + asdf + return
  { h: 1, keys: [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.3] }, // shift + zxcv + shift
  { h: 1, keys: [1, 1, 1.3, 6.2, 1.3, 1, 1, 1] }, // modifiers + spacebar
];

function buildKeys(): Key[] {
  const GAP = 0.014;
  const rowUnits = ROWS.map((r) => r.keys.reduce((a, b) => a + b, 0));
  const widest = Math.max(...rowUnits);

  // One unit width, sized so the widest row exactly fills the deck.
  const unit = (deck.w - GAP * (Math.max(...ROWS.map((r) => r.keys.length)) - 1)) / widest;
  const totalH = ROWS.reduce((a, r) => a + r.h, 0);
  const rowDepth = (deck.d - GAP * (ROWS.length - 1)) / totalH;

  const keys: Key[] = [];
  let z = -deck.d / 2;

  for (const row of ROWS) {
    const d = rowDepth * row.h;
    const gaps = GAP * (row.keys.length - 1);
    const width = row.keys.reduce((a, u) => a + unit * u, 0) + gaps;
    let x = -width / 2;

    for (const u of row.keys) {
      const w = unit * u;
      keys.push({ x: x + w / 2, z: z + d / 2, w, d });
      x += w + GAP;
    }
    z += d + GAP;
  }
  return keys;
}

/* ------------------------------------------------------------------ */

export function ProceduralLaptop({ progress }: { progress: React.RefObject<number> }) {
  const root = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const keysRef = useRef<THREE.InstancedMesh>(null);

  const keys = useMemo(buildKeys, []);

  /**
   * Physically based materials. Aluminium only looks like aluminium when there
   * is an environment to reflect: with metalness near 1 and no envMap a metal
   * renders black plus raw specular streaks from whatever lights exist, which
   * is what the old blue banding was. Scene.tsx supplies the environment.
   */
  const mats = useMemo(() => {
    const alu = new THREE.MeshStandardMaterial({
      color: "#a5a7ab",
      metalness: 0.9,
      roughness: 0.35,
      envMapIntensity: 0.95,
      transparent: true,
    });
    // Machined recesses read a shade darker and rougher than the outer shell.
    // Milled recesses sit in shadow and catch far less of the environment.
    // At envMapIntensity 0.85 they reflected more sky than the shell and read
    // as pale blue panels, which is what made the deck look like plastic.
    const aluDark = new THREE.MeshStandardMaterial({
      color: "#3f434a",
      metalness: 0.82,
      roughness: 0.62,
      envMapIntensity: 0.35,
      transparent: true,
    });
    const key = new THREE.MeshStandardMaterial({
      color: "#17181c",
      metalness: 0.0,
      roughness: 0.72,
      transparent: true,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#191b20",
      metalness: 0.1,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 0.55,
      transparent: true,
    });
    const bezel = new THREE.MeshStandardMaterial({
      color: "#0c0d11",
      metalness: 0.25,
      roughness: 0.65,
      transparent: true,
    });
    /**
     * The display: emissive rather than lit, at low intensity, so it glows a
     * little without washing out. Kept partly transparent so the starfield
     * behind it reads as content on the screen.
     */
    const screen = new THREE.MeshStandardMaterial({
      color: "#04060c",
      emissive: new THREE.Color("#0a1730"),
      emissiveIntensity: 0.55,
      metalness: 0,
      roughness: 0.35,
      transparent: true,
      opacity: 0.82,
    });

    // Perforated grille: near-black, matte, almost no environment.
    const grille = new THREE.MeshStandardMaterial({
      color: "#26282d",
      metalness: 0.3,
      roughness: 0.85,
      envMapIntensity: 0.2,
      transparent: true,
    });

    return {
      alu,
      aluDark,
      key,
      glass,
      bezel,
      screen,
      grille,
      all: [alu, aluDark, key, glass, bezel, screen, grille],
    };
  }, []);

  const baseOpacity = useMemo(() => new Map(mats.all.map((m) => [m, m.opacity])), [mats]);

  useEffect(() => () => mats.all.forEach((m) => m.dispose()), [mats]);

  /** Key transforms are static, so they are written once rather than per frame. */
  useLayoutEffect(() => {
    const mesh = keysRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const pos = new THREE.Vector3();

    keys.forEach((k, i) => {
      pos.set(deck.z ? k.x : k.x, 0, k.z);
      s.set(k.w, 1, k.d);
      m.compose(pos, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [keys]);

  useFrame((state) => {
    const p = progress.current ?? 0;
    const t = state.clock.elapsedTime;

    // One convention for both variants: closed is +90deg, open subtracts.
    if (lid.current) lid.current.rotation.x = CLOSED_X - lidAngleAt(p);

    if (root.current) {
      root.current.rotation.y = laptopYawAt(p, t);
      root.current.position.y = laptopFloatAt(p, t);

      const o = laptopOpacityAt(p);
      root.current.visible = o > 0.001;
      for (const m of mats.all) m.opacity = (baseOpacity.get(m) ?? 1) * o;
    }
  });

  return (
    <group ref={root}>
      {/* ---------------- Base ---------------- */}
      <RoundedBox args={[BASE.w, BASE.h, BASE.d]} radius={radius.base} smoothness={5} material={mats.alu} />

      {/* Keyboard well, milled into the deck */}
      <group position={[0, BASE.h / 2, deck.z]}>
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.aluDark}>
          <planeGeometry args={[deck.w + 0.06, deck.d + 0.06]} />
        </mesh>

        {/* Every key in one draw call */}
        <instancedMesh
          ref={keysRef}
          args={[undefined, undefined, keys.length]}
          material={mats.key}
          position={[0, 0.011, 0]}
          castShadow
        >
          <boxGeometry args={[1, 0.02, 1]} />
        </instancedMesh>
      </group>

      {/* Speaker grilles, either side of the keyboard. Position and width are
          derived in config/stage.ts from the deck and the chassis edge, so
          they cannot drift off the side when the deck is resized. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * grille.x, BASE.h / 2 + 0.001, grille.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={mats.grille}
        >
          <planeGeometry args={[grille.w, grille.d]} />
        </mesh>
      ))}

      {/* Trackpad */}
      <mesh
        position={[0, BASE.h / 2 + 0.0015, trackpad.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={mats.glass}
      >
        <planeGeometry args={[trackpad.w, trackpad.d]} />
      </mesh>

      {/* Hinge barrel, joining lid and base. Sits on the hinge centre line so
          the lid pivots flush against the back edge with no gap. */}
      <mesh position={[HINGE.x, HINGE.y, HINGE.z]} rotation={[0, 0, Math.PI / 2]} material={mats.aluDark}>
        <cylinderGeometry args={[BASE.h * 0.46, BASE.h * 0.46, BASE.w - 0.12, 24]} />
      </mesh>

      {/* ---------------- Lid ---------------- */}
      <group ref={lid} position={[HINGE.x, HINGE.y, HINGE.z]}>
        <group position={[0, LID.h / 2, 0]}>
          <RoundedBox args={[LID.w, LID.h, LID.d]} radius={radius.lid} smoothness={5} material={mats.alu} />

          {/* Mark on the outside of the lid */}
          <mesh position={[0, 0, -LID.d / 2 - 0.002]} material={mats.aluDark}>
            <circleGeometry args={[0.075, 48]} />
          </mesh>

          {/* Black bezel face, then the display inset into it */}
          <mesh position={[0, 0, LID.d / 2 + 0.0008]} material={mats.bezel}>
            <planeGeometry args={[LID.w - 0.014, LID.h - 0.014]} />
          </mesh>
          <mesh position={[0, panelShiftY, panelOffset.z]} material={mats.screen}>
            <planeGeometry args={[PANEL.w, PANEL.h]} />
          </mesh>

          {/* Greeting on the display, then the film it boots into once the lid
              is all the way up. Both live inside the lid group, so they tilt
              with the lid instead of hanging in world space. */}
          <ScreenText progress={progress} />
          <ScreenIntro progress={progress} />
        </group>
      </group>
    </group>
  );
}
