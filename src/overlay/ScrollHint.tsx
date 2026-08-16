import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Three chevrons, inline SVG paths so stroke and colour stay on the tokens. */
export function ScrollHint({ opacity }: { opacity: number }) {
  const reduce = useReducedMotion();
  const visible = opacity > 0.01;

  return (
    <motion.div
      aria-hidden
      style={{ opacity }}
      className="pointer-events-none absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-1"
    >
      {[0, 1, 2].map((i) => (
        <motion.svg
          key={i}
          width="18"
          height="9"
          viewBox="0 0 18 9"
          fill="none"
          animate={reduce || !visible ? undefined : { y: [0, 5, 0], opacity: [0.25, 0.9, 0.25] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: EASE, delay: i * 0.14 }}
        >
          <path
            d="M1 1L9 7.5L17 1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted"
          />
        </motion.svg>
      ))}
    </motion.div>
  );
}
