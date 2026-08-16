import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { starBrightnessAt } from "../lib/timeline";

/**
 * The starfield, as the backdrop for the whole hero.
 *
 * It used to be a small rectangle of points parked just behind the panel, so it
 * only ever showed through the display. Now it is a shell in world space with
 * the camera inside it, which fills the frame at every point on the camera path
 * without having to track the frustum: wherever the camera looks, it is looking
 * at the inside of the shell.
 *
 * Depth testing stays on, so the laptop occludes the stars behind it rather
 * than the field showing through the chassis.
 */

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uBrightness;
  uniform float uSize;

  attribute float aScale;
  attribute float aTwinkle;
  attribute float aDepth;

  varying float vAlpha;
  varying float vTint;

  void main() {
    vec3 p = position;

    // Parallax drift, scaled by the point's own depth so the field does not
    // slide as one flat sheet.
    p.x += sin(uTime * 0.05 + aTwinkle * 6.283) * 0.5 * aDepth;
    p.y += cos(uTime * 0.04 + aTwinkle * 4.712) * 0.4 * aDepth;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // Calibrated for shell distances of 14 to 30 units. Measured, not guessed:
    // at 0.9 the field rendered 6 lit pixels across the whole left margin.
    gl_PointSize = clamp(uSize * aScale * (60.0 / max(-mv.z, 0.001)), 1.0, 5.0);

    float twinkle = 0.72 + 0.28 * sin(uTime * 1.4 + aTwinkle * 21.0);
    vAlpha = uBrightness * twinkle * aScale;
    vTint = aTwinkle;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uCool;

  varying float vAlpha;
  varying float vTint;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 2.2);
    // Most stars are white; a minority take a cool cast so the field is not flat.
    vec3 color = mix(uCore, uCool, smoothstep(0.7, 1.0, vTint));
    float alpha = a * vAlpha;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

/** Shell bounds. The camera path stays well inside the inner radius. */
const R_MIN = 14;
const R_MAX = 30;

type Props = { progress: React.RefObject<number>; count?: number };

export function Starfield({ progress, count = 2200 }: Props) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const position = new Float32Array(count * 3);
    const scale = new Float32Array(count);
    const twinkle = new Float32Array(count);
    const depth = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Uniform directions on a sphere, so coverage does not clump at the
      // poles and the frame is evenly filled wherever the camera aims.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const t = Math.pow(Math.random(), 0.6);
      const r = R_MIN + t * (R_MAX - R_MIN);

      position[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      // Slightly flattened, so the field reads as a sky rather than a bubble.
      position[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.75;
      position[i * 3 + 2] = Math.cos(phi) * r;

      scale[i] = Math.random() < 0.08 ? 1.5 + Math.random() * 1.2 : 0.35 + Math.random() * 0.5;
      twinkle[i] = Math.random();
      // Nearer stars drift further.
      depth[i] = 1 - t;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
    g.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkle, 1));
    g.setAttribute("aDepth", new THREE.BufferAttribute(depth, 1));
    // Points move in the shader, so the frustum bound is set by hand.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R_MAX + 2);
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBrightness: { value: 0 },
      uSize: { value: 2.4 },
      uCore: { value: new THREE.Color("#ffffff") },
      uCool: { value: new THREE.Color("#9fc4e8") },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = state.clock.elapsedTime;
    material.current.uniforms.uBrightness.value = starBrightnessAt(progress.current ?? 0);
  });

  return (
    <points geometry={geometry} frustumCulled={false} position={[0, 1, 0]}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
