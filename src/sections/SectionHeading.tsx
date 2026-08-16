import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

export function SectionHeading({
  label,
  title,
  lead,
}: {
  label: string;
  title: string;
  lead?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <header className="mb-14 md:mb-20">
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="font-sans text-[16px] uppercase tracking-[0.26em] text-muted/85 md:text-[18px]"
      >
        {label}
      </motion.p>
      <motion.h2
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.85, ease: EASE, delay: 0.06 }}
        className="mt-5 font-mono text-[clamp(1.7rem,4.4vw,2.9rem)] leading-tight tracking-tight text-bright"
      >
        {title}
      </motion.h2>

      {lead ? (
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.12 }}
          className="mt-5 max-w-xl font-mono text-[0.9rem] leading-relaxed text-muted"
        >
          {lead}
        </motion.p>
      ) : null}
    </header>
  );
}
