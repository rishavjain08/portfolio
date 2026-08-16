/**
 * The technical arsenal, recovered verbatim from the previous portfolio.
 *
 * Nineteen technologies across three orbit rings. `ring` and `angle` are layout,
 * not data: they place each chip on its orbit in the Arsenal section.
 */

export type Tech = {
  id: string;
  name: string;
  domain: "Language" | "AI" | "Data" | "Cloud" | "Platform" | "Storage" | "Backend";
  /** Orbit ring index - 0 is closest to the core. */
  ring: 0 | 1 | 2;
  /** Starting angle on the orbit, in degrees. */
  angle: number;
  years: string;
  experience: string;
  usedIn: string[];
  production: string;
};

export const core = {
  label: "Software Engineering",
  sub: "systems, scale, reliability",
};

export const technologies: Tech[] = [
  {
    id: "python",
    name: "Python",
    domain: "Language",
    ring: 0,
    angle: 0,
    years: "Primary",
    experience:
      "Every system on this page is written in it: agents, schedulers, pipelines, execution frameworks.",
    usedIn: ["AI Incident Assistant", "Remote Execution Framework", "Kafka Log Pipeline"],
    production: "Every production system listed on this site.",
  },
  {
    id: "cpp",
    name: "C / C++",
    domain: "Language",
    ring: 2,
    angle: 200,
    years: "Foundational",
    experience:
      "Where the mechanical sympathy comes from: memory layout, cache behaviour, the cost of an abstraction.",
    usedIn: ["Systems coursework", "Performance-sensitive work"],
    production: "Informs how I reason about latency in trading infrastructure.",
  },
  {
    id: "sql",
    name: "SQL",
    domain: "Language",
    ring: 1,
    angle: 320,
    years: "Daily",
    experience:
      "Athena over partitioned Parquet, Postgres for transactional state, aggregation across telemetry.",
    usedIn: ["Kafka Log Pipeline", "Cloud Monitoring Platform"],
    production: "Security anomaly investigation over 1M+ daily records.",
  },
  {
    id: "langgraph",
    name: "LangGraph",
    domain: "AI",
    ring: 0,
    angle: 72,
    years: "Production",
    experience:
      "Supervised multi-agent graphs with explicit stages, each one independently testable and observable.",
    usedIn: ["AI Incident Assistant"],
    production: "Live alert triage and root cause analysis at Graviton.",
  },
  {
    id: "langchain",
    name: "LangChain",
    domain: "AI",
    ring: 0,
    angle: 144,
    years: "Production",
    experience:
      "RAG retrieval over runbooks and incident history, plus a PR review tool surfacing inline suggestions.",
    usedIn: ["AI Incident Assistant", "LangChain Code Review Tool"],
    production: "Grounded remediation at Graviton; PR review acceleration at Honasa.",
  },
  {
    id: "kafka",
    name: "Kafka",
    domain: "Data",
    ring: 0,
    angle: 216,
    years: "Production",
    experience:
      "Partitioned topics carrying edge logs, with consumers writing columnar output downstream.",
    usedIn: ["Kafka Log Processing Pipeline"],
    production: "1M+ records per day at Honasa.",
  },
  {
    id: "aws",
    name: "AWS",
    domain: "Cloud",
    ring: 0,
    angle: 288,
    years: "Production",
    experience:
      "S3, Athena, Lambda, CloudWatch. Pruned analytics, lifecycle archival, inventory-driven dashboards.",
    usedIn: ["Kafka Log Pipeline", "Cloud Monitoring Platform", "Market Data Sync"],
    production: "Log platform, observability and market data archival.",
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    domain: "Platform",
    ring: 1,
    angle: 30,
    years: "Production",
    experience:
      "Ephemeral CI agents, highly available JupyterHub, mixed ARM and AMD pools reconciled by manifest.",
    usedIn: ["AWS Automation Toolkit"],
    production: "70% CI cost reduction, 99% JupyterHub uptime.",
  },
  {
    id: "docker",
    name: "Docker",
    domain: "Platform",
    ring: 1,
    angle: 78,
    years: "Production",
    experience:
      "Multi-arch manifest lists via Buildx, ending cross-platform drift on a heterogeneous fleet.",
    usedIn: ["AWS Automation Toolkit"],
    production: "100% of cross-arch image inconsistency removed.",
  },
  {
    id: "celery",
    name: "Celery",
    domain: "Backend",
    ring: 1,
    angle: 126,
    years: "Production",
    experience:
      "Event-driven async orchestration for trade operational checks and market data workflows.",
    usedIn: ["Market Data Sync", "Distributed Orchestration System"],
    production: "Trade operational pipelines at Graviton.",
  },
  {
    id: "redis",
    name: "Redis",
    domain: "Storage",
    ring: 1,
    angle: 174,
    years: "Production",
    experience:
      "Broker and result backend for async pipelines, plus idempotency keys for exactly-once effects.",
    usedIn: ["Distributed Orchestration System", "Remote Execution Framework"],
    production: "Queueing and deduplication across async systems.",
  },
  {
    id: "terraform",
    name: "Terraform",
    domain: "Cloud",
    ring: 1,
    angle: 222,
    years: "Production",
    experience:
      "Infrastructure declared rather than clicked. The same principle as generated dashboards, one layer down.",
    usedIn: ["AWS Automation Toolkit", "Cloud Monitoring Platform"],
    production: "Platform infrastructure at Honasa.",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    domain: "Storage",
    ring: 1,
    angle: 270,
    years: "Production",
    experience:
      "Transactional state where correctness beats throughput, alongside MySQL and MongoDB when the shape fits.",
    usedIn: ["Backend services"],
    production: "Service-level persistence.",
  },
  {
    id: "fastapi",
    name: "FastAPI",
    domain: "Backend",
    ring: 2,
    angle: 20,
    years: "Production",
    experience:
      "Typed service interfaces for the execution framework and agent tooling.",
    usedIn: ["Remote Execution Framework", "AI Incident Assistant"],
    production: "Control-plane APIs.",
  },
  {
    id: "neo4j",
    name: "Neo4j",
    domain: "Storage",
    ring: 2,
    angle: 68,
    years: "Applied",
    experience:
      "Graph modelling where traversal is the query rather than a join plan.",
    usedIn: ["Graph data modelling"],
    production: "Relationship-heavy datasets.",
  },
  {
    id: "pytorch",
    name: "PyTorch",
    domain: "AI",
    ring: 2,
    angle: 116,
    years: "Applied",
    experience:
      "Model work alongside TensorFlow and Scikit-learn, including the LSTM benchmarked for churn.",
    usedIn: ["Churn Prediction"],
    production: "0.89 F1 classifier selection.",
  },
  {
    id: "argocd",
    name: "ArgoCD",
    domain: "Platform",
    ring: 2,
    angle: 164,
    years: "Production",
    experience:
      "GitOps reconciliation, so desired state lives in version control rather than terminal history.",
    usedIn: ["AWS Automation Toolkit"],
    production: "Deployment reconciliation at Honasa.",
  },
  {
    id: "jenkins",
    name: "Jenkins",
    domain: "Platform",
    ring: 2,
    angle: 250,
    years: "Production",
    experience:
      "Migrated to ephemeral Kubernetes agents, turning standing cost into per-job cost.",
    usedIn: ["AWS Automation Toolkit"],
    production: "70% infrastructure expenditure reduction.",
  },
  {
    id: "parquet",
    name: "Parquet",
    domain: "Data",
    ring: 2,
    angle: 300,
    years: "Production",
    experience:
      "The storage decision that made investigative security queries viable at all.",
    usedIn: ["Kafka Log Pipeline", "Market Data Sync"],
    production: "80% reduction in anomaly detection latency.",
  },
];

/**
 * Domain accents, carried over as literals.
 *
 * The original pointed at --cyan / --violet / --blue from the old globals.css;
 * those variables do not exist here, so the values themselves are inlined. They
 * are the same hue family the architecture diagrams already use, so the two
 * sections agree rather than introducing a second palette.
 */
export const domainColor: Record<Tech["domain"], string> = {
  Language: "#22d3ee",
  AI: "#8b5cf6",
  Data: "#4c6fff",
  Cloud: "#4c6fff",
  Platform: "#8b5cf6",
  Storage: "#22d3ee",
  Backend: "#4c6fff",
};
