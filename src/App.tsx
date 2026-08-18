import { Suspense, lazy, useEffect } from "react";
import { stage } from "./config/stage";
import { useCompactMode } from "./hooks/useCompactMode";
import { useScrollProgress } from "./hooks/useScrollProgress";
import { Loader } from "./overlay/Loader";
import { Overlay } from "./overlay/Overlay";
import { Wordmark } from "./overlay/Wordmark";
import { Arsenal } from "./sections/Arsenal";
import { Experience } from "./sections/Experience";
import { Projects } from "./sections/Projects";

/** The 3D stack is its own chunk. First paint ships React + Motion only. */
const Stage = lazy(() => import("./scene/Stage"));

/** Poster mode parks the scene on the fully open lid, greeting up. */
const POSTER_PROGRESS = 0.9;

export default function App() {
  const { reduced, isSmall } = useCompactMode();

  /**
   * Only reduced-motion gets the poster. Small screens keep the scrub: the
   * hero is the page, and parking a phone on one still frame of it was the
   * reason the whole thing read as broken there. Phones get cheaper render
   * settings instead, which is Stage's business rather than the timeline's.
   */
  const { progress, containerRef, bucket, buckets } = useScrollProgress(
    stage.scrollPages,
    !reduced,
  );

  useEffect(() => {
    if (!reduced) return;
    progress.current = POSTER_PROGRESS;
  }, [reduced, progress]);

  // Coarse progress for the DOM. The raw ref stays in the render loop only, so
  // scrolling never re-renders the React tree per frame.
  const p = reduced ? 1 : bucket / buckets;

  return (
    <>
      <a
        href="#projects"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-stage focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      {/*
        The pinned stage. ScrollTrigger's pinSpacing supplies the scroll length,
        so there is no manual spacer: adding one on top of it doubled the
        document to five viewports for a three page timeline and left two
        viewports of dead scroll between the hero and the sections below.
      */}
      <div
        ref={containerRef}
        className="relative z-10 h-[100dvh] w-full overflow-hidden bg-stage"
      >
        {/* Inside the pinned container rather than fixed to the viewport, so
            it belongs to the hero and leaves with it. As a fixed element it
            stayed on top of every section below and collided with the project
            cards, which on a phone is most of the page. */}
        <Wordmark />

        <Suspense fallback={<Loader />}>
          <Stage progress={progress} reduced={reduced} isSmall={isSmall} />
        </Suspense>
        <Overlay p={p} reduced={reduced} />
      </div>

      <main>
        {/* Directly after the hero: what the systems below are built out of,
            before the systems themselves. */}
        <Arsenal />
        <Projects />
        <Experience />
      </main>
    </>
  );
}
