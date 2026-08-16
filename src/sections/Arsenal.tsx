import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { core, domainColor, technologies, type Tech } from "../config/skills";
import { useCompactMode } from "../hooks/useCompactMode";
import { SectionHeading } from "./SectionHeading";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Orbit radii as a percentage of the square, and seconds per revolution. */
const RING_RADIUS = [21, 32.5, 43] as const;
const RING_DURATION = [88, 124, 168] as const;

/**
 * The technical arsenal, ported from the previous portfolio.
 *
 * Three orbit rings turn at different rates around a static core; every chip
 * counter-spins at its ring's rate so the labels stay upright while the ring
 * rotates. Selecting a chip swaps the detail panel beside it.
 *
 * Rotation is CSS animation rather than a frame loop on purpose: the hero
 * already drives a scroll-scrubbed WebGL scene, and two independent things
 * writing transforms every frame is the pitfall worth avoiding. The browser
 * runs these on the compositor for free.
 *
 * Small screens and reduced-motion drop the orbits entirely and fall back to a
 * wrapped chip list, which keeps every technology reachable without rotation.
 */
export function Arsenal() {
  const { isSmall, reduced } = useCompactMode();
  const [selected, setSelected] = useState<Tech>(technologies[0]);
  const spin = !isSmall && !reduced;

  return (
    <section id="arsenal" aria-label="Technical arsenal" className="relative z-10 overflow-hidden bg-stage">
      <div className="mx-auto w-full max-w-6xl px-5 pt-28 md:px-8 md:pt-40">
        <SectionHeading
          label="Technical arsenal"
          title="A system of tools, not a list of them."
          lead="Hover any technology to see where it actually runs."
        />

        <div className="mt-4 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16">
          {/* ---------------- Universe ---------------- */}
          {isSmall ? (
            <ul className="flex flex-wrap gap-2">
              {technologies.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(t)}
                    aria-pressed={selected.id === t.id}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[11px] transition-colors ${
                      selected.id === t.id
                        ? "border-white/35 text-bright"
                        : "border-white/12 text-muted"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: domainColor[t.domain] }}
                    />
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="relative mx-auto aspect-square w-full max-w-[640px]">
              {/* Orbit guides and the core's glow. */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
                <defs>
                  <radialGradient id="arsenal-core-glow">
                    <stop offset="0%" stopColor="#4c6fff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4c6fff" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="34" fill="url(#arsenal-core-glow)" />
                {RING_RADIUS.map((r) => (
                  <circle
                    key={r}
                    cx="50"
                    cy="50"
                    r={r}
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="0.15"
                    strokeDasharray="0.9 1.6"
                  />
                ))}
              </svg>

              {/* Core. Static: it is the thing the rings orbit. */}
              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="relative">
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-full"
                    style={{ boxShadow: "0 0 90px 30px rgba(76,111,255,0.28)" }}
                  />
                  <div className="rounded-full border border-white/12 bg-[#14161d] px-6 py-4 backdrop-blur-md">
                    <p className="font-mono text-sm tracking-tight text-bright">{core.label}</p>
                    <p className="mt-1 font-sans text-[9px] uppercase tracking-[0.18em] text-muted/60">
                      {core.sub}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rings. The middle one runs backwards so adjacent orbits never
                  drift in lockstep and read as one rigid body. */}
              {RING_RADIUS.map((radius, ring) => {
                const members = technologies.filter((t) => t.ring === ring);
                const duration = RING_DURATION[ring];
                const reverse = ring === 1;
                return (
                  <div
                    key={ring}
                    // Ring containers overlap each other in full. Without this
                    // the outermost one (last in the DOM) would swallow every
                    // pointer event and only its chips could be hovered.
                    className="pointer-events-none absolute inset-0"
                    style={
                      spin
                        ? {
                            animation: `orbit-spin ${duration}s linear infinite${reverse ? " reverse" : ""}`,
                          }
                        : undefined
                    }
                  >
                    {members.map((tech) => {
                      const rad = (tech.angle * Math.PI) / 180;
                      const active = selected.id === tech.id;
                      return (
                        <button
                          key={tech.id}
                          type="button"
                          onPointerEnter={() => setSelected(tech)}
                          onFocus={() => setSelected(tech)}
                          onClick={() => setSelected(tech)}
                          aria-label={`${tech.name}, ${tech.domain}`}
                          className="group pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-bright/60"
                          style={{
                            left: `${50 + Math.cos(rad) * radius}%`,
                            top: `${50 + Math.sin(rad) * radius}%`,
                          }}
                        >
                          {/* Counter-rotation, so the label stays readable. */}
                          <span
                            className="block"
                            style={
                              spin
                                ? {
                                    animation: `orbit-spin ${duration}s linear infinite${reverse ? "" : " reverse"}`,
                                  }
                                : undefined
                            }
                          >
                            <span
                              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-tight backdrop-blur-md transition-all duration-300 ${
                                active
                                  ? "scale-110 border-white/30 bg-[#14161d] text-bright"
                                  : "border-white/12 bg-stage/75 text-muted group-hover:border-white/30 group-hover:text-bright"
                              }`}
                              style={
                                active
                                  ? {
                                      boxShadow: `0 0 0 1px ${domainColor[tech.domain]}33, 0 8px 30px -8px ${domainColor[tech.domain]}`,
                                    }
                                  : undefined
                              }
                            >
                              <span
                                aria-hidden
                                className="h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-150"
                                style={{ background: domainColor[tech.domain] }}
                              />
                              {tech.name}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------------- Detail ---------------- */}
          <div className="lg:sticky lg:top-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={reduced ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduced ? undefined : { opacity: 0, y: -10, filter: "blur(8px)" }}
                transition={{ duration: reduced ? 0 : 0.4, ease: EASE }}
                className="rounded-2xl border border-white/10 bg-[#111319] p-7"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ background: domainColor[selected.domain] }}
                  />
                  <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted/60">
                    {selected.domain} · {selected.years}
                  </span>
                </div>

                <h3 className="mt-4 font-mono text-3xl tracking-tight text-bright">
                  {selected.name}
                </h3>

                <p className="mt-5 font-mono text-[0.9rem] leading-relaxed text-muted">
                  {selected.experience}
                </p>

                <dl className="mt-7 border-t border-white/10 pt-6">
                  <dt className="font-sans text-[10px] uppercase tracking-[0.18em] text-muted/60">
                    Production usage
                  </dt>
                  <dd className="mt-2 font-mono text-[0.84rem] leading-relaxed text-muted">
                    {selected.production}
                  </dd>
                </dl>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
