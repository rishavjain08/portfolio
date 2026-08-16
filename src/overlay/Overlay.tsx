import { content } from "../config/content";
import { scrollHintOpacityAt } from "../lib/timeline";
import { ScrollHint } from "./ScrollHint";

type Props = {
  /** Coarse progress, derived from bucketed state rather than the raw ref. */
  p: number;
  compact: boolean;
};

/**
 * The hero overlay, now only a scroll hint and the accessible heading.
 *
 * The greeting itself moved onto the laptop display, which is a canvas texture
 * inside the WebGL scene and therefore invisible to screen readers and to
 * crawlers. The sr-only heading below is the only machine-readable copy of the
 * name and role in the hero, so it stays whether or not anything is drawn.
 */
export function Overlay({ p, compact }: Props) {
  return (
    <>
      <section id="hero-copy" aria-label="Introduction">
        <h1 className="sr-only">
          Hey, I&rsquo;m {content.name}, {content.role} from {content.city}
        </h1>
      </section>

      {/*
        Bottom edge dissolve for the handoff into the projects.

        The dolly ends with the display filling the frame, so when the pin
        releases and the panel slides away its lower edge meets the projects
        background as a hard step: measured #2c2f34 against #0f0f12, 95 levels
        across three pixels. This fades that edge into the page colour instead.

        It arms only once the dolly has finished, so it never vignettes the
        laptop while the camera is still moving.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[32vh] transition-opacity duration-700 ease-out"
        style={{
          opacity: p >= 0.98 ? 1 : 0,
          // Explicit gradient rather than bg-gradient-to-b: that is the v3 name,
          // renamed to bg-linear-* in Tailwind v4, and it compiled to nothing.
          background: "linear-gradient(to bottom, transparent 0%, var(--color-stage) 88%)",
        }}
      />

      {!compact ? <ScrollHint opacity={scrollHintOpacityAt(p)} /> : null}
    </>
  );
}
