import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { MODEL, stage } from "../../config/stage";
import { laptopFloatAt, laptopOpacityAt, laptopYawAt, lidAngleAt } from "../../lib/timeline";

/**
 * Poly Haven `classic_laptop`, CC0, by Arrangemonk.
 *
 * The model ships with no hinge rig: `classic_laptop_screen` is a sibling of
 * the base rather than a child, and the lid is authored upright. Its origin
 * does sit on the hinge line, so driving that node's rotation.x is enough once
 * we know the rest pose is "open at 90 degrees" (see MODEL.closedRotationX).
 */
export function ModelLaptop({ progress }: { progress: React.RefObject<number> }) {
  const { scene } = useGLTF(stage.modelUrl);
  const root = useRef<THREE.Group>(null);

  /**
   * useGLTF caches by URL, so mutating the cached materials would leak into
   * any other consumer and survive unmount. Clone the graph and its materials,
   * then dispose our copies ourselves.
   */
  const { graph, lid, materials } = useMemo(() => {
    const graph = scene.clone(true);
    const materials: THREE.Material[] = [];

    graph.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const src = mesh.material as THREE.Material | THREE.Material[];
      const clone = Array.isArray(src) ? src.map((m) => m.clone()) : src.clone();
      const list = Array.isArray(clone) ? clone : [clone];
      list.forEach((m) => {
        m.transparent = true;
        materials.push(m);
      });
      mesh.material = clone;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });

    const lid =
      graph.getObjectByName("classic_laptop_screen") ??
      graph.getObjectByName("lid") ??
      graph.getObjectByName("screen") ??
      null;

    return { graph, lid, materials };
  }, [scene]);

  useEffect(() => {
    return () => {
      materials.forEach((m) => m.dispose());
    };
  }, [materials]);

  useFrame((state) => {
    const p = progress.current ?? 0;
    const t = state.clock.elapsedTime;

    // Rest pose is open-and-vertical, so shut is +90deg and a 105deg lid is -15deg.
    if (lid) lid.rotation.x = MODEL.closedRotationX - lidAngleAt(p);

    if (root.current) {
      root.current.rotation.y = laptopYawAt(p, t);
      root.current.position.y = laptopFloatAt(p, t);

      const o = laptopOpacityAt(p);
      root.current.visible = o > 0.001;
      for (const m of materials) m.opacity = o;
    }
  });

  return (
    <group ref={root} scale={MODEL.scale}>
      <primitive object={graph} />
    </group>
  );
}

useGLTF.preload(stage.modelUrl);
