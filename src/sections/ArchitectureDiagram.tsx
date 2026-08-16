import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Diagram, DiagramNode, NodeKind } from "../config/projects";

const VIEW_W = 1000;
const VIEW_H = 520;
const NODE_H = 58;
const PAD_X = 26;
const CHAR_W = 7.1;

/**
 * Node kinds carry meaning, so they get distinct hues rather than decoration.
 * Colours are literals here rather than CSS variables: this renders inside a
 * dialog over the stage, and the palette needs to hold regardless of what the
 * hero's scroll-driven tokens are doing behind it.
 */
const KIND: Record<NodeKind, { stroke: string; fill: string; label: string }> = {
  source: { stroke: "#67d8ee", fill: "rgba(103,216,238,0.09)", label: "Source" },
  queue: { stroke: "#7f9cff", fill: "rgba(127,156,255,0.10)", label: "Stream" },
  compute: { stroke: "#9aa6bb", fill: "rgba(154,166,187,0.06)", label: "Compute" },
  agent: { stroke: "#a98cff", fill: "rgba(169,140,255,0.12)", label: "Agent" },
  store: { stroke: "#7f9cff", fill: "rgba(127,156,255,0.07)", label: "Storage" },
  sink: { stroke: "#67d8ee", fill: "rgba(103,216,238,0.06)", label: "Consumer" },
  edge: { stroke: "#6f7686", fill: "rgba(111,118,134,0.05)", label: "Edge" },
};

const nodeWidth = (n: DiagramNode) =>
  Math.max(128, Math.round(Math.max(n.label.length, (n.sub?.length ?? 0) * 0.82) * CHAR_W + PAD_X * 2));

/** Point where a line leaving `node` toward (tx, ty) crosses the node's box. */
function anchor(node: DiagramNode, tx: number, ty: number) {
  const w = nodeWidth(node) / 2 + 8;
  const h = NODE_H / 2 + 8;
  const dx = tx - node.x;
  const dy = ty - node.y;
  if (dx === 0 && dy === 0) return { x: node.x, y: node.y };

  const scale = Math.min(
    dx === 0 ? Infinity : w / Math.abs(dx),
    dy === 0 ? Infinity : h / Math.abs(dy),
  );
  return { x: node.x + dx * scale, y: node.y + dy * scale };
}

