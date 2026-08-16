/**
 * The boot film that plays on the laptop display.
 *
 * Pure canvas 2D: no DOM, no React, no Three. The hero's screen is a texture,
 * so every layer of the original — the graph, the HUD, the chips, the pipeline
 * strip, the closing lockup — has to be *painted*. Nothing here can lean on CSS
 * transitions or DOM stacking, so each of those is re-expressed as a function of
 * film time and drawn in the same back-to-front order the markup implied.
 *
 * Three deliberate departures from the standalone version:
 *
 *   No second frame loop. The original ran its own requestAnimationFrame. Here
 *   render(t) is called from the scene's existing useFrame, so the WebGL scene
 *   and the screen advance on one clock. Two loops writing every frame is the
 *   pitfall this codebase already avoids elsewhere.
 *
 *   Virtual height follows the panel. The layout is authored 1920 wide, but the
 *   display is 2.3 x 1.34 units rather than 16:9, so VH is derived from the real
 *   texture aspect and everything bottom-anchored measures from it. Letterboxing
 *   a fixed 1080 would have left bars inside the bezel.
 *
 *   The letter reveal glows instead of blurring. ctx.filter = "blur()" per
 *   glyph is a per-frame stall on a canvas this size; a shrinking shadow over a
 *   rising glyph reads the same at this scale for none of the cost.
 */

import { clamp, easeInOutCubic, lerp, range, smoothstep } from "./math";

/** Design width. Every coordinate below is in these units. */
const VW = 1920;

/**
 * Total render length, in ms. The source stopped its loop at 10s and let CSS
 * finish the rule and subtitle afterwards; with nothing but paint here, the film
 * has to run long enough to actually land them.
 */
export const INTRO_DURATION = 10600;

const MONO = '"JetBrains Mono", ui-monospace, monospace';
const DISPLAY = '"Outfit", ui-sans-serif, system-ui, sans-serif';

/* The closing statement. Keep the hero lines short and declarative. */
const MSG = ["THE EDGE IS AN", "ENGINEERING PROBLEM."] as const;
const SUB = "SOFTWARE • AI • QUANT ENGINEERING";

const COL = { b: "41,168,255", g: "61,245,192" } as const;
type Tone = keyof typeof COL;

const eOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Seeded, so the shard scatter and tile scatter are the same every replay. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = rng(77213);

/* ------------------------------------------------------------------ */
/* Graph                                                               */
/* ------------------------------------------------------------------ */

type IconKind =
  | "core"
  | "agent"
  | "ml"
  | "auto"
  | "api"
  | "kafka"
  | "box"
  | "db"
  | "rack"
  | "sim"
  | "feed"
  | "exec"
  | "exch"
  | "tools";

type GNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Time this node appears, in ms. */
  t0: number;
  label: string;
  icon: IconKind;
  tone: Tone;
};

const N: Record<string, GNode> = {};
function node(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  t0: number,
  label: string,
  icon: IconKind,
  tone: Tone = "b",
) {
  N[id] = { id, x, y, w, h, t0, label, icon, tone };
}

// The runtime, then its agents.
node("core", 0, 0, 200, 68, 1280, "AGENT RUNTIME", "core", "g");
node("a1", -330, -190, 156, 54, 1340, "PLANNER", "agent", "g");
node("a2", 340, -200, 156, 54, 1410, "EXECUTOR", "agent", "g");
node("a3", 370, 180, 156, 54, 1480, "ML MODEL", "ml", "b");
node("a4", -350, 200, 156, 54, 1550, "AUTOMATION", "auto", "b");

// The platform it runs on.
node("g1", -820, -70, 214, 68, 2060, "API GATEWAY", "api", "b");
node("g2", -20, -470, 214, 68, 2260, "KAFKA STREAMS", "kafka", "g");
node("g3", 800, -140, 214, 68, 2460, "K8S CLUSTER", "box", "b");
node("g4", 660, 430, 214, 68, 2660, "TIMESERIES DB", "db", "b");
node("g5", -660, 470, 214, 68, 2860, "COMPUTE NODES", "rack", "g");

// The trading stack at the edges.
node("m1", -1330, -430, 224, 68, 5060, "MARKET DATA", "feed", "g");
node("m2", -1290, 470, 224, 68, 5360, "SIMULATION", "sim", "b");
node("m3", 1150, 500, 250, 92, 5700, "QUANT TOOLS", "tools", "g");
node("m4", 1180, -450, 224, 68, 6060, "EXECUTION", "exec", "b");
node("m5", 1380, 20, 180, 62, 6480, "EXCHANGE", "exch", "g");

