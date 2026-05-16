import Header from "@/components/Header";
import TradeEvaluator from "@/components/TradeEvaluator";

export default function Home() {
  return (
    <>
      <Header />

      <main
        className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6"
        style={{ paddingBottom: "5rem" }}
      >

        {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
        <div style={{ paddingTop: "3.5rem", paddingBottom: "3rem" }}>

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="h-px w-8"
              style={{ background: "var(--accent)", opacity: 0.5 }}
            />
            <p
              className="font-mono text-[11px] tracking-[0.22em] uppercase"
              style={{ color: "var(--accent)", opacity: 0.8 }}
            >
              Options Analysis Terminal
            </p>
          </div>

          {/* Headline */}
          <h1
            className="font-mono font-bold tracking-tight leading-none mb-4"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              color: "var(--ink-1)",
              textShadow: "0 0 60px rgba(0,212,255,0.1)",
            }}
          >
            OptionRank{" "}
            <span
              style={{
                color: "var(--accent)",
                textShadow: "0 0 30px rgba(0,212,255,0.45)",
              }}
            >
              Lite
            </span>
          </h1>

          {/* Subline */}
          <p
            className="font-mono leading-relaxed max-w-md"
            style={{ fontSize: "0.875rem", color: "var(--ink-3)" }}
          >
            Score, rank, and visualise your option setups before you trade.
            <span style={{ color: "var(--ink-4)" }}> Delta · Theta · R:R · P/L.</span>
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            {["Scoring Engine", "P/L Chart", "Theta Decay", "Trade Journal"].map((label) => (
              <span
                key={label}
                className="font-mono text-[10px] tracking-widest uppercase rounded-full px-3 py-1"
                style={{
                  color: "var(--ink-4)",
                  border: "1px solid var(--bg-border)",
                  background: "var(--bg-raised)",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Hero / content divider ── */}
        <div className="section-divider mb-12" />

        {/* ══ CONTENT ═══════════════════════════════════════════════════════════ */}
        <TradeEvaluator />

      </main>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════════ */}
      <footer
        className="relative z-10 border-t mt-auto"
        style={{ borderColor: "var(--bg-border)" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[11px]"
              style={{ color: "var(--ink-4)" }}
            >
              OptionRank Lite
            </span>
            <span style={{ color: "var(--bg-border2)" }}>·</span>
            <span
              className="font-mono text-[11px]"
              style={{ color: "var(--ink-4)" }}
            >
              v0.9.0
            </span>
          </div>
          <span
            className="font-mono text-[11px]"
            style={{ color: "var(--ink-4)" }}
          >
            Not financial advice.
          </span>
        </div>
      </footer>
    </>
  );
}
