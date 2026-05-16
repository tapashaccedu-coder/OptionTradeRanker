"use client";

import { useState } from "react";
import { LiquidityResult, LiquidityGrade } from "@/lib/scoring";

const STYLE: Record<LiquidityGrade, { color: string; bg: string; border: string }> = {
  Excellent: { color: "#00e87a", bg: "rgba(0,232,122,0.07)",  border: "rgba(0,232,122,0.20)" },
  Good:      { color: "#00d4ff", bg: "rgba(0,212,255,0.07)",  border: "rgba(0,212,255,0.20)" },
  Moderate:  { color: "#f5a623", bg: "rgba(245,166,35,0.07)", border: "rgba(245,166,35,0.20)" },
  Poor:      { color: "#ff3d6b", bg: "rgba(255,61,107,0.07)", border: "rgba(255,61,107,0.20)" },
};

export default function LiquidityBadge({ liquidity }: { liquidity: LiquidityResult }) {
  const [open, setOpen] = useState(false);
  const s = STYLE[liquidity.grade];
  const hasFactors = liquidity.factors.length > 0;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => hasFactors && setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide select-none"
        style={{
          color:    s.color,
          background: s.bg,
          border:   `1px solid ${s.border}`,
          cursor:   hasFactors ? "pointer" : "default",
        }}
      >
        {/* Icon: droplet-style liquidity symbol */}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z"
            fill={s.color} opacity="0.8"/>
        </svg>
        <span className="uppercase tracking-widest">{liquidity.grade}</span>
        {liquidity.spreadPct !== null && (
          <span style={{ color: s.color, opacity: 0.65 }}>
            · {liquidity.spreadPct.toFixed(1)}%
          </span>
        )}
        {hasFactors && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms", opacity: 0.5 }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {open && hasFactors && (
        <div
          className="absolute left-0 top-full mt-1.5 z-20 w-56 rounded-lg shadow-xl"
          style={{ background: "#0d0d14", border: `1px solid ${s.border}`, boxShadow: `0 8px 24px rgba(0,0,0,0.5)` }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: s.color }}>
              Liquidity — {liquidity.grade}
            </span>
            <span className="font-mono text-[10px]" style={{ color: "var(--ink-4)" }}>
              {liquidity.score}/2 pts
            </span>
          </div>
          <div className="px-3 py-2 space-y-1.5">
            {liquidity.factors.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-[5px] w-1 h-1 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="font-mono text-[11px] leading-relaxed" style={{ color: "var(--ink-3)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