type Route = { p: number[][]; seg: number[]; len: number[]; tot: number };
type GEdge = { a: string; b: string; t0: number; tone: Tone; rate: number; r: Route };

const E: GEdge[] = [];
function edge(a: string, b: string, t0: number, tone: Tone = "b", rate = 1) {
  E.push({ a, b, t0, tone, rate, r: null as unknown as Route });
}

edge("core", "a1", 1560, "g");
edge("a2", "core", 1620, "g");
edge("core", "a3", 1680, "b");
edge("a4", "core", 1740, "b");
edge("g1", "a1", 2160, "b");
edge("core", "g2", 2320, "g");
edge("g1", "g2", 2420, "b");
edge("a2", "g3", 2520, "b");
edge("g2", "g3", 2620, "g", 1.4);
edge("a3", "g4", 2720, "b");
edge("a4", "g5", 2920, "g");
edge("g5", "g4", 3000, "b");
edge("m1", "g1", 5160, "g", 1.7);
edge("m1", "g2", 5260, "g", 1.7);
edge("m2", "g5", 5460, "b");
edge("g4", "m3", 5860, "b");
edge("m3", "a3", 5960, "g");
edge("g3", "m4", 6160, "b", 1.6);
edge("m4", "m5", 6560, "g", 2.2);

/**
 * Orthogonal routing with one dogleg: leave along the dominant axis, cross at
 * the midpoint, arrive square. Cumulative lengths are cached so a packet's
 * position at u is a lookup rather than a walk.
 */
function route(e: GEdge): Route {
  const a = N[e.a];
  const b = N[e.b];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let p: number[][];

  if (Math.abs(dx) > Math.abs(dy)) {
    const s = Math.sign(dx);
    const mx = (a.x + b.x) / 2;
    p = [
      [a.x + (s * a.w) / 2, a.y],
      [mx, a.y],
      [mx, b.y],
      [b.x - (s * b.w) / 2, b.y],
    ];
  } else {
    const s = Math.sign(dy);
    const my = (a.y + b.y) / 2;
    p = [
      [a.x, a.y + (s * a.h) / 2],
      [a.x, my],
      [b.x, my],
      [b.x, b.y - (s * b.h) / 2],
    ];
  }

  const seg: number[] = [];
  const len: number[] = [];
  let tot = 0;
  for (let i = 0; i < p.length - 1; i++) {
    const L = Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]);
    seg.push(L);
    tot += L;
    len.push(tot);
  }
  return { p, seg, len, tot };
}
for (const e of E) e.r = route(e);

function ptAt(r: Route, u: number): number[] {
  const d = clamp(u) * r.tot;
  for (let i = 0; i < r.seg.length; i++) {
    const s = r.len[i] - r.seg[i];
    if (d <= r.len[i] || i === r.seg.length - 1) {
      const k = r.seg[i] ? (d - s) / r.seg[i] : 0;
      return [lerp(r.p[i][0], r.p[i + 1][0], k), lerp(r.p[i][1], r.p[i + 1][1], k)];
    }
  }
  return r.p[r.p.length - 1];
}

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

/**
 * Keyframed zoom: tight on the code panel, then out through the mesh, then out
 * again as the trading stack lands. Pulling back is what makes each new ring of
 * nodes read as "there was more all along" rather than as things being added.
 */
const ZK: number[][] = [
  [0, 2.35],
  [1250, 2.1],
  [2000, 1.52],
  [5000, 0.96],
  [8000, 0.665],
  [10000, 0.635],
];

function zoom(t: number) {
  for (let i = 0; i < ZK.length - 1; i++) {
    if (t <= ZK[i + 1][0]) {
      const k = smoothstep(range(t, ZK[i][0], ZK[i + 1][0]));
      return lerp(ZK[i][1], ZK[i + 1][1], k);
    }
  }
  return ZK[ZK.length - 1][1];
}

/* ------------------------------------------------------------------ */
/* Opening: the code panel and its shards                              */
/* ------------------------------------------------------------------ */

const CODE = [
  "class Agent {",
  "  auto plan(State& s) -> Action;",
  "  Signal infer(const Frame& f);",
  "  void publish(Topic::SIGNALS);",
  "};",
  "runtime.spawn<Agent>(n=64);",
];

const SHARDS = Array.from({ length: 52 }, () => ({
  x: (rnd() - 0.5) * 440,
  y: (rnd() - 0.5) * 230,
  ch: "{}();<>=_+*/#01".charAt((rnd() * 15) | 0),
  tg: (rnd() * 4) | 0,
  d: rnd() * 160,
}));

