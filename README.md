# Scroll-driven 3D hero

A single pinned section, ~300vh tall, scrubbing one 0→1 timeline: a **closed** laptop
opens, the camera dollies into the screen, and the display becomes space.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build && npm run preview
```

No environment variables. The laptop model is committed under `public/models/`.

## Edit the copy

`src/config/content.ts` — four lines:

```ts
brand: "RISHAVV",
name:  "Rishavv Jain",
role:  "a full-stack developer",
city:  "Gurugram",
```

## The laptop

Default is the **procedural slim chassis**, built from primitives. No external assets.

| | base h/w | lid depth |
|---|---|---|
| procedural (default) | `0.031` | `0.038` |
| Poly Haven model | `0.155` | `0.191` |
| real 15" MacBook Pro | `0.044` | — |

The downloaded **Poly Haven `classic_laptop`** (CC0, by Arrangemonk) is still committed under
`public/models/` and is one line away in `src/config/stage.ts`:

```ts
variant: "model",   // or "procedural"
```

It is a vintage beige machine with a trackball and it is genuinely thick — a 15% thickness
ratio against its own width. That cannot be slimmed without distorting the geometry, so it
is opt-in rather than the default.

### Using a different model

1. Drop a GLTF/GLB under `public/models/`.
2. Point `stage.modelUrl` at it.
3. Measure it and update `MODEL_RAW` in `src/config/stage.ts`: base width, hinge position,
   panel centre and panel height. Everything downstream is derived from those four numbers.
4. If the lid node is not called `classic_laptop_screen`, `lid` or `screen`, add its name to
   the lookup in `src/scene/laptop/ModelLaptop.tsx`.

> The shipped model has **no hinge rig** — `classic_laptop_screen` is a sibling of the base,
> not a child — and is authored open and upright. Its origin happens to sit on the hinge
> line, so `rotation.x = +90°` folds it shut and `MODEL.closedRotationX` encodes that. A
> model authored *closed* would need `closedRotationX: 0`.

## Structure

```
src/
  config/
    content.ts     brand / name / role / city
    tokens.ts      colours
    stage.ts       geometry, model choice, and all derived framing
  lib/
    math.ts        clamp, lerp, range, easings
    timeline.ts    the whole 0→1 mapping (imports math + stage only)
  hooks/
    useScrollProgress.ts   the single ScrollTrigger
    useCompactMode.ts      small screen or reduced motion
  scene/
    Stage.tsx      Canvas + composition
    CameraRig.tsx  the only thing that writes to the camera
    Lights.tsx
    Starfield.tsx
    laptop/
      index.tsx            picks the variant
      ModelLaptop.tsx      Poly Haven glTF, hinge derived
      ProceduralLaptop.tsx aluminium primitives
  overlay/
    Overlay.tsx    composes every DOM layer
    Nebula.tsx  Wordmark.tsx  HeroText.tsx  ScrollHint.tsx  Loader.tsx
  App.tsx
```

Two rules hold the structure together:

**`lib/timeline.ts` is the only place the timeline exists.** It imports scalar maths and
stage geometry, nothing else — no Three.js, no GSAP, no React. You can evaluate the whole
experience without a renderer.

**`config/stage.ts` derives framing instead of hard-coding it.** `SCREEN_STANDOFF` is solved
from panel height and field of view (`h/2 / tan(fov/2)`), and `PANEL_CENTRE` is the lid-local
panel offset rotated about the hinge. Change a chassis dimension and the camera path follows.

Current derived values (`variant: "procedural"`):

| | |
|---|---|
| base | `2.4 x 0.075 x 1.66` |
| lid | `2.4 x 1.5 x 0.038` |
| panel | `2.30 x 1.41`, bezel `0.050` side / `0.045` top |
| hinge, world | `(0, 0.037, -0.810)` |
| panel centre | `(0, 0.786, -0.763)` |
| screen standoff | `2.459` at fov 32 |

Switching to `variant: "model"` re-derives all of these from the glTF measurements instead.

## How it is wired

```
ScrollTrigger (scrub: 1)  ──writes──>  progressRef.current   (one float, 0→1)
                                              │
                                              ├─ useFrame reads it  →  camera, lid, starfield
                                              └─ 40 coarse buckets  →  DOM text, nebula, chevrons
```

**GSAP never touches a Three.js property.** It animates one number; everything else is a pure
function of it. The standard failure when combining GSAP with R3F is two libraries writing
the same property on the same frame, and this structure makes that impossible.

React state changes at most 40 times across the whole scroll, so scrolling never re-renders
the tree per frame.

### Timeline

| progress | phase | what happens |
|---|---|---|
| `0.00–0.15` | rest | **closed** laptop, top-down 3/4, idle float and yaw. Chevrons bounce. |
| `0.15–0.45` | open | camera swings front-on while the lid rises 0° → 105°. Screen wakes. |
| `0.45–0.70` | dolly | camera pushes in; lid squares up to 92°; starfield brightens. |
| `0.70–0.75` | handoff | chassis fades, starfield expands to world scale, camera passes through the panel. |
| `0.75–1.00` | space | slow drift. Text reveals at `0.78 / 0.85 / 0.90 / 0.94`. |

### The seamless handoff

There is **one** starfield, in world space. While the chassis is up the group is scaled to
the panel rectangle and sits just behind it, so the bezel masks it and it reads as the
display waking. During the handoff the group scales out while the chassis fades — and
because the camera is already at the panel plane, there is no parallax jump.

No render targets, no second scene, no cross-fading two different star arrangements.

## Quality floor

- **Compact mode** (`max-width: 767px` **or** `prefers-reduced-motion: reduce`) drops the pin
  and the scrub entirely: one frame at progress `0.42`, `frameloop="demand"`, `dpr={1}`, no
  bloom, copy revealed on load.
- **DPR** clamped to `[1, 2]`.
- **Lazy 3D** — `Stage.tsx` is a `lazy()` import behind `<Suspense>`. `three` + R3F is a
  separate 1.0 MB chunk (276 kB gzipped) that never blocks first paint.
- **Disposal** — glTF materials are *cloned* before mutation (`useGLTF` caches by URL, so
  mutating the cache would leak into other consumers and outlive unmount) and disposed on
  teardown, along with the starfield geometry. The ScrollTrigger is killed in cleanup.
- **Transform/opacity only.** No animated `width`, `height`, `top` or `left`.
- **Accessibility** — visible focus ring, skip link, semantic `h1`/`h2`, an `sr-only` summary
  so the message is available without scrolling, `aria-hidden` on decorative layers, and
  `useReducedMotion()` in every Motion component.

## Tokens

| | |
|---|---|
| Stage | `#0F0F12` (warm near-black, not pure `#000` — avoids OLED smear) |
| Nebula | `#0A1A3A` → `#02040A` radial |
| Text bright | `#CFE6F5` |
| Text muted | `#8FA6BC` |
| Display type | JetBrains Mono |
| Wordmark | Outfit, uppercase, `0.42em` tracking |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` throughout |

## Credits

Laptop model: [Classic Laptop](https://polyhaven.com/a/classic_laptop) by Arrangemonk,
via Poly Haven. CC0 — no attribution required, included as courtesy.
