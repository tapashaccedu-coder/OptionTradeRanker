"use client";

import { ScoreResult, ScoreBreakdownItem } from "@/lib/scoring";

// ─── Theme config per verdict ─────────────────────────────────────────────────

const THEME = {
  Good: {
    color:       "#00ff99",
    colorDim:    "rgba(0,255,153,0.12)",
    colorBorder: "rgba(0,255,153,0.22)",
    colorGlow:   "rgba(0,255,153,0.18)",
    shadow:      "0 0 40px rgba(0,255,153,0.08), 0 4px 24px rgba(0,0,0,0.4)",
    label:       "Good",
    sublabel:    "Trade looks solid",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="#00ff99" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  Neutral: {
    color:       "#ffaa00",
    colorDim:    "rgba(255,170,0,0.10)",
    colorBorder: "rgba(255,170,0,0.22)",
    colorGlow:   "rgba(255,170,0,0.15)",
    shadow:      "0 0 40px rgba(255,170,0,0.07), 0 4px 24px rgba(0,0,0,0.4)",
    label:       "Neutral",
    sublabel:    "Proceed with caution",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14" stroke="#ffaa00" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  Risky: {
    color:       "#ff3366",
    colorDim:    "rgba(255,51,102,0.10)",
    colorBorder: "rgba(255,51,102,0.22)",
    colorGlow:   "rgba(255,51,102,0.15)",
    shadow:      "0 0 40px rgba(255,51,102,0.08), 0 4px 24px rgba(0,0,0,0.4)",
    label:       "Risky",
    sublabel:    "High risk — review carefully",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="#ff3366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
} as const;

// ─── SVG ring gauge ───────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const R = 52;
  const stroke = 6;
  const C = 2 * Math.PI * R;
  const pct = score / 10;
  const dash = C * pct;
  const gap  = C - dash;

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="block">
      {/* Track */}
      <circle cx="64" cy="64" r={R} fill="none" stroke="#1e1e2e" strokeWidth={stroke} />
      {/* Progress arc — starts at top (–90°) */}
      <circle
        cx="64" cy="64" r={R}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={C * 0.25}   /* rotate to 12 o'clock */
        style={{
          filter: `drop-shadow(0 0 6px ${color}99)`,
          transition: "stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />
      {/* Center score */}
      <text x="64" y="58" textAnchor="middle" fill={color}
        fontSize="30" fontFamily="'Space Mono', monospace" fontWeight="700">
        {score}
      </text>
      <text x="64" y="76" textAnchor="middle" fill="#44445a"
        fontSize="11" fontFamily="'Space Mono', monospace">
        / 10
      </text>
    </svg>
  );
}

// ─── Metric tile ──────────────────────────────────────────────────────────────

function MetricTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#1e1e2e] bg-[#0d0d14] px-4 py-3.5">
      <span className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase">{label}</span>
      <span
        className="font-mono text-2xl font-bold leading-none tracking-tight"
        style={{ color: accent ?? "#e8e8f0" }}
      >
        {value}
      </span>
      {sub && <span className="text-[10px] font-mono text-[#44445a] mt-0.5">{sub}</span>}
    </div>
  );
}

// ─── Breakdown row ────────────────────────────────────────────────────────────

function BreakdownRow({ item }: { item: ScoreBreakdownItem }) {
  const { passed, label, detail, points, max } = item;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#161622] last:border-0">
      {/* Dot */}
      <div
        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-0.5"
        style={{ backgroundColor: passed ? "#00ff99" : "#ff3366",
                 boxShadow: passed ? "0 0 6px #00ff9988" : "0 0 6px #ff336688" }}
      />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-[#c8c8d8] leading-snug">{label}</p>
        <p className="text-[10px] font-mono text-[#44445a] mt-0.5 leading-relaxed">{detail}</p>
      </div>

      {/* Badge */}
      <div
        className="flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-mono font-bold"
        style={{
          color:           passed ? "#00ff99" : "#44445a",
          backgroundColor: passed ? "rgba(0,255,153,0.08)" : "rgba(68,68,90,0.15)",
        }}
      >
        +{points}/{max}
      </div>
    </div>
  );
}

// ─── Warning row ──────────────────────────────────────────────────────────────

function WarningRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[#ffaa00]/15 bg-[#ffaa00]/[0.04] px-3.5 py-3">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="#ffaa00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <p className="text-xs font-mono text-[#ffaa00]/75 leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export default function ScorePanel({
  result,
  ticker,
  optionType,
}: {
  result: ScoreResult;
  ticker: string;
  optionType: string;
}) {
  const t = THEME[result.label];
  const passCount = result.breakdown.filter((b) => b.passed).length;

  return (
    <div
      className="relative rounded-2xl border overflow-hidden"
      style={{
        borderColor:     t.colorBorder,
        backgroundColor: "#0d0d14",
        boxShadow:       t.shadow,
      }}
    >
      {/* ── Top accent bar ── */}
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(to right, transparent 0%, ${t.color} 40%, ${t.color} 60%, transparent 100%)`,
          opacity: 0.6,
        }}
      />

      {/* ── Ambient glow ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, ${t.colorGlow} 0%, transparent 70%)`,
        }}
      />

      <div className="relative p-6 md:p-8 space-y-7">

        {/* ══ HERO ROW ══ */}
        <div className="flex items-center gap-6">

          {/* Ring gauge */}
          <div className="flex-shrink-0">
            <ScoreRing score={result.score} color={t.color} />
          </div>

          {/* Verdict text */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Ticker + type */}
            <div>
              <p className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase mb-1">
                Evaluation Result
              </p>
              <h3 className="font-mono text-2xl font-bold text-[#e8e8f0] tracking-tight leading-none">
                {ticker.toUpperCase() || "—"}
              </h3>
              <p className="font-mono text-xs text-[#8888aa] mt-1 uppercase tracking-widest">
                {optionType} option
              </p>
            </div>

            {/* Verdict pill */}
            <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5"
              style={{ borderColor: t.colorBorder, backgroundColor: t.colorDim }}>
              <span>{t.icon}</span>
              <span className="font-mono text-sm font-bold tracking-wide" style={{ color: t.color }}>
                {t.label}
              </span>
              <span className="font-mono text-xs text-[#44445a]">— {t.sublabel}</span>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-[#161622]" />

        {/* ══ METRIC TILES ══ */}
        <div className="grid grid-cols-3 gap-3">
          <MetricTile
            label="Score"
            value={`${result.score}`}
            sub="out of 10 pts"
            accent={t.color}
          />
          <MetricTile
            label="Risk / Reward"
            value={result.riskReward !== null ? `${result.riskReward.toFixed(2)}×` : "—"}
            sub={result.riskReward !== null
              ? result.riskReward >= 2 ? "✓ favourable" : "✗ below 2×"
              : "not provided"}
            accent={
              result.riskReward === null ? "#44445a"
              : result.riskReward >= 2 ? "#00ff99"
              : "#ff3366"
            }
          />
          <MetricTile
            label="Checks"
            value={`${passCount}/${result.breakdown.length}`}
            sub={`${result.breakdown.length - passCount} failed`}
          />
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-[#161622]" />

        {/* ══ CRITERIA BREAKDOWN ══ */}
        <div>
          <p className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase mb-1">
            Criteria Breakdown
          </p>
          <div className="rounded-xl border border-[#161622] bg-[#0a0a0f] px-4 divide-y-0">
            {result.breakdown.map((item, i) => (
              <BreakdownRow key={i} item={item} />
            ))}
          </div>
        </div>

        {/* ══ WARNINGS / ALL-CLEAR ══ */}
        {result.warnings.length > 0 ? (
          <div>
            <p className="text-[10px] font-mono text-[#ffaa00] tracking-widest uppercase mb-3">
              Warnings ({result.warnings.length})
            </p>
            <div className="space-y-2">
              {result.warnings.map((w, i) => <WarningRow key={i} text={w} />)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-[#00ff99]/15 bg-[#00ff99]/[0.04] px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <path d="M20 6L9 17l-5-5" stroke="#00ff99" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-xs font-mono text-[#00ff99]/70">
              No warnings — all parameters within acceptable range.
            </p>
          </div>
        )}

      </div>

      {/* ── Bottom edge accent ── */}
      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(to right, transparent, ${t.colorBorder}, transparent)`,
        }}
      />
    </div>
  );
}
