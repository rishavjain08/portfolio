export function Loader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
        Loading<span className="ml-1 inline-block animate-pulse">...</span>
      </span>
    </div>
  );
}