export function ArchitectureDiagram({ diagram }: { diagram: Diagram }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);

  const nodeMap = useMemo(() => new Map(diagram.nodes.map((n) => [n.id, n])), [diagram.nodes]);

  const paths = useMemo(
    () =>
      diagram.edges.flatMap((edge, i) => {
        const a = nodeMap.get(edge.from);
        const b = nodeMap.get(edge.to);
        if (!a || !b) return [];

        const from = anchor(a, b.x, b.y);
        const to = anchor(b, a.x, a.y);
        const bend = edge.bend ?? 0;

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy) || 1;
        // Control point pushed perpendicular to the segment.
        const cx = mx + (-dy / len) * bend;
        const cy = my + (dx / len) * bend;

        const d = bend
          ? `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`
          : `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

        return [{ ...edge, key: `${edge.from}-${edge.to}-${i}`, d, mid: { x: cx, y: cy }, len }];
      }),
    [diagram.edges, nodeMap],
  );

  const kinds = useMemo(() => [...new Set(diagram.nodes.map((n) => n.kind))], [diagram.nodes]);

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={diagram.caption}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="arch-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6f7686" />
            </marker>
          </defs>

          {/* ---- Edges ---- */}
          {paths.map((edge, i) => {
            const dim = active !== null && edge.from !== active && edge.to !== active;
            const lit = active !== null && !dim;
            return (
              <g key={edge.key} style={{ opacity: dim ? 0.15 : 1, transition: "opacity 300ms" }}>
                <motion.path
                  d={edge.d}
                  fill="none"
                  stroke={lit ? "#8fb4ff" : edge.control ? "#5a6172" : "rgba(255,255,255,0.18)"}
                  strokeWidth={lit ? 1.8 : 1.2}
                  strokeDasharray={edge.control ? "5 6" : undefined}
                  markerEnd="url(#arch-arrow)"
                  initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: reduce ? 0 : 0.9,
                    delay: reduce ? 0 : 0.1 + i * 0.045,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ transition: "stroke 300ms, stroke-width 300ms" }}
                />

                {/* Packets on the data plane only, so control links stay quiet. */}
                {!reduce && !edge.control ? (
                  <circle r={3.2} fill="#67d8ee">
                    <animateMotion
                      path={edge.d}
                      dur={`${Math.max(1.6, edge.len / 190)}s`}
                      begin={`${(0.9 + i * 0.4).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.95;0.95;0"
                      dur={`${Math.max(1.6, edge.len / 190)}s`}
                      begin={`${(0.9 + i * 0.4).toFixed(2)}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ) : null}

                {edge.label ? (
                  <text
                    x={edge.mid.x}
                    y={edge.mid.y - 9}
                    textAnchor="middle"
                    fontSize="10.5"
                    fill="#7d8496"
                    className="font-mono"
                  >
                    {edge.label}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* ---- Nodes ---- */}
          {diagram.nodes.map((n, i) => {
            const w = nodeWidth(n);
            const style = KIND[n.kind];
            const linked = diagram.edges
              .filter((e) => e.from === n.id || e.to === n.id)
              .flatMap((e) => [e.from, e.to]);
            const dim = active !== null && active !== n.id && !linked.includes(active);
            const isActive = active === n.id;

            return (
              <motion.g
                key={n.id}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.86 }}
                animate={{ opacity: dim ? 0.22 : 1, scale: 1 }}
                transition={{
                  duration: reduce ? 0 : 0.6,
                  delay: reduce ? 0 : i * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                  opacity: { duration: 0.3 },
                }}
                style={{ transformOrigin: `${n.x}px ${n.y}px`, cursor: "pointer" }}
                onPointerEnter={() => setActive(n.id)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(n.id)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                role="button"
                aria-label={`${n.label}${n.sub ? `, ${n.sub}` : ""}`}
              >
                <rect
                  x={n.x - w / 2}
                  y={n.y - NODE_H / 2}
                  width={w}
                  height={NODE_H}
                  rx={12}
                  fill={style.fill}
                  stroke={isActive ? style.stroke : "rgba(255,255,255,0.16)"}
                  strokeWidth={isActive ? 1.5 : 1}
                  style={{ transition: "stroke 250ms, stroke-width 250ms" }}
                />
                <circle cx={n.x - w / 2 + 14} cy={n.y - NODE_H / 2 + 14} r={3} fill={style.stroke} />

                <text
                  x={n.x}
                  y={n.sub ? n.y - 2 : n.y + 4}
                  textAnchor="middle"
                  fontSize="13.5"
                  fill="#cfe6f5"
                  fontWeight={500}
                >
                  {n.label}
                </text>
                {n.sub ? (
                  <text
                    x={n.x}
                    y={n.y + 15}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#7d8496"
                    className="font-mono"
                  >
                    {n.sub}
                  </text>
                ) : null}
              </motion.g>
            );
          })}
        </svg>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 px-5 py-3">
          {kinds.map((k) => (
            <span
              key={k}
              className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.16em] text-muted/60"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: KIND[k].stroke }} />
              {KIND[k].label}
            </span>
          ))}
          <span className="ml-auto hidden font-sans text-[10px] uppercase tracking-[0.16em] text-muted/40 sm:block">
            Hover a node to trace its links
          </span>
        </div>
      </div>

      <figcaption className="mt-3 font-sans text-[10px] uppercase tracking-[0.18em] text-muted/50">
        {diagram.caption}
      </figcaption>
    </figure>
  );
}
