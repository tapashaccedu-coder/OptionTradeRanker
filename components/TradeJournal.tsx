"use client";

import { useState } from "react";
import { JournalEntry } from "@/types/journal";

// ─── Config ───────────────────────────────────────────────────────────────────

const LABEL_STYLE = {
  Good:    { color: "#00ff99", bg: "rgba(0,255,153,0.07)",  border: "rgba(0,255,153,0.18)" },
  Neutral: { color: "#ffaa00", bg: "rgba(255,170,0,0.07)",  border: "rgba(255,170,0,0.18)" },
  Risky:   { color: "#ff3366", bg: "rgba(255,51,102,0.07)", border: "rgba(255,51,102,0.18)" },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ─── Single row ───────────────────────────────────────────────────────────────

function JournalRow({
  entry,
  onDelete,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const style = LABEL_STYLE[entry.label];

  return (
    <div
      className="group relative flex items-center gap-4 rounded-xl border px-5 py-4
                 transition-all duration-150 hover:border-[#2a2a3e]"
      style={{ borderColor: "#1e1e2e", backgroundColor: "#0d0d14" }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
        style={{ backgroundColor: style.color, opacity: 0.6 }}
      />

      {/* Ticker + type */}
      <div className="flex-shrink-0 w-24">
        <p className="font-mono text-sm font-bold text-[#e8e8f0] tracking-tight">
          {entry.ticker || "—"}
        </p>
        <p className="text-[10px] font-mono text-[#44445a] uppercase tracking-widest mt-0.5">
          {entry.optionType} · ${entry.strikePrice || "—"}
        </p>
      </div>

      {/* Score */}
      <div className="flex-shrink-0 w-14 text-center">
        <p
          className="font-mono text-lg font-bold leading-none"
          style={{ color: style.color }}
        >
          {entry.score}
          <span className="text-xs text-[#44445a] font-normal">/10</span>
        </p>
        <p className="text-[10px] font-mono mt-0.5" style={{ color: style.color }}>
          {entry.label}
        </p>
      </div>

      {/* R:R */}
      <div className="flex-shrink-0 w-16 hidden sm:block">
        <p className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase mb-0.5">R:R</p>
        <p className="font-mono text-sm font-bold text-[#e8e8f0]">
          {entry.riskReward !== null ? `${entry.riskReward.toFixed(2)}×` : "—"}
        </p>
      </div>

      {/* Entry / DTE */}
      <div className="flex-shrink-0 w-16 hidden md:block">
        <p className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase mb-0.5">Entry</p>
        <p className="font-mono text-sm text-[#8888aa]">${entry.entryPrice || "—"}</p>
      </div>

      {/* Warnings badge */}
      <div className="hidden sm:flex flex-shrink-0 items-center">
        {entry.warnings.length > 0 ? (
          <span className="flex items-center gap-1 rounded-full border border-[#ffaa00]/20 bg-[#ffaa00]/5 px-2 py-0.5 text-[10px] font-mono text-[#ffaa00]/70">
            <span className="text-[8px]">⚠</span>
            {entry.warnings.length} warn{entry.warnings.length !== 1 ? "s" : ""}
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full border border-[#00ff99]/15 bg-[#00ff99]/5 px-2 py-0.5 text-[10px] font-mono text-[#00ff99]/60">
            <span className="text-[8px]">✓</span>
            clean
          </span>
        )}
      </div>

      {/* Date — push to right */}
      <div className="flex-1 text-right hidden sm:block">
        <p className="text-[10px] font-mono text-[#44445a]">{formatDate(entry.savedAt)}</p>
        <p className="text-[10px] font-mono text-[#2e2e42]">{formatTime(entry.savedAt)}</p>
      </div>

      {/* Delete control */}
      <div className="flex-shrink-0 ml-2">
        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDelete(entry.id)}
              className="rounded px-2 py-1 text-[10px] font-mono font-bold text-[#ff3366]
                         border border-[#ff3366]/30 bg-[#ff3366]/10
                         hover:bg-[#ff3366]/20 transition-all duration-100"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded px-2 py-1 text-[10px] font-mono text-[#44445a]
                         border border-[#1e1e2e] hover:border-[#2e2e3e]
                         transition-all duration-100"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md p-2 text-[#2e2e42] hover:text-[#ff3366]/70
                       hover:bg-[#ff3366]/08 transition-all duration-150
                       opacity-0 group-hover:opacity-100"
            aria-label="Delete entry"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center rounded-xl border border-dashed border-[#1e1e2e]">
      <div className="w-10 h-10 mb-4 rounded-lg border border-[#1e1e2e] flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#44445a]">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
            stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M14 2v6h6M12 18v-6M9 15h6"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="font-mono text-xs text-[#44445a]">No trades saved yet</p>
      <p className="font-mono text-[10px] text-[#2e2e42] mt-1">
        Evaluate a trade then click &ldquo;Save Trade&rdquo; to log it here
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TradeJournal({
  entries,
  onDelete,
  onClear,
}: {
  entries:  JournalEntry[];
  onDelete: (id: string) => void;
  onClear:  () => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="relative rounded-2xl border border-[#1e1e2e] bg-[#0d0d14] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      {/* Top accent */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#00d4ff]/15 to-transparent" />

      <div className="p-6 md:p-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase mb-1">
              Saved trades
            </p>
            <h3 className="font-mono text-base font-bold text-[#e8e8f0] tracking-tight">
              Trade Journal
              {entries.length > 0 && (
                <span className="ml-2 rounded-full border border-[#1e1e2e] bg-[#111118] px-2 py-0.5 text-xs font-mono text-[#44445a]">
                  {entries.length}
                </span>
              )}
            </h3>
          </div>

          {/* Clear all */}
          {entries.length > 0 && (
            <div className="flex items-center gap-2">
              {confirmClear ? (
                <>
                  <button
                    onClick={() => { onClear(); setConfirmClear(false); }}
                    className="rounded-md px-3 py-1.5 text-xs font-mono font-bold text-[#ff3366]
                               border border-[#ff3366]/30 bg-[#ff3366]/10
                               hover:bg-[#ff3366]/20 transition-all duration-100"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="rounded-md px-3 py-1.5 text-xs font-mono text-[#44445a]
                               border border-[#1e1e2e] hover:border-[#2e2e3e] transition-all duration-100"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono
                             text-[#44445a] border border-[#1e1e2e]
                             hover:border-[#ff3366]/25 hover:text-[#ff3366]/60
                             transition-all duration-150"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Column headers (only when entries exist) ── */}
        {entries.length > 0 && (
          <div className="flex items-center gap-4 px-5 mb-2">
            <div className="w-24">
              <span className="text-[10px] font-mono text-[#2e2e42] tracking-widest uppercase">Ticker</span>
            </div>
            <div className="w-14 text-center">
              <span className="text-[10px] font-mono text-[#2e2e42] tracking-widest uppercase">Score</span>
            </div>
            <div className="w-16 hidden sm:block">
              <span className="text-[10px] font-mono text-[#2e2e42] tracking-widest uppercase">R:R</span>
            </div>
            <div className="w-16 hidden md:block">
              <span className="text-[10px] font-mono text-[#2e2e42] tracking-widest uppercase">Entry</span>
            </div>
          </div>
        )}

        {/* ── Entry list ── */}
        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <JournalRow key={entry.id} entry={entry} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#1e1e2e] to-transparent" />
    </div>
  );
}
