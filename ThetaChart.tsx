"use client";

import { useInstallPrompt } from "@/lib/useInstallPrompt";

export default function Header() {
  const { state, triggerInstall } = useInstallPrompt();

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
          <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
            <div
              className="absolute inset-0 rounded-sm rotate-45"
              style={{ border: "1.5px solid rgba(0,212,255,0.35)" }}
            />
            <div className="w-1.5 h-1.5 rounded-sm" style={{ background: "var(--accent)" }} />
          </div>
          <span className="font-mono text-sm font-bold tracking-tight" style={{ color: "var(--ink-1)" }}>
            Option<span style={{ color: "var(--accent)" }}>Rank</span>
            <span className="font-normal ml-1.5" style={{ color: "var(--ink-4)" }}>Lite</span>
          </span>
        </div>

        {/* ── Right side ── */}
        <div className="flex items-center gap-3">
          {/* Tagline — hidden on mobile */}
          <span
            className="hidden md:block font-mono text-[11px] tracking-wide"
            style={{ color: "var(--ink-4)" }}
          >
            Option Trade Evaluator
          </span>

          <div className="hidden md:block w-px h-4" style={{ background: "var(--bg-border2)" }} />

          {/* Install button — only when browser exposes the prompt */}
          {state === "available" && (
            <button
              onClick={triggerInstall}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-[11px] tracking-wide transition-all duration-150"
              style={{
                color:      "var(--accent)",
                border:     "1px solid rgba(0,212,255,0.25)",
                background: "rgba(0,212,255,0.06)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,212,255,0.12)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,212,255,0.45)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,212,255,0.06)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,212,255,0.25)";
              }}
              title="Install OptionRank Lite as an app"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M12 16l-4-4h3V4h2v8h3l-4 4z" fill="currentColor"/>
                <path d="M20 18H4v2h16v-2z" fill="currentColor"/>
              </svg>
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* Installed confirmation — shown briefly */}
          {state === "installed" && (
            <span
              className="inline-flex items-center gap-1.5 font-mono text-[11px]"
              style={{ color: "var(--green)" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:inline">Installed</span>
            </span>
          )}

          {/* Version + status dot */}
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--green)", boxShadow: "0 0 6px var(--green)" }}
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
