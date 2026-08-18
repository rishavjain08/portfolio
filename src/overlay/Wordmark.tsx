import { motion, useReducedMotion } from "motion/react";
import { content } from "../config/content";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Wordmark() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
      className="pointer-events-none absolute left-6 top-6 z-30 md:left-10 md:top-8"
    >
      <span className="font-sans text-[11px] font-medium uppercase tracking-[0.42em] text-bright/70 md:text-xs">
        {content.brand}
      </span>
    </motion.div>
  );
}
