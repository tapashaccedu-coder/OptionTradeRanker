"use client";

import { TradeExplanation } from "@/lib/scoring";

// ─── Individual bullet row ────────────────────────────────────────────────────

type BulletKind = "positive" | "negative" | "neutral";

const BULLET_STYLE: Record<BulletKind, { dot: string; text: string; bg: string; border: string }> = {
  positive: {
    dot:    "#00e87a",
    text:   "#a8f5d0",
    bg:     "rgba(0,232,122,0.05)",
    border: "rgba(0,232,122,0.12)",
  },
  negative: {
    dot:    "#ff3d6b",
    text:   "#ffaabb",
    bg:     "rgba(255,61,107,0.05)",
    border: "rgba(255,61,107,0.12)",
  },
  neutral: {
    dot:    "#64647e",
    text:   "#9090aa",
    bg:     "transparent",
    border: "transparent",
  },
};

function Bullet({ text, kind }: { text: string; kind: BulletKind }) {
  const s = BULLET_STYLE[kind];
  return (
    <div
      className="flex items-start gap-2.5 rounded-md px-3 py-2"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      {/* Dot — fixed size, never shrinks */}
      <span
        className="mt-[5px] w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: s.dot,
          boxShadow: kind !== "neutral" ? `0 0 5px ${s.dot}88` : "none",
        }}
      />
      {/* Text — wraps naturally, min-w-0 prevents overflow on mobile */}
      <span
        className="font-mono text-xs leading-relaxed min-w-0 break-words"
        style={{ color: s.text }}
      >
        {text}
      </span>
    </div>
  );
}

// ─── Section group ────────────────────────────────────────────────────────────

function BulletGroup({ items, kind }: { items: string[]; kind: BulletKind }) {
  if (items.length === 0) return null;
  return (
    <>
      {items.map((t, i) => (
        <Bullet key={`${kind[0]}${i}`} text={t} kind={kind} />
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WhyThisTrade({ explanation }: { explanation: TradeExplanation }) {
  const { positives, negatives, neutral } = explanation;
  const total = positives.length + negatives.length + neutral.length;

  // Only skip render when there is truly nothing — return null, not an empty card
  if (total === 0) return null;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <circle cx="12" cy="12" r="10" stroke="#64647e" strokeWidth="1.8" />
          <path
            d="M12 16v-4M12 8h.01"
            stroke="#64647e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="font-mono text-[11px] tracking-widest uppercase"
          style={{ color: "var(--ink-3)" }}
        >
          Why This Trade?
        </span>
        {/* Compact count — helps user understand at a glance */}
        {positives.length > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
            style={{ color: "#00e87a", background: "rgba(0,232,122,0.08)" }}
          >
            {positives.length}✓
          </span>
        )}
        {negatives.length > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
            style={{ color: "#ff3d6b", background: "rgba(255,61,107,0.08)" }}
          >
            {negatives.length}✗
          </span>
        )}
      </div>

      {/* Bullets — positives → negatives → neutral */}
      <div className="space-y-1.5">
        <BulletGroup items={positives} kind="positive" />
        <BulletGroup items={negatives} kind="negative" />
        <BulletGroup items={neutral}   kind="neutral"  />
      </div>
    </div>
  );
}

