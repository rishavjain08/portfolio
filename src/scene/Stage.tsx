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
  compact?: boolean;
};

export default function Stage({ progress, compact = false }: Props) {
  return (
    <Canvas
      frameloop={compact ? "demand" : "always"}
      dpr={compact ? 1 : [1, 2]}
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
        <Starfield progress={progress} count={compact ? 700 : 2200} />

        {!compact ? (
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
