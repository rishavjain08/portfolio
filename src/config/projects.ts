/**
 * Full project data, including the architecture diagrams.
 *
 * Recovered from the previous portfolio: the node and edge graphs describe real
 * systems and are worth keeping. Kept separate from content.ts because this is
 * the heavy payload the detail dialog needs, not the copy the rail needs.
 */

export type NodeKind = "source" | "compute" | "store" | "agent" | "queue" | "sink" | "edge";

export type DiagramNode = {
  id: string;
  label: string;
  sub?: string;
  /** Coordinates in the 1000 x 520 diagram space. */
  x: number;
  y: number;
  kind: NodeKind;
};

export type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
  /** Dashed control-plane link rather than a solid data-plane link. */
  control?: boolean;
  /** Curvature of the connector: 0 is a straight line. */
  bend?: number;
};

export type Diagram = { caption: string; nodes: DiagramNode[]; edges: DiagramEdge[] };

export type ProjectDetail = {
  id: string;
  name: string;
  category: string;
  org: string;
  status: "Production" | "Personal";
  tagline: string;
  problem: string;
  approach: string;
  decisions: { title: string; body: string }[];
  metrics: { value: string; label: string }[];
  stack: string[];
  diagram: Diagram;
  proprietary?: boolean;
};

export const details: ProjectDetail[] = [
  /* ------------------------------------------------------------------ */
  {
    id: "ai-incident-assistant",
    name: "AI Incident Assistant",
    category: "Agentic AI",
    org: "Graviton Research Capital",
    status: "Production",
    proprietary: true,
    tagline: "A multi-agent system that triages alerts, finds root cause, and executes the runbook.",
    problem:
      "Alerting fires faster than an on-call rotation can absorb. The knowledge needed to resolve it sits in runbooks nobody can search under pressure.",
    approach:
      "Alerts enter a supervised agent graph. Triage dedupes into an incident, retrieval pulls the matching runbook, reasoning ranks a cause. Resolution emits a structured intent that a deterministic policy gate validates before anything runs.",
    decisions: [
      {
        title: "Retrieval before reasoning",
        body:
          "If no runbook clears the relevance threshold, the assistant escalates to a human instead of inventing a remediation.",
      },
      {
        title: "Agents propose, the gate disposes",
        body:
          "Models emit intents, never shell commands. A separate layer checks each against an allow-list, so blast radius is enumerable without reasoning about the model.",
      },
    ],
    metrics: [
      { value: "Multi-agent", label: "Triage, RCA, resolution" },
      { value: "RAG", label: "Grounded in runbooks" },
      { value: "100+", label: "Servers reachable" },
    ],
    stack: ["Python", "LangGraph", "LangChain", "FastAPI", "Redis", "Celery"],
    diagram: {
      caption: "Alert to incident to grounded reasoning to bounded execution.",
      nodes: [
        { id: "alerts", label: "Alert Sources", sub: "monitoring, logs", x: 70, y: 260, kind: "source" },
        { id: "bus", label: "Event Bus", sub: "ingest", x: 250, y: 260, kind: "queue" },
        { id: "triage", label: "Triage Agent", sub: "dedupe", x: 430, y: 120, kind: "agent" },
        { id: "retrieval", label: "Retrieval Agent", sub: "RAG", x: 430, y: 400, kind: "agent" },
        { id: "index", label: "Vector Index", sub: "runbooks", x: 250, y: 460, kind: "store" },
        { id: "reason", label: "Reasoning Agent", sub: "root cause", x: 630, y: 260, kind: "agent" },
        { id: "policy", label: "Policy Gate", sub: "allow-list", x: 800, y: 130, kind: "compute" },
        { id: "exec", label: "Remote Execution", sub: "100+ servers", x: 930, y: 260, kind: "sink" },
        { id: "human", label: "On-call", sub: "escalation", x: 800, y: 400, kind: "sink" },
      ],
      edges: [
        { from: "alerts", to: "bus" },
        { from: "bus", to: "triage", label: "incident" },
        { from: "triage", to: "retrieval", label: "query", bend: 24 },
        { from: "index", to: "retrieval", label: "context" },
        { from: "retrieval", to: "reason", label: "grounded" },
        { from: "triage", to: "reason", label: "signal" },
        { from: "reason", to: "policy", label: "intent" },
        { from: "policy", to: "exec", label: "validated" },
        { from: "reason", to: "human", label: "low confidence", control: true },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "kafka-log-pipeline",
    name: "Kafka Log Pipeline",
    category: "Streaming",
    org: "Honasa",
    status: "Production",
    proprietary: true,
    tagline: "A million daily edge records turned from an unqueryable firehose into partitioned Parquet.",
    problem:
      "WAF, ELB and CloudFront logs arrived at over a million records a day in a format nobody could interrogate, so security anomalies surfaced late.",
    approach:
      "Kafka carries the raw stream. Preprocessing consumers parse, enrich and partition each record along the dimensions investigations actually filter on, then write columnar Parquet. Athena reads it with partition pruning first, column scan second.",
    decisions: [
      {
        title: "Partition on the real predicate",
        body:
          "Partitioning is only useful if it matches how people filter. The layout came from the actual investigative queries, not from what was convenient to write.",
      },
      {
        title: "Batched writes over streaming writes",
        body:
          "Small-file proliferation destroys columnar read performance. Batching costs minutes of freshness and buys back the format's entire advantage.",
      },
    ],
    metrics: [
      { value: "1M+", label: "Records daily" },
      { value: "80%", label: "Faster detection" },
      { value: "3", label: "Sources unified" },
    ],
    stack: ["Kafka", "Python", "Parquet", "AWS S3", "Athena", "Glue"],
    diagram: {
      caption: "Firehose to partitioned columnar storage to sub-second investigation.",
      nodes: [
        { id: "waf", label: "WAF", x: 70, y: 110, kind: "source" },
        { id: "elb", label: "ELB", x: 70, y: 260, kind: "source" },
        { id: "cf", label: "CloudFront", x: 70, y: 410, kind: "source" },
        { id: "kafka", label: "Kafka", sub: "partitioned topics", x: 270, y: 260, kind: "queue" },
        { id: "proc", label: "Preprocessing", sub: "parse, enrich", x: 460, y: 260, kind: "compute" },
        { id: "s3", label: "S3 Parquet", sub: "partitioned", x: 650, y: 260, kind: "store" },
        { id: "athena", label: "Athena", sub: "pruned scan", x: 840, y: 140, kind: "compute" },
        { id: "etl", label: "ETL Rollups", sub: "validated", x: 840, y: 390, kind: "compute" },
        { id: "sec", label: "Security Analytics", x: 960, y: 260, kind: "sink" },
      ],
      edges: [
        { from: "waf", to: "kafka" },
        { from: "elb", to: "kafka" },
        { from: "cf", to: "kafka" },
        { from: "kafka", to: "proc", label: "1M+/day" },
        { from: "proc", to: "s3", label: "columnar" },
        { from: "s3", to: "athena" },
        { from: "s3", to: "etl" },
        { from: "athena", to: "sec" },
        { from: "etl", to: "sec" },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "distributed-orchestration",
    name: "Distributed Orchestration",
    category: "Scheduling",
    org: "Personal",
    status: "Personal",
    tagline: "A job scheduler built from first principles: priority queues, bin packing, exactly-once effects.",
    problem:
      "Off-the-shelf schedulers hide their policy behind configuration. I wanted to build the policy itself, and find out what survives a worker dying mid-execution.",
    approach:
      "A heap orders pending work, greedy bin packing places it on the workers whose remaining capacity fits, and the scheduler runs as an ephemeral agent rather than a resident process. Back-pressure propagates from workers up to submission.",
    decisions: [
      {
        title: "Greedy packing over round robin",
        body:
          "Round robin ignores job shape. Packing by remaining capacity raised CPU utilization roughly 30% without adding a single worker.",
      },
      {
        title: "Idempotency keys at submission",
        body:
          "Exactly-once delivery is a myth, exactly-once effect is achievable. Every job carries a deterministic key, so redelivery is a no-op rather than a duplicate.",
      },
    ],
    metrics: [
      { value: "+30%", label: "CPU utilization" },
      { value: "0", label: "Duplicate runs" },
      { value: "Ephemeral", label: "On-demand scheduler" },
    ],
    stack: ["Python", "Priority Queues", "Bin Packing", "Redis", "Celery", "Docker"],
    diagram: {
      caption: "Submission to prioritization to packing, with back-pressure closing the loop.",
      nodes: [
        { id: "submit", label: "Submit API", sub: "idempotency key", x: 70, y: 260, kind: "source" },
        { id: "pq", label: "Priority Queue", sub: "binary heap", x: 250, y: 260, kind: "queue" },
        { id: "sched", label: "Scheduler", sub: "ephemeral", x: 440, y: 260, kind: "compute" },
        { id: "packer", label: "Bin Packer", sub: "greedy fit", x: 440, y: 90, kind: "compute" },
        { id: "w1", label: "Worker A", x: 680, y: 110, kind: "sink" },
        { id: "w2", label: "Worker B", x: 680, y: 260, kind: "sink" },
        { id: "w3", label: "Worker C", x: 680, y: 410, kind: "sink" },
        { id: "state", label: "Execution Log", sub: "dedupe", x: 900, y: 260, kind: "store" },
      ],
      edges: [
        { from: "submit", to: "pq" },
        { from: "pq", to: "sched", label: "pop" },
        { from: "sched", to: "packer", label: "fit", bend: -20 },
        { from: "packer", to: "sched", label: "placement", bend: -20 },
        { from: "sched", to: "w1" },
        { from: "sched", to: "w2" },
        { from: "sched", to: "w3" },
        { from: "w1", to: "state" },
        { from: "w2", to: "state" },
        { from: "w3", to: "state" },
        { from: "state", to: "pq", label: "backoff", control: true, bend: 150 },
        { from: "w2", to: "pq", label: "back-pressure", control: true, bend: -150 },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "remote-execution",
    name: "Remote Execution Framework",
    category: "Fleet Automation",
    org: "Graviton Research Capital",
    status: "Production",
    proprietary: true,
    tagline: "One standardized interface to run any workflow safely across 100+ servers.",
    problem:
      "Operational work lived in ad-hoc SSH loops and one-off scripts. Every automation reinvented connection handling, and none of them agreed on what failure meant.",
    approach:
      "A single control interface takes a declarative workflow and a target selector, resolves it against live inventory, fans out with bounded concurrency, and returns one uniform result contract. Partial success is a first-class outcome.",
    decisions: [
      {
        title: "Selectors, not hostnames",
        body:
          "Targets are queries against inventory metadata, so automation written once keeps working as the fleet changes shape.",
      },
      {
        title: "One result contract",
        body:
          "Per-host status, structured output, classified error. That single decision is what later made the framework safe for an agent to call.",
      },
    ],
    metrics: [
      { value: "100+", label: "Servers, one interface" },
      { value: "Bounded", label: "Concurrency ceiling" },
      { value: "Idempotent", label: "Safe to re-run" },
    ],
    stack: ["Python", "AsyncIO", "SSH", "FastAPI", "Redis"],
    diagram: {
      caption: "Declarative workflow plus selector, bounded fan-out, uniform results.",
      nodes: [
        { id: "cli", label: "Control Interface", sub: "CLI, API, agent", x: 80, y: 260, kind: "source" },
        { id: "inv", label: "Inventory", sub: "metadata", x: 260, y: 90, kind: "store" },
        { id: "resolve", label: "Selector Resolver", x: 280, y: 260, kind: "compute" },
        { id: "disp", label: "Dispatcher", sub: "bounded", x: 500, y: 260, kind: "compute" },
        { id: "h1", label: "Host Pool A", x: 730, y: 110, kind: "sink" },
        { id: "h2", label: "Host Pool B", x: 730, y: 260, kind: "sink" },
        { id: "h3", label: "Host Pool C", x: 730, y: 410, kind: "sink" },
        { id: "res", label: "Result Contract", sub: "status, output", x: 930, y: 260, kind: "store" },
      ],
      edges: [
        { from: "cli", to: "resolve", label: "workflow" },
        { from: "inv", to: "resolve", label: "targets" },
        { from: "resolve", to: "disp" },
        { from: "disp", to: "h1" },
        { from: "disp", to: "h2" },
        { from: "disp", to: "h3" },
        { from: "h1", to: "res" },
        { from: "h2", to: "res" },
        { from: "h3", to: "res" },
        { from: "res", to: "cli", label: "structured", control: true, bend: 170 },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "market-data-sync",
    name: "Market Data Sync",
    category: "Data Infrastructure",
    org: "Graviton Research Capital",
    status: "Production",
    proprietary: true,
    tagline: "Keeping colocation and simulation in agreement, with verified archival to S3.",
    problem:
      "Research is only trustworthy when simulation sees what production saw. A silent gap between the two invalidates backtests in a way that is expensive to discover late.",
    approach:
      "Collectors capture and normalize feeds once, at the colocation edge. A sync layer moves verified datasets to simulation while an archival path writes the same artifact to S3. Completeness runs per session, so a gap alerts at capture time.",
    decisions: [
      {
        title: "Normalize once, at the edge",
        body:
          "Trading, research and simulation all read the same representation. Normalizing per consumer would have guaranteed divergence.",
      },
      {
        title: "Verify completeness, not transfer",
        body:
          "A successful copy is not a correct dataset. Per-session checks catch the failure that actually hurts: data that arrived but is missing a window.",
      },
    ],
    metrics: [
      { value: "Colo to sim", label: "Environment parity" },
      { value: "S3", label: "Automated archival" },
      { value: "Per session", label: "Completeness checks" },
    ],
    stack: ["Python", "Celery", "AWS S3", "Parquet", "Linux"],
    diagram: {
      caption: "Capture at the edge, normalize once, verify, then fan out.",
      nodes: [
        { id: "feed", label: "Exchange Feeds", sub: "colocation", x: 70, y: 260, kind: "source" },
        { id: "cap", label: "Collectors", sub: "raw capture", x: 240, y: 260, kind: "compute" },
        { id: "norm", label: "Normalization", sub: "one schema", x: 420, y: 260, kind: "compute" },
        { id: "verify", label: "Completeness", sub: "per session", x: 600, y: 110, kind: "compute" },
        { id: "sync", label: "Sync Layer", sub: "verified", x: 620, y: 300, kind: "queue" },
        { id: "sim", label: "Simulation", sub: "replay", x: 850, y: 200, kind: "sink" },
        { id: "s3", label: "S3 Archive", sub: "lifecycle", x: 850, y: 420, kind: "store" },
        { id: "trade", label: "Trading, Quant", sub: "live", x: 420, y: 460, kind: "sink" },
      ],
      edges: [
        { from: "feed", to: "cap" },
        { from: "cap", to: "norm" },
        { from: "norm", to: "verify", label: "audit" },
        { from: "norm", to: "sync" },
        { from: "norm", to: "trade", label: "live" },
        { from: "verify", to: "sync", label: "gate", control: true },
        { from: "sync", to: "sim" },
        { from: "sync", to: "s3", label: "archive" },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "cloud-monitoring",
    name: "Cloud Monitoring Platform",
    category: "Observability",
    org: "Honasa",
    status: "Production",
    proprietary: true,
    tagline: "Dashboards that build themselves from live service inventory across 20+ microservices.",
    problem:
      "Hand-built dashboards rot. A new service ships without one, a renamed metric empties a widget, and the board everyone trusts quietly starts lying.",
    approach:
      "A Boto3 generator discovers services and their metrics from live AWS state, then renders dashboards from templates keyed on service type. The definition is derived, never authored, and the same inventory provisions the alarms.",
    decisions: [
      {
        title: "Dashboards as a derived artifact",
        body:
          "Nothing is hand-placed. The board is a pure function of live inventory plus a template, so it cannot be stale relative to reality.",
      },
      {
        title: "One inventory for boards and alarms",
        body:
          "Dashboards and alarms drifting apart is how you get a green board during an outage. Sharing the source removes that failure by construction.",
      },
    ],
    metrics: [
      { value: "20+", label: "Microservices" },
      { value: "Real time", label: "Inventory driven" },
      { value: "0", label: "Hand-placed panels" },
    ],
    stack: ["Python", "Boto3", "CloudWatch", "Lambda", "Terraform"],
    diagram: {
      caption: "Live AWS inventory in, correct dashboards and alarms out, continuously.",
      nodes: [
        { id: "aws", label: "AWS Account", sub: "live resources", x: 80, y: 260, kind: "source" },
        { id: "disc", label: "Discovery", sub: "Boto3 crawl", x: 270, y: 260, kind: "compute" },
        { id: "inv", label: "Service Inventory", sub: "20+ services", x: 460, y: 260, kind: "store" },
        { id: "tpl", label: "Templates", sub: "per type", x: 460, y: 90, kind: "store" },
        { id: "gen", label: "Generator", sub: "render", x: 660, y: 180, kind: "compute" },
        { id: "dash", label: "Dashboards", x: 880, y: 110, kind: "sink" },
        { id: "alarm", label: "Alarms", x: 880, y: 300, kind: "sink" },
        { id: "oncall", label: "On-call", x: 880, y: 450, kind: "sink" },
      ],
      edges: [
        { from: "aws", to: "disc" },
        { from: "disc", to: "inv" },
        { from: "inv", to: "gen" },
        { from: "tpl", to: "gen" },
        { from: "gen", to: "dash" },
        { from: "inv", to: "alarm", label: "same source", control: true, bend: 60 },
        { from: "alarm", to: "oncall" },
      ],
    },
  },

  /* ------------------------------------------------------------------ */
  {
    id: "aws-automation",
    name: "Ephemeral CI Platform",
    category: "Cloud Engineering",
    org: "Honasa",
    status: "Production",
    proprietary: true,
    tagline: "Jenkins off standing slaves and onto Kubernetes, for 70% less infrastructure spend.",
    problem:
      "CI ran on permanently provisioned slaves that idled most of the day and still billed every hour. Images built on one architecture failed on the other.",
    approach:
      "A pipeline requests a pod, the pod runs the job, the pod dies. Builds emit multi-arch manifest lists so one image reference resolves correctly on ARM and AMD, and JupyterHub runs highly available on the same cluster.",
    decisions: [
      {
        title: "Ephemeral agents over static slaves",
        body:
          "CI load is bursty. Paying only while a job runs cut spend roughly 70% and removed an entire class of dirty-workspace failures.",
      },
      {
        title: "Manifest lists, not per-arch tags",
        body:
          "Per-arch tags push the decision onto whoever writes the manifest, and eventually they get it wrong. One manifest makes the correct image the only image.",
      },
    ],
    metrics: [
      { value: "70%", label: "CI cost cut" },
      { value: "100%", label: "Cross-arch drift gone" },
      { value: "99%", label: "Platform uptime" },
    ],
    stack: ["Kubernetes", "Docker Buildx", "Jenkins", "ArgoCD", "Terraform", "Helm"],
    diagram: {
      caption: "Bursty CI, ephemeral capacity, one image that runs everywhere.",
      nodes: [
        { id: "git", label: "Git Push", x: 70, y: 260, kind: "source" },
        { id: "jenkins", label: "Controller", sub: "orchestration", x: 260, y: 260, kind: "compute" },
        { id: "pod", label: "Ephemeral Agent", sub: "pod per job", x: 460, y: 260, kind: "compute" },
        { id: "buildx", label: "Buildx", sub: "multi-arch", x: 650, y: 130, kind: "compute" },
        { id: "reg", label: "Registry", sub: "ARM, AMD", x: 840, y: 130, kind: "store" },
        { id: "argo", label: "ArgoCD", sub: "GitOps", x: 650, y: 390, kind: "compute" },
        { id: "k8s", label: "Kubernetes Fleet", sub: "mixed arch", x: 900, y: 320, kind: "sink" },
        { id: "hub", label: "JupyterHub", sub: "HA", x: 900, y: 470, kind: "sink" },
      ],
      edges: [
        { from: "git", to: "jenkins" },
        { from: "jenkins", to: "pod", label: "provision" },
        { from: "pod", to: "buildx" },
        { from: "buildx", to: "reg", label: "manifest" },
        { from: "pod", to: "argo", label: "bump" },
        { from: "reg", to: "k8s", label: "pull", bend: 40 },
        { from: "argo", to: "k8s" },
        { from: "k8s", to: "hub", control: true },
        { from: "pod", to: "jenkins", label: "terminate", control: true, bend: -80 },
      ],
    },
  },
];

export const detailById = (id: string) => details.find((d) => d.id === id);
