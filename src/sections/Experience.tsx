import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { roles } from "../config/content";
import { SectionHeading } from "./SectionHeading";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The arc: work history told as a story rather than listed as a record.
 *
 * Three deliberate departures from a CV section:
 *
 *   Not labelled as a record. "Work Experience" framed everything under it as
 *   something to be checked; an escalation path frames it as stakes that climb.
 *
 *   Company leads, beat follows. The employer is the chapter heading and takes
 *   the size; the beat sits under it, set smaller and rule-marked, as the line
 *   that says what that chapter demanded.
 *
 *   Chronological. Oldest first, so top to bottom is an ascent ending on the
 *   current role, rather than a reverse-chronological list ending on an
 *   internship.
 *
 * The thread down the left fills with scroll position so the arc has a visible
 * direction, and each year sticks while its own chapter is in view before
 * handing off to the next.
 */
export function Experience() {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const list = useRef<HTMLOListElement>(null);

  const { scrollYProgress } = useScroll({
    target: list,
    offset: ["start 85%", "end 65%"],
  });
  // Damped, so the thread trails the scroll rather than tracking it rigidly.
  // Same feel as the hero's scrub.
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });

  return (
    <section id="experience" aria-label="Career" className="relative z-10 bg-stage">
      <div className="mx-auto w-full max-w-5xl px-5 pb-32 md:px-8 md:pb-44">
        {/*
          Same eyebrow-and-title format as the projects section, so the two read
          as siblings. "Escalation path" is an on-call term for who gets woken
          next as severity climbs, and it doubles as the shape of the section.

          The title stays in that same on-call vocabulary: blast radius is what
          a failure reaches, and it is the one thing that grows across all three
          chapters. Past tense, because the growing has not stopped.
        */}
        <SectionHeading label="Escalation path" title="The blast radius kept growing." />

        <ol ref={list} className="relative">
          {/* The thread: unlit track, then the lit fill on top of it. Sits on
              the column divider on desktop, at the text edge on mobile. */}
          <span
            aria-hidden
            className="absolute bottom-0 left-0 top-0 w-px bg-white/8 md:left-[7.5rem]"
          />
          <motion.span
            aria-hidden
            style={reduce ? { scaleY: 1 } : { scaleY: fill }}
            className="absolute bottom-0 left-0 top-0 w-px origin-top bg-gradient-to-b from-bright/45 via-bright/25 to-transparent md:left-[7.5rem]"
          />

          {roles.map((r) => {
            const lit = hover === r.company;
            return (
              <motion.li
                key={r.company}
                onPointerEnter={() => setHover(r.company)}
                onPointerLeave={() => setHover(null)}
                initial={reduce ? false : { opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.85, ease: EASE }}
                className="relative grid grid-cols-1 gap-6 pb-24 pl-8 last:pb-0 md:grid-cols-[7.5rem_1fr] md:gap-0 md:pb-36 md:pl-0"
              >
                {/* Node where this chapter meets the thread. */}
                <span
                  aria-hidden
                  className={`absolute left-0 top-3 h-2 w-2 -translate-x-1/2 rounded-full transition-colors duration-500 md:left-[7.5rem] ${
                    lit ? "bg-bright" : "bg-bright/40"
                  }`}
                />

                {/* Year, sticky for the length of its own chapter. */}
                <div className="md:sticky md:top-32 md:h-fit md:pr-12">
                  <span
                    className={`font-mono text-[1.6rem] tabular-nums tracking-tight transition-colors duration-500 md:text-[2rem] ${
                      lit ? "text-bright" : "text-bright/35"
                    }`}
                  >
                    {r.year}
                  </span>
                  {r.current ? (
                    <span className="mt-2 flex items-center gap-1.5 font-sans text-[9px] uppercase tracking-[0.18em] text-emerald-300/80">
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
                      Now
                    </span>
                  ) : null}
                </div>

                <div className="md:pl-12">
                  {/*
                    Company first and set large: it is the chapter's heading, so
                    it carries the size and the semantics. It used to be folded
                    into a small metadata line under the beat, where the three
                    employers were the least visible thing in the section.
                  */}
                  <h3
                    className={`font-mono text-[1.35rem] leading-tight tracking-tight transition-colors duration-500 md:text-[1.7rem] ${
                      lit ? "text-bright" : "text-bright/90"
                    }`}
                  >
                    {r.company}
                  </h3>

                  <p
                    className={`mt-2.5 font-sans text-[10px] uppercase tracking-[0.22em] transition-colors duration-500 ${
                      lit ? "text-muted" : "text-muted/55"
                    }`}
                  >
                    {r.title} · {r.period}
                  </p>

                  {/* The beat now follows the company, and is set smaller than
                      it so the two do not compete. */}
                  <p className="mt-7 max-w-2xl border-l border-white/12 pl-5 font-mono text-[clamp(1rem,2.1vw,1.35rem)] leading-[1.45] tracking-tight text-bright/85">
                    {r.beat}
                  </p>

                  <p className="mt-6 max-w-xl font-mono text-[0.88rem] leading-relaxed text-muted">
                    {r.summary}
                  </p>

                  <ul className="mt-8 max-w-2xl">
                    {r.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex gap-4 border-t border-white/6 py-3.5 font-mono text-[0.82rem] leading-relaxed text-muted/80"
                      >
                        <span
                          aria-hidden
                          className={`mt-[0.6rem] h-px w-4 shrink-0 transition-colors duration-500 ${
                            lit ? "bg-bright/50" : "bg-white/18"
                          }`}
                        />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
