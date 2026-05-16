"use client";

import { useState } from "react";
import { ConfidenceResult, ConfidenceLevel } from "@/lib/scoring";

// ─── Visual config ────────────────────────────────────────────────────────────

const STYLE: Record<ConfidenceLevel, {
  color: string;
  bg: string;
  border: string;
  dot: string;
  label: string;
}> = {
  High:   {
    color:  "#00e87a",
    bg:     "rgba(0,232,122,0.07)",
    border: "rgba(0,232,122,0.20)",
    dot:    "#00e87a",
    label:  "High Confidence",
  },
  Medium: {
    color:  "#f5a623",
    bg:     "rgba(245,166,35,0.07)",
    border: "rgba(245,166,35,0.20)",
    dot:    "#f5a623",
    label:  "Medium Confidence",
  },
  Low:    {
    color:  "#ff3d6b",
    bg:     "rgba(255,61,107,0.07)",
    border: "rgba(255,61,107,0.20)",
    dot:    "#ff3d6b",
    label:  "Low Confidence",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConfidenceBadge({ confidence }: { confidence: ConfidenceResult }) {
  const [open, setOpen] = useState(false);
  const s = STYLE[confidence.level];

  return (
    <div className="relative inline-block">
      {/* Badge pill — click to toggle reason list */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide select-none"
        style={{
          color:        s.color,
          background:   s.bg,
          border:       `1px solid ${s.border}`,
          cursor:       confidence.reasons.length > 0 ? "pointer" : "default",
        }}
        aria-expanded={open}
        title={confidence.reasons.length > 0 ? "Click for details" : undefined}
      >
        {/* Animated dot */}
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: s.dot,
            boxShadow:  `0 0 4px ${s.dot}99`,
          }}
        />
        <span className="uppercase tracking-widest">{confidence.level}</span>
        {/* Chevron when there are reasons */}
        {confidence.reasons.length > 0 && (
          <svg
            width="9" height="9" viewBox="0 0 24 24" fill="none"
            style={{
              transform:  open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 150ms",
              opacity:    0.5,
            }}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Reason popover — drops below the badge */}
      {open && confidence.reasons.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1.5 z-20 w-64 rounded-lg shadow-xl"
          style={{
            background:   "#0d0d14",
            border:       `1px solid ${s.border}`,
            boxShadow:    `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${s.border}`,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: s.color }}>
              {s.label}
            </span>
            <span className="font-mono text-[10px]" style={{ color: "var(--ink-4)" }}>
              {confidence.dataCompleteness}% data
            </span>
          </div>

          {/* Reason list */}
          <div className="px-3 py-2 space-y-1.5">
            {confidence.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="mt-[5px] w-1 h-1 rounded-full flex-shrink-0"
                  style={{ background: s.dot }}
                />
                <span
                  className="font-mono text-[11px] leading-relaxed"
                  style={{ color: "var(--ink-3)" }}
                >
                  {r}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