/** Tiles that snap into the quant tools node. */
const TILES = Array.from({ length: 8 }, (_, i) => ({
  gx: (i % 4) * 30 - 45,
  gy: ((i / 4) | 0) * 26 - 13,
  sx: (rnd() - 0.5) * 900,
  sy: (rnd() - 0.5) * 700,
  d: i * 90,
}));

/* ------------------------------------------------------------------ */
/* Overlay copy                                                        */
/* ------------------------------------------------------------------ */

const STAGES: [number, string][] = [
  [0, "AGENT RUNTIME"],
  [2000, "DISTRIBUTED MESH"],
  [5000, "TRADING STACK"],
  [8000, "ONLINE"],
];

type Chip = { text: string; accent: boolean };
const CHIPSETS: Record<string, Chip[]> = {
  a: [
    { text: "AI AGENTS", accent: true },
    { text: "ML", accent: false },
    { text: "AUTOMATION", accent: false },
  ],
  b: [
    { text: "MARKET DATA", accent: true },
    { text: "SIMULATION", accent: false },
    { text: "QUANT TOOLS", accent: true },
    { text: "LOW LATENCY", accent: false },
  ],
};

/** When each chip set is up. In and out are the class flips; the fades follow. */
const CHIP_RUNS = [
  { set: "a", in: 900, out: 2450 },
  { set: "b", in: 5150, out: 8000 },
] as const;

const SEGMENTS = ["DATA", "PIPELINE", "COMPUTE", "SIGNAL"];

/* Beats of the closing lockup, in ms. */
const T_FLASH = 8560;
const T_NAME = 8620;
const T_RULE = 9280;
const T_SUB = 9420;

/* ------------------------------------------------------------------ */

export type IntroFilm = { render: (t: number) => void };

/**
 * Build a renderer bound to one context. Static layers (scanlines, vignette,
 * corner brackets) are baked once into an offscreen canvas and blitted, so the
 * per-frame cost is the graph plus the overlays that actually move.
 */
