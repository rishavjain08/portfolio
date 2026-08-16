/** Copy. Edit these four lines and the page is yours. */
export const content = {
  brand: "RISHAV",
  name: "Rishav Jain",
  role: "a full-stack developer",
  city: "Gurugram",
} as const;

export type Role = {
  company: string;
  title: string;
  period: string;
  current?: boolean;
  summary: string;
  highlights: string[];
  /** Chapter marker for the arc. */
  year: string;
  /**
   * The story beat: what this chapter taught or demanded, in the first person
   * of the work rather than of the job. This is what the reader sees first;
   * company and title are metadata underneath it.
   */
  beat: string;
};

/**
 * The arc, in order.
 *
 * Deliberately chronological rather than newest-first: read top to bottom it is
 * a progression from a model that had to be questioned, through a platform that
 * had to explain itself, to infrastructure where being wrong is expensive. A
 * reverse-chronological list is a CV; this is meant to read as a story that
 * happens to be true.
 *
 * Every figure is drawn from config/projects.ts. Nothing is estimated.
 */
export const roles: Role[] = [
  {
    company: "Coforge",
    title: "Data Science Intern",
    period: "Jun to Jul 2024",
    year: "2024",
    beat: "A prediction nobody can interrogate is a prediction nobody acts on.",
    summary:
      "Churn modelling on heavily imbalanced data, where the hard part turned out to be making the answer defensible rather than making it accurate.",
    highlights: [
      "Class imbalance corrected with SMOTE and feature scaling before any model comparison, so the benchmark measured the model and not the sampling",
      "XGBoost, Random Forest and LSTM benchmarked head to head on held-out data",
      "Shipped as a Streamlit dashboard, because a notebook nobody opens changes nothing",
    ],
  },
  {
    company: "Honasa",
    title: "Software Development Engineer",
    period: "Jan 2025 to Feb 2026",
    year: "2025",
    beat: "Then the systems grew large enough that they had to explain themselves.",
    summary:
      "Owned the data platform, observability and Kubernetes layer for a high-volume consumer business, from ingestion through to what on-call sees at 3am.",
    highlights: [
      "Kafka into partitioned Parquet on S3 at 1M+ records daily, laid out so Athena scan cost stays bounded as history grows",
      "Detection time cut 80% by generating observability from live service inventory across 20+ microservices, leaving no hand-placed panel to drift out of date",
      "Jenkins moved onto ephemeral Kubernetes agents: 70% lower CI spend, cross-architecture drift eliminated, 99% platform uptime",
    ],
  },
  {
    company: "Graviton Research Capital",
    title: "Application Engineer",
    period: "Feb 2026 to now",
    current: true,
    year: "2026",
    beat: "Now the cost of being wrong is paid in the first microsecond of the trading day.",
    summary:
      "Core infrastructure for a high-frequency trading desk: market data movement, fleet-wide execution, and the automation the trading day depends on.",
    highlights: [
      "Remote execution framework reaching 100+ colocated servers behind one asynchronous interface, with a bounded concurrency ceiling and idempotent operations so any run is safe to repeat",
      "Market data held at parity between colocation and simulation, archived to S3 as Parquet with per-session completeness checks before research trusts a dataset",
      "Multi-agent incident system that triages alerts, retrieves the governing runbook and executes the resolution, so on-call attention goes to judgement rather than lookup",
    ],
  },
];
