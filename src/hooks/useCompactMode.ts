import { useCallback, useSyncExternalStore } from "react";

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Two separate questions, deliberately not one flag.
 *
 * `reduced` is a request not to animate, so it parks the scene on a poster
 * frame. `isSmall` is a small screen, which is a reason to render more cheaply
 * but not a reason to withhold the hero: the scroll-driven laptop is the page,
 * and phones were being handed a single cropped still of it instead.
 *
 * `compact` is kept as the union for the poster-frame decision only.
 */
export function useCompactMode() {
  const isSmall = useMediaQuery("(max-width: 767px)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  return { compact: isSmall || reduced, reduced, isSmall };
}
