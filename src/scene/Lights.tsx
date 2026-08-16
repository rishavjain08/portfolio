import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

/**
 * Aluminium is defined by what it reflects. With metalness near 1 and no
 * environment map a metal surface renders black plus raw specular streaks from
 * whatever point lights exist, which is what produced the blue banding on the
 * old deck. The environment below is what actually makes the metal read as
 * metal; the discrete lights only shape it.
 *
 * The rig is built from Lightformers rather than a preset HDRI so nothing is
 * fetched at runtime: a preset would hit the pmndrs CDN on every cold load and
 * hang behind Suspense if it were unreachable. Set `useHdri` to swap.
 */
export function Lights({ useHdri = false }: { useHdri?: boolean }) {
  return (
    <>
      {useHdri ? (
        <Environment preset="city" environmentIntensity={0.75} />
      ) : (
        <Environment resolution={256} environmentIntensity={0.8}>
          {/* Overhead softbox: the long specular running down the lid. */}
          <Lightformer
            form="rect"
            intensity={2.3}
            position={[0, 5, 1]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[9, 5, 1]}
            color="#ffffff"
          />
          {/* Two side strips give the chassis edges something to catch. */}
          <Lightformer
            form="rect"
            intensity={1.15}
            position={[-5, 1.5, 2]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[6, 4, 1]}
            color="#dfe6f2"
          />
          <Lightformer
            form="rect"
            intensity={0.95}
            position={[5, 1.5, 2]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[6, 4, 1]}
            color="#f0e8dc"
          />
          {/* Cool wrap from behind, so the silhouette separates from the stage. */}
          <Lightformer
            form="rect"
            intensity={1.1}
            position={[0, 2, -6]}
            rotation={[0, 0, 0]}
            scale={[8, 5, 1]}
            color="#7fa0d8"
          />
          {/* Dim floor bounce; without it the underside goes fully black. */}
          <Lightformer
            form="rect"
            intensity={0.28}
            position={[0, -3, 1]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[8, 5, 1]}
            color="#9aa4b4"
          />
        </Environment>
      )}

      {/* Key: shapes the deck and casts the contact shadow. */}
      <directionalLight position={[2.6, 5.2, 3.4]} intensity={1.5} color="#f2f6ff" castShadow={false} />
      {/* Soft fill, opposite side, so the shadow side keeps detail. */}
      <directionalLight position={[-4, 2, 2.4]} intensity={0.42} color="#8fa8cc" />
      {/* Rim behind the lid for edge definition. Low, and no longer the only
          thing the metal has to reflect. */}
      <directionalLight position={[-1.5, 2.4, -4]} intensity={0.7} color="#a8c4ff" />
      <ambientLight intensity={0.16} />

      {/* Soft contact shadow grounds the machine instead of leaving it floating. */}
      <ContactShadows
        position={[0, -0.055, 0]}
        scale={7}
        resolution={512}
        blur={2.8}
        far={1.4}
        opacity={0.42}
        color="#000308"
        frames={1}
      />
    </>
  );
}
