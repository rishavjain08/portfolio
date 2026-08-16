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
 * Compact mode drops the scroll scrub and the heavy 3D entirely: small screens
 * and anyone who has asked for reduced motion get a static poster frame plus
 * the same text, revealed on load.
 */
export function useCompactMode() {
  const isSmall = useMediaQuery("(max-width: 767px)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  return { compact: isSmall || reduced, reduced, isSmall };
}
