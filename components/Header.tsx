export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        borderColor: "var(--bg-border)",
        background: "rgba(9,9,14,0.85)",
        backdropFilter: "blur(12px) saturate(1.4)",
        WebkitBackdropFilter: "blur(12px) saturate(1.4)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

        {/* ── Brand ── */}
        <div className="flex items-center gap-3">
          {/* Icon mark */}
          <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
            <div
              className="absolute inset-0 rounded-sm rotate-45"
              style={{ border: "1.5px solid rgba(0,212,255,0.35)" }}
            />
            <div
              className="w-1.5 h-1.5 rounded-sm"
              style={{ background: "var(--accent)" }}
            />
          </div>

          {/* Wordmark */}
          <span className="font-mono text-sm font-bold tracking-tight" style={{ color: "var(--ink-1)" }}>
            Option<span style={{ color: "var(--accent)" }}>Rank</span>
            <span className="font-normal ml-1.5" style={{ color: "var(--ink-4)" }}>Lite</span>
          </span>
        </div>

        {/* ── Right side ── */}
        <div className="flex items-center gap-4">
          {/* Tagline — hidden on mobile */}
          <span
            className="hidden md:block font-mono text-[11px] tracking-wide"
            style={{ color: "var(--ink-4)" }}
          >
            Option Trade Evaluator
          </span>

          {/* Separator */}
          <div className="hidden md:block w-px h-4" style={{ background: "var(--bg-border2)" }} />

          {/* Status */}
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "var(--green)",
                boxShadow: "0 0 6px var(--green)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span className="font-mono text-[11px]" style={{ color: "var(--ink-4)" }}>
              v0.9.0
            </span>
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(to right, transparent, rgba(0,212,255,0.12) 40%, rgba(0,212,255,0.12) 60%, transparent)",
        }}
      />
    </header>
  );
}
