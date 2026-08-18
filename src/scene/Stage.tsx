import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { CameraRig } from "./CameraRig";
import { Laptop } from "./laptop";
import { Lights } from "./Lights";
import { Starfield } from "./Starfield";

type Props = {
  progress: React.RefObject<number>;
  /** Poster mode: one frame at a fixed progress, no scrub, no bloom. */
  reduced?: boolean;
  /** Phone-sized. Still animates; renders more cheaply. */
  isSmall?: boolean;
};

export default function Stage({ progress, reduced = false, isSmall = false }: Props) {
  return (
    <Canvas
      frameloop={reduced ? "demand" : "always"}
      /**
       * Phones run the same timeline at a lower resolution. Capping at 1.5
       * rather than the display's 3 keeps the fill rate sane while the film's
       * texture is uploading every frame, and at this size the difference is
       * not visible.
       */
      dpr={reduced ? 1 : isSmall ? [1, 1.5] : [1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        // Filmic response and correct output space: without these the
        // aluminium highlights clip to flat white and the mid tones crush.
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{ position: [0, 3.4, 5.2], fov: 45, near: 0.01, far: 120 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <CameraRig progress={progress} />
        <Lights />
        <Laptop progress={progress} />
        <Starfield progress={progress} count={reduced || isSmall ? 700 : 2200} />

        {/* Bloom is the most expensive pass here and the least missed at phone
            size, so it is the one thing small screens genuinely go without. */}
        {!reduced && !isSmall ? (
          <EffectComposer enableNormalPass={false}>
            <Bloom intensity={0.42} luminanceThreshold={0.62} luminanceSmoothing={0.25} mipmapBlur />
          </EffectComposer>
        ) : (
          <></>
        )}
      </Suspense>
    </Canvas>
  );
}
