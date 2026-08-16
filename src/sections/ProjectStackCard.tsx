import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ProjectDetail } from "../config/projects";
import { ArchitectureDiagram } from "./ArchitectureDiagram";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * One card in the overlapping deck.
 *
 * The card carries everything: spine when closed, full write-up and the
 * architecture diagram when open. There is no dialog any more, so nothing about
 * a project lives outside the card that represents it.
 *
 * Height is animated rather than transformed. That is against the usual
 * transform-only rule, but a layout animation on height scales the contents,
 * which visibly distorts the diagram's text. For an accordion the honest height
 * animation is the right trade, so it is kept short and drops to zero under
 * reduced motion.
 */
export function ProjectStackCard({
  detail,
  index,
  total,
  active,
  hovered,
  offset,
  onToggle,
  onHover,
}: {
  detail: ProjectDetail;
  index: number;
  total: number;
  active: boolean;
  hovered: boolean;
  /** Pull into the card above. Set on the li so ul > li stays valid. */
  offset: string;
  onToggle: () => void;
  onHover: (on: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const bodyId = `project-body-${detail.id}`;
  const spineId = `project-spine-${detail.id}`;

  const lifted = active || hovered;

  return (
    <motion.li
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      animate={reduce ? undefined : { y: hovered && !active ? -8 : 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative list-none"
      style={{
        marginTop: offset,
        // Later cards sit on top, so the deck fans downward and each card's
        // top edge stays legible. The open card outranks all of them.
        zIndex: active ? total + 2 : hovered ? total + 1 : index + 1,
      }}
    >
      <div
        className={`rounded-2xl border backdrop-blur-sm transition-colors duration-300 ${
          active
            ? "border-white/20 bg-[#14161d]"
            : lifted
              ? "border-white/18 bg-[#111319]"
              : "border-white/10 bg-[#0f1116]"
        }`}
        style={{
          // Tinted to the page rather than pure black, and thrown upward so it
          // separates each card from the one it overlaps.
          boxShadow: lifted
            ? "0 -22px 50px -24px rgba(4,7,14,0.95), 0 18px 44px -30px rgba(4,7,14,0.9)"
            : "0 -16px 36px -24px rgba(4,7,14,0.9)",
        }}
      >
        {/* ---------------- Spine ---------------- */}
        <button
          id={spineId}
          type="button"
          onClick={onToggle}
          aria-expanded={active}
          aria-controls={bodyId}
          className="flex w-full items-center gap-5 rounded-2xl px-6 py-6 text-left outline-none focus-visible:ring-2 focus-visible:ring-bright/60 md:gap-8 md:px-9 md:py-7"
        >
          <span className="font-mono text-[11px] tabular-nums text-muted/45">
            {String(index + 1).padStart(2, "0")}
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3
                className={`font-mono text-[1.15rem] leading-tight tracking-tight transition-colors duration-300 md:text-[1.3rem] ${
                  lifted ? "text-bright" : "text-bright/85"
                }`}
              >
                {detail.name}
              </h3>
              {detail.status === "Production" ? (
                <span className="rounded-full border border-emerald-400/25 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.16em] text-emerald-300/70">
                  Production
                </span>
              ) : (
                <span className="rounded-full border border-white/12 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.16em] text-muted/60">
                  Personal
                </span>
              )}
            </span>
            <span className="mt-2 block font-sans text-[10px] uppercase tracking-[0.2em] text-muted/55">
              {detail.category}
            </span>
          </span>

          {/* Headline metric doubles as the closed card's reason to be opened. */}
          <span className="hidden shrink-0 text-right sm:block">
            <span className="block font-mono text-[1.05rem] text-bright/90">
              {detail.metrics[0]?.value}
            </span>
            <span className="mt-1 block font-sans text-[9px] uppercase tracking-[0.16em] text-muted/50">
              {detail.metrics[0]?.label}
            </span>
          </span>

          <motion.span
            aria-hidden
            animate={reduce ? undefined : { rotate: active ? 180 : 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className={`shrink-0 transition-colors duration-300 ${lifted ? "text-bright" : "text-muted/50"}`}
          >
            <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
              <path
                d="M1 1l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.span>
        </button>

        {/* ---------------- Body ---------------- */}
        <AnimatePresence initial={false}>
          {active ? (
            <motion.div
              key="body"
              id={bodyId}
              role="region"
              aria-labelledby={spineId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: reduce ? 0 : 0.5, ease: EASE },
                // Exit shorter than enter, so collapsing feels responsive.
                opacity: { duration: reduce ? 0 : 0.3 },
              }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/8 px-6 pb-8 pt-7 md:px-9 md:pb-10">
                <p className="max-w-2xl font-mono text-[0.9rem] leading-relaxed text-bright/80">
                  {detail.tagline}
                </p>

                {/* Divided row rather than a grid of equal boxes: these are
                    figures, not cards, and boxing them adds noise. */}
                <dl className="mt-7 flex flex-wrap gap-y-4 border-y border-white/8 py-5">
                  {detail.metrics.map((m) => (
                    <div key={m.label} className="min-w-[9rem] flex-1 border-l border-white/10 px-4 first:border-l-0 first:pl-0">
                      <dt className="font-sans text-[9px] uppercase tracking-[0.16em] text-muted/55">
                        {m.label}
                      </dt>
                      <dd className="mt-1.5 font-mono text-[1.1rem] text-bright">{m.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8">
                  <ArchitectureDiagram diagram={detail.diagram} />
                </div>

                <div className="mt-9 grid gap-8 md:grid-cols-2">
                  <div>
                    <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted/55">
                      Problem
                    </h4>
                    <p className="mt-3 font-mono text-[0.85rem] leading-relaxed text-muted">
                      {detail.problem}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted/55">
                      Approach
                    </h4>
                    <p className="mt-3 font-mono text-[0.85rem] leading-relaxed text-muted">
                      {detail.approach}
                    </p>
                  </div>
                </div>

                <ul className="mt-9 divide-y divide-white/8 border-t border-white/8">
                  {detail.decisions.map((d) => (
                    <li key={d.title} className="py-5">
                      <h4 className="font-mono text-[0.9rem] text-bright">{d.title}</h4>
                      <p className="mt-2.5 max-w-3xl font-mono text-[0.82rem] leading-relaxed text-muted/85">
                        {d.body}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-wrap items-center gap-2">
                  {detail.stack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/12 px-2.5 py-1 font-mono text-[10px] text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {detail.proprietary ? (
                  <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.16em] text-muted/40">
                    Proprietary work. Architecture shown, implementation withheld.
                  </p>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}