export function createIntroFilm(ctx: CanvasRenderingContext2D, W: number, H: number): IntroFilm {
  /** Virtual height from the real panel aspect, so nothing is letterboxed. */
  const VH = (VW * H) / W;
  const S = W / VW;
  const CX = VW / 2;
  const CY = VH / 2;

  const bg = ctx.createRadialGradient(CX, VH * 0.45, 0, CX, VH * 0.45, VW * 0.62);
  bg.addColorStop(0, "#08131b");
  bg.addColorStop(0.55, "#050a0e");
  bg.addColorStop(1, "#02050a");

  const overlay = bakeOverlay(W, H, S, VW, VH);

  /* ---------------- primitives ---------------- */

  function chamfer(x: number, y: number, w: number, h: number, c: number) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + c, y - h / 2);
    ctx.lineTo(x + w / 2, y - h / 2);
    ctx.lineTo(x + w / 2, y + h / 2 - c);
    ctx.lineTo(x + w / 2 - c, y + h / 2);
    ctx.lineTo(x - w / 2, y + h / 2);
    ctx.lineTo(x - w / 2, y - h / 2 + c);
    ctx.closePath();
  }

  /** Draw text with tracking, since canvas has no reliable letterSpacing. */
  function spaced(
    text: string,
    x: number,
    y: number,
    ls: number,
    align: "left" | "center" | "right" = "left",
  ) {
    const chars = [...text];
    let w = ls * (chars.length - 1);
    for (const ch of chars) w += ctx.measureText(ch).width;

    let cx = align === "left" ? x : align === "center" ? x - w / 2 : x - w;
    const prev = ctx.textAlign;
    ctx.textAlign = "left";
    for (const ch of chars) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + ls;
    }
    ctx.textAlign = prev;
    return w;
  }

  function spacedWidth(text: string, ls: number) {
    const chars = [...text];
    let w = ls * (chars.length - 1);
    for (const ch of chars) w += ctx.measureText(ch).width;
    return w;
  }

  /* ---------------- scene ---------------- */

  function grid(s: number) {
    const step = 90;
    const ext = 1100 / s;
    const x0 = Math.ceil((-ext * 1.8) / step) * step;
    const x1 = ext * 1.8;
    const y0 = Math.ceil(-ext / step) * step;
    const y1 = ext;

    ctx.lineWidth = 1 / s;
    ctx.strokeStyle = "rgba(20,52,68,.55)";
    ctx.beginPath();
    for (let x = x0; x < x1; x += step) {
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
    }
    for (let y = y0; y < y1; y += step) {
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    }
    ctx.stroke();

    // Every fifth line, brighter: the eye needs a coarse rhythm to read the
    // zoom, and a single-density grid goes to mush as it pulls back.
    ctx.strokeStyle = "rgba(41,168,255,.13)";
    ctx.lineWidth = 1.5 / s;
    ctx.beginPath();
    for (let x = Math.ceil((-ext * 1.8) / 450) * 450; x < ext * 1.8; x += 450) {
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
    }
    for (let y = Math.ceil(-ext / 450) * 450; y < ext; y += 450) {
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
    }
    ctx.stroke();
  }

  /** Node glyphs, each drawn in roughly a 44 x 30 box around (x, y). */
  function icon(kind: IconKind, x: number, y: number, t: number, a: number, tone: Tone) {
    const c = COL[tone];
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = `rgba(${c},${a})`;
    ctx.fillStyle = `rgba(${c},${a * 0.85})`;
    ctx.lineWidth = 2;

    if (kind === "core" || kind === "agent") {
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, 7);
      ctx.fill();
      ctx.globalAlpha = a * 0.7;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 16 + i * 6, 7 + i * 3, t / 700 + i * 1.1, 0, 7);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (kind === "ml") {
      const p = [
        [-14, -9],
        [-14, 9],
        [0, -12],
        [0, 0],
        [0, 12],
        [14, -5],
        [14, 5],
      ];
      ctx.globalAlpha = a * 0.5;
      ctx.beginPath();
      for (let i = 0; i < 2; i++)
        for (let j = 2; j < 5; j++) {
          ctx.moveTo(p[i][0], p[i][1]);
          ctx.lineTo(p[j][0], p[j][1]);
        }
      for (let i = 2; i < 5; i++)
        for (let j = 5; j < 7; j++) {
          ctx.moveTo(p[i][0], p[i][1]);
          ctx.lineTo(p[j][0], p[j][1]);
        }
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (let i = 0; i < p.length; i++) {
        const f = 0.55 + 0.45 * Math.sin(t / 240 + i);
        ctx.fillStyle = `rgba(${c},${a * f})`;
        ctx.beginPath();
        ctx.arc(p[i][0], p[i][1], 3, 0, 7);
        ctx.fill();
      }
    } else if (kind === "auto") {
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 11, t / 500, t / 500 + 4.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 11, t / 500 + Math.PI, t / 500 + Math.PI + 1.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, 7);
      ctx.fill();
    } else if (kind === "api") {
      ctx.font = `500 26px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("{ }", 0, 1);
    } else if (kind === "kafka" || kind === "feed") {
      for (let i = 0; i < 4; i++) {
        const o = (t / 9 + i * 40) % 80;
        ctx.globalAlpha = a * (0.35 + 0.65 * Math.sin(i * 1.7 + t / 300) ** 2);
        ctx.fillRect(-22 + (o % 44), -11 + i * 7, 14, 3);
      }
      ctx.globalAlpha = 1;
    } else if (kind === "box") {
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) {
          const f = (Math.sin(t / 230 + i * 1.3 + j * 2.1) + 1) / 2;
          ctx.fillStyle = `rgba(${c},${a * (0.22 + 0.78 * f)})`;
          ctx.fillRect(-19 + i * 13, -13 + j * 13, 9, 9);
        }
    } else if (kind === "db") {
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, -9 + i * 9, 16, 5, 0, 0, 7);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-16, -9);
      ctx.lineTo(-16, 9);
      ctx.moveTo(16, -9);
      ctx.lineTo(16, 9);
      ctx.stroke();
    } else if (kind === "rack") {
      for (let i = 0; i < 3; i++) {
        ctx.strokeRect(-20, -14 + i * 10, 40, 8);
        const f = (Math.sin(t / 180 + i * 2) + 1) / 2;
        ctx.fillStyle = `rgba(${c},${a * (0.3 + 0.7 * f)})`;
        ctx.fillRect(13, -12 + i * 10, 4, 4);
      }
    } else if (kind === "sim") {
      ctx.lineWidth = 1.6;
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = a * (0.35 + k * 0.25);
        ctx.beginPath();
        for (let i = -22; i <= 22; i += 2) {
          const yy = Math.sin(i / 7 + k * 1.4 + t / 400) * (5 + k * 2);
          if (i === -22) ctx.moveTo(i, yy);
          else ctx.lineTo(i, yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const sx = -22 + ((t / 6) % 44);
      ctx.fillStyle = `rgba(${c},${a})`;
      ctx.fillRect(sx, -14, 1.5, 28);
    } else if (kind === "exec") {
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, -7);
      ctx.lineTo(20, 0);
      ctx.lineTo(6, 7);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "exch") {
      ctx.lineWidth = 2;
      ctx.strokeRect(-14, -12, 28, 24);
      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.lineTo(14, -4);
      ctx.moveTo(0, -12);
      ctx.lineTo(0, 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawNode(n: GNode, t: number, wave: number) {
    const app = range(t, n.t0, n.t0 + 430);
    if (app <= 0) return;

    const a = eOut(app);
    const sc = lerp(0.82, 1, eOut(app));
    const c = COL[n.tone];

    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.scale(sc, sc);
    ctx.translate(-n.x, -n.y);

    chamfer(n.x, n.y, n.w, n.h, 12);
    ctx.fillStyle = `rgba(6,17,24,${0.93 * a})`;
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = `rgba(${c},${(0.55 + 0.45 * wave) * a})`;
    ctx.stroke();
    if (wave > 0.02) {
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = `rgba(230,255,255,${wave * a * 0.8})`;
      ctx.stroke();
    }

    // Header rail down the leading edge.
    ctx.fillStyle = `rgba(${c},${0.35 * a})`;
    ctx.fillRect(n.x - n.w / 2, n.y - n.h / 2, 3, n.h);

    if (n.id === "m3") {
      for (const T of TILES) {
        const k = eOut(range(t, n.t0 + 160 + T.d, n.t0 + 780 + T.d));
        const x = n.x + lerp(T.sx, T.gx, k);
        const y = n.y + 8 + lerp(T.sy, T.gy, k);
        ctx.fillStyle = `rgba(61,245,192,${(0.25 + 0.6 * k) * a})`;
        ctx.fillRect(x - 11, y - 9, 22, 18);
        ctx.strokeStyle = `rgba(61,245,192,${0.8 * k * a})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 11, y - 9, 22, 18);
      }
      ctx.fillStyle = `rgba(223,243,255,${a})`;
      ctx.font = `500 21px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.label, n.x, n.y - n.h / 2 + 18);
      ctx.restore();
      return;
    }

    icon(n.icon, n.x - n.w / 2 + 34, n.y, t, a, n.tone);
    ctx.fillStyle = `rgba(223,243,255,${0.94 * a})`;
    ctx.font = `500 21px ${MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(n.label, n.x - n.w / 2 + 62, n.y + 1);
    ctx.restore();
  }

  function drawEdge(e: GEdge, t: number, wave: number, surge: number) {
    const app = range(t, e.t0, e.t0 + 500);
    if (app <= 0) return;

    const r = e.r;
    const c = COL[e.tone];

    // The path draws itself on, so a link reads as being established.
    ctx.beginPath();
    ctx.moveTo(r.p[0][0], r.p[0][1]);
    const steps = 26;
    for (let i = 1; i <= steps; i++) {
      const q = ptAt(r, (i / steps) * app);
      ctx.lineTo(q[0], q[1]);
    }
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = `rgba(${c},${0.22 + 0.5 * wave})`;
    ctx.stroke();
    if (app < 1) return;

    // Packets. Count and speed both scale with the link's rate, so a hot path
    // looks hot rather than just being labelled as one.
    const n = e.rate > 1.5 ? 4 : e.rate > 1.2 ? 3 : 2;
    const sp = (0.00028 + 0.00016 * surge) * e.rate * (1 + wave * 2);
    for (let k = 0; k < n; k++) {
      const u = ((t - e.t0) * sp + k / n) % 1;
      const p1 = ptAt(r, u);
      const p0 = ptAt(r, Math.max(0, u - 0.055));
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(${c},.22)`;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
      ctx.strokeStyle = `rgba(235,255,255,${0.75 + 0.25 * wave})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
      ctx.lineCap = "butt";
    }
  }

  function drawCode(t: number) {
    const a = t < 1150 ? 1 : 1 - range(t, 1150, 1370);
    if (a <= 0) return;

    ctx.save();
    chamfer(0, 0, 540, 300, 18);
    ctx.fillStyle = `rgba(6,17,24,${0.94 * a})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(41,168,255,${0.5 * a})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = `rgba(41,168,255,${0.16 * a})`;
    ctx.fillRect(-270, -150, 540, 34);
    ctx.fillStyle = `rgba(159,216,255,${0.9 * a})`;
    ctx.font = `500 17px ${MONO}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("agent_runtime.cpp", -252, -133);

    ctx.font = `400 19px ${MONO}`;
    for (let i = 0; i < CODE.length; i++) {
      const k = range(t, 90 + i * 140, 310 + i * 140);
      const s = CODE[i].slice(0, Math.ceil(CODE[i].length * k));
      ctx.fillStyle = `rgba(78,110,132,${0.8 * a})`;
      ctx.fillText(String(i + 1).padStart(2, "0"), -250, -88 + i * 38);
      ctx.fillStyle = `rgba(${i % 2 ? "61,245,192" : "201,231,255"},${0.95 * a})`;
      ctx.fillText(s, -208, -88 + i * 38);
      if (k > 0 && k < 1) {
        ctx.fillStyle = `rgba(61,245,192,${a})`;
        ctx.fillRect(-208 + ctx.measureText(s).width + 2, -98 + i * 38, 10, 20);
      }
    }
    ctx.restore();
  }

  /** The panel breaks up and its characters fly into the four agents. */
  function drawShards(t: number) {
    const k = range(t, 1120, 1640);
    if (k <= 0 || k >= 1) return;

    const tgt = ["a1", "a2", "a3", "a4"];
    ctx.font = `500 20px ${MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const s of SHARDS) {
      const u = eOut(range(t, 1120 + s.d, 1540 + s.d));
      if (u <= 0) continue;
      const n = N[tgt[s.tg]];
      ctx.fillStyle = `rgba(61,245,192,${(1 - u) * 0.9})`;
      ctx.fillText(s.ch, lerp(s.x, n.x, u), lerp(s.y, n.y, u));
    }
  }

  /** Orders leaving execution for the exchange, each one ringing on arrival. */
  function beams(t: number) {
    const shots = [6700, 7050, 7300, 7520, 7700, 7860];
    const m4 = N.m4;
    const m5 = N.m5;
    for (const s of shots) {
      const d = t - s;
      if (d < 0 || d > 420) continue;
      const k = d / 420;
      const a = (1 - k) * (1 - k);
      const hx = lerp(m4.x, m5.x, eOut(k));
      const hy = lerp(m4.y, m5.y, eOut(k));

      ctx.strokeStyle = `rgba(235,255,255,${a})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lerp(m4.x, hx, 0.55), lerp(m4.y, hy, 0.55));
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.lineCap = "butt";

      ctx.strokeStyle = `rgba(61,245,192,${a * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(m5.x, m5.y, 20 + eOut(k) * 150, 0, 7);
      ctx.stroke();
    }
  }

  /* ---------------- overlays ---------------- */

  function hud(t: number) {
    const th = Math.min(t, 10000);

    let system = STAGES[0][1];
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (t >= STAGES[i][0]) {
        system = STAGES[i][1];
        break;
      }
    }

    const lat = 940 * Math.pow(1 - th / 10000, 3.6) + 0.84;
    const msg = Math.floor(Math.pow(clamp(th / 9000), 2.4) * 9.4e6).toLocaleString("en-US");

    const block = (
      label: string,
      value: string,
      x: number,
      top: number,
      align: "left" | "right",
    ) => {
      ctx.textBaseline = "top";
      ctx.font = `400 14px ${MONO}`;
      ctx.fillStyle = "rgba(61,101,121,1)";
      spaced(label, x, top, 2.5, align);
      ctx.font = `500 23px ${MONO}`;
      ctx.fillStyle = "rgba(61,245,192,1)";
      spaced(value, x, top + 23, 1.15, align);
    };

    block("SYSTEM", system, 58, 46, "left");
    block("TICK → ORDER", lat < 10 ? lat.toFixed(2) + " µs" : lat.toFixed(0) + " µs", VW - 58, 46, "right");
    block("MSG / SEC", msg, VW - 58, VH - 120 - 51, "right");
  }

  function chips(t: number) {
    for (const run of CHIP_RUNS) {
      const out = 1 - smoothstep(range(t, run.out, run.out + 320));
      if (out <= 0 && t > run.out) continue;

      const set = CHIPSETS[run.set];
      let x = 58;
      for (let i = 0; i < set.length; i++) {
        const c = set[i];
        const inK = smoothstep(range(t, run.in + 90 + i * 110, run.in + 390 + i * 110));
        const a = inK * out;

        ctx.font = `400 14px ${MONO}`;
        const w = spacedWidth(c.text, 3.4) + 28;
        if (a > 0.002) {
          const y = VH - 120 - 34 + (1 - inK) * 10;
          ctx.globalAlpha = a;
          ctx.fillStyle = "rgba(6,16,23,.8)";
          ctx.fillRect(x, y, w, 34);
          ctx.strokeStyle = c.accent ? "rgba(61,245,192,.45)" : "rgba(41,168,255,.35)";
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 33);
          ctx.fillStyle = c.accent ? "#8ff5d8" : "#9fd8ff";
          ctx.textBaseline = "middle";
          spaced(c.text, x + 14, y + 18, 3.4, "left");
          ctx.globalAlpha = 1;
        }
        x += w + 12;
      }
    }
  }

  function strip(t: number) {
    const a = smoothstep(range(t, 2350, 2650)) * (1 - smoothstep(range(t, 5050, 5350)));
    if (a <= 0.002) return;

    ctx.globalAlpha = a;
    ctx.textBaseline = "middle";
    const y = VH - 120 - 13;

    // Measure first so the whole strip can be centred as one run.
    ctx.font = `400 19px ${MONO}`;
    const segW = SEGMENTS.map((s) => spacedWidth(s, 6.5));
    ctx.font = `400 16px ${MONO}`;
    const arrowW = ctx.measureText("→").width;
    const total =
      segW.reduce((p, q) => p + q, 0) + (SEGMENTS.length - 1) * (arrowW + 40);

    let x = CX - total / 2;
    for (let i = 0; i < SEGMENTS.length; i++) {
      const lit =
        smoothstep(range(t, 2600 + i * 560, 2850 + i * 560)) *
        (1 - smoothstep(range(t, 5050, 5300)));

      ctx.font = `400 19px ${MONO}`;
      if (lit > 0.02) {
        ctx.shadowColor = "rgba(61,245,192,.65)";
        ctx.shadowBlur = 22 * lit;
      }
      // Cross-fade the two states rather than snapping between them.
      ctx.globalAlpha = a * (1 - lit);
      ctx.fillStyle = "rgba(29,58,74,1)";
      spaced(SEGMENTS[i], x, y, 6.5, "left");
      ctx.globalAlpha = a * lit;
      ctx.fillStyle = "rgba(61,245,192,1)";
      spaced(SEGMENTS[i], x, y, 6.5, "left");
      ctx.shadowBlur = 0;
      ctx.globalAlpha = a;

      x += segW[i];
      if (i < SEGMENTS.length - 1) {
        ctx.font = `400 16px ${MONO}`;
        ctx.fillStyle = "rgba(29,58,74,1)";
        ctx.textAlign = "left";
        ctx.fillText("→", x + 20, y);
        x += arrowW + 40;
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Layout of the closing block, measured once per call rather than guessed. */
  function lockup(t: number) {
    const scrim = smoothstep(range(t, T_FLASH, T_FLASH + 550));
    if (scrim > 0.002) {
      const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, VW * 0.42);
      g.addColorStop(0, `rgba(5,10,14,${0.94 * scrim})`);
      g.addColorStop(1, `rgba(5,10,14,${0.7 * scrim})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VW, VH);
    }

    const size = 96;
    const line = size * 1.16;
    const ls = size * 0.07;
    const subSize = 26;

    const blockH = MSG.length * line + 36 + 1 + 26 + subSize * 1.4;
    const top = CY - blockH / 2;

    ctx.textBaseline = "middle";
    ctx.font = `600 ${size}px ${DISPLAY}`;

    for (let li = 0; li < MSG.length; li++) {
      const text = MSG[li];
      const chars = [...text];
      const w = spacedWidth(text, ls);
      let x = CX - w / 2;
      const y = top + line * (li + 0.5);

      for (let ci = 0; ci < chars.length; ci++) {
        const ch = chars[ci];
        const cw = ctx.measureText(ch).width;
        const k = eOut(range(t, T_NAME + li * 200 + ci * 26, T_NAME + 500 + li * 200 + ci * 26));
        if (k > 0.002) {
          // Rise plus a glow that tightens as it lands. Stands in for the
          // blur-in of the original at a fraction of the per-frame cost.
          const glow = 1 - k;
          ctx.shadowColor = "rgba(41,168,255,.55)";
          ctx.shadowBlur = 46 * k + 30 * glow;
          ctx.fillStyle = li === MSG.length - 1 ? `rgba(234,252,255,${k})` : `rgba(223,243,255,${k})`;
          ctx.textAlign = "left";
          ctx.fillText(ch, x, y + 26 * (1 - k));
          ctx.shadowBlur = 0;
        }
        x += cw + ls;
      }
    }

    const ruleY = top + MSG.length * line + 36;
    const ruleW = 700 * easeInOutCubic(range(t, T_RULE, T_RULE + 1000));
    if (ruleW > 1) {
      const g = ctx.createLinearGradient(CX - ruleW / 2, 0, CX + ruleW / 2, 0);
      g.addColorStop(0, "rgba(41,168,255,0)");
      g.addColorStop(0.35, "rgba(41,168,255,1)");
      g.addColorStop(0.65, "rgba(61,245,192,1)");
      g.addColorStop(1, "rgba(61,245,192,0)");
      ctx.fillStyle = g;
      ctx.shadowColor = "rgba(61,245,192,.6)";
      ctx.shadowBlur = 20;
      ctx.fillRect(CX - ruleW / 2, ruleY, ruleW, 1.5);
      ctx.shadowBlur = 0;
    }

    const subA = smoothstep(range(t, T_SUB + 100, T_SUB + 700));
    if (subA > 0.002) {
      // Tracking opens as it fades up, the way the original's letter-spacing
      // transition does. It is the whole gesture of the line.
      const track = lerp(subSize * 0.2, subSize * 0.58, easeInOutCubic(range(t, T_SUB, T_SUB + 900)));
      ctx.font = `400 ${subSize}px ${MONO}`;
      ctx.fillStyle = `rgba(137,184,208,${subA})`;
      spaced(SUB, CX, ruleY + 26 + (subSize * 1.4) / 2, track, "center");
    }

    // The cut: a hard white frame that decays, hiding the switch from graph to
    // statement. Without it the scrim reads as a fade rather than an edit.
    const flash = t < T_FLASH ? 0 : 0.55 * (1 - range(t, T_FLASH, T_FLASH + 500));
    if (flash > 0.002) {
      ctx.fillStyle = `rgba(234,252,255,${flash})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  /* ---------------- frame ---------------- */

  function render(t: number) {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, VW, VH);

    const s = zoom(t);
    /**
     * After the last node lands, one ring sweeps out from the core and lights
     * everything it crosses: the moment the whole thing is shown to be one
     * system rather than a collection of boxes.
     */
    const wavePos = t > 7950 ? lerp(2100, 0, easeInOutCubic(range(t, 7950, 8570))) : -1;
    const surge = clamp(range(t, 4900, 7400)) * 1.6 + (t > 7950 ? 2.2 : 0);
    const waveAt = (d: number) =>
      wavePos < 0 ? 0 : Math.exp(-Math.pow((d - wavePos) / 260, 2));

    ctx.save();
    ctx.translate(CX + Math.sin(t / 1900) * 10, CY + Math.cos(t / 2300) * 8);
    ctx.scale(s, s);

    grid(s);

    ctx.globalCompositeOperation = "lighter";
    for (const e of E) {
      const mid = ptAt(e.r, 0.5);
      drawEdge(e, t, waveAt(Math.hypot(mid[0], mid[1])), surge);
    }

    ctx.globalCompositeOperation = "source-over";
    for (const k in N) {
      const n = N[k];
      drawNode(n, t, waveAt(Math.hypot(n.x, n.y)));
    }

    ctx.globalCompositeOperation = "lighter";
    beams(t);
    if (wavePos >= 0) {
      ctx.strokeStyle = `rgba(61,245,192,${0.55 * (1 - range(t, 7950, 8650))})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(4, wavePos), 0, 7);
      ctx.stroke();
    }
    drawCode(t);
    drawShards(t);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();

    // Baked, static: scanlines, vignette, corner brackets.
    ctx.drawImage(overlay, 0, 0, VW, VH);

    hud(t);
    chips(t);
    strip(t);
    lockup(t);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  return { render };
}

