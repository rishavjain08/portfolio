import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** How many coarse buckets the scroll is quantised into for React state. */
const BUCKETS = 40;

/**
 * One ScrollTrigger, one scrubbed float.
 *
 * GSAP writes progress into a ref and nothing else: it never touches a
 * Three.js property, which is what keeps the two libraries from fighting over
 * the same value on the same frame. The render loop reads the ref; React state
 * changes only when a coarse bucket boundary is crossed.
 */
export function useScrollProgress(pages: number, enabled: boolean) {
  const progress = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [bucket, setBucket] = useState(0);

  useEffect(() => {
    if (!enabled || !containerRef.current) {
      progress.current = 0;
      return;
    }

    let last = -1;

    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: () => `+=${window.innerHeight * (pages - 1)}`,
      pin: true,
      pinSpacing: true,
      // scrub adds the damping that stops the camera path snapping.
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progress.current = self.progress;
        const next = Math.round(self.progress * BUCKETS);
        if (next !== last) {
          last = next;
          setBucket(next);
        }
      },
    });

    return () => {
      st.kill();
      ScrollTrigger.refresh();
    };
  }, [pages, enabled]);

  return { progress, containerRef, bucket, buckets: BUCKETS };
}
