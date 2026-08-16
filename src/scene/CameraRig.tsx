import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraAt, lookAtAt } from "../lib/timeline";

/**
 * The only thing that writes to the camera. It reads the progress ref GSAP
 * fills and derives every value from lib/timeline; GSAP never touches a
 * Three.js property itself.
 */
export function CameraRig({ progress }: { progress: React.RefObject<number> }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame(() => {
    const p = progress.current ?? 0;
    const c = cameraAt(p);
    const look = lookAtAt(p);

    camera.position.set(c.x, c.y, c.z);
    target.current.set(look.x, look.y, look.z);
    camera.lookAt(target.current);

    const cam = camera as THREE.PerspectiveCamera;
    if (cam.fov !== c.fov) {
      cam.fov = c.fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