/**
 * Scanlines, vignette and the four corner brackets never change, so they are
 * drawn once into their own canvas and blitted per frame instead of being
 * rebuilt. The scanlines in particular are hundreds of rects.
 */
function bakeOverlay(W: number, H: number, S: number, VW: number, VH: number) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return c;

  g.setTransform(S, 0, 0, S, 0, 0);

  g.fillStyle = "rgba(41,168,255,.05)";
  for (let y = 0; y < VH; y += 3) g.fillRect(0, y, VW, 1);

  const vig = g.createRadialGradient(VW / 2, VH / 2, 0, VW / 2, VH / 2, VW * 0.575);
  vig.addColorStop(0.42, "rgba(0,0,0,0)");
  vig.addColorStop(0.8, "rgba(0,0,0,.6)");
  vig.addColorStop(1, "rgba(0,0,0,1)");
  g.fillStyle = vig;
  g.fillRect(0, 0, VW, VH);

  g.strokeStyle = "rgba(61,245,192,.35)";
  g.lineWidth = 1;
  const m = 36;
  const L = 34;
  const corner = (x: number, y: number, sx: number, sy: number) => {
    g.beginPath();
    g.moveTo(x + sx * L, y);
    g.lineTo(x, y);
    g.lineTo(x, y + sy * L);
    g.stroke();
  };
  corner(m, m, 1, 1);
  corner(VW - m, m, -1, 1);
  corner(m, VH - m, 1, -1);
  corner(VW - m, VH - m, -1, -1);

  return c;
}
