"use client";

import { useState, useEffect } from "react";
import { TradeFormState, OptionType } from "@/types/trade";
import { scoreTrade } from "@/lib/scoring";
import { buildPLData, PLChartData } from "@/lib/plChart";
import { buildThetaData, ThetaChartData } from "@/lib/thetaChart";
import { usePersistedTrade } from "@/lib/usePersistedTrade";
import { useTradeJournal } from "@/lib/useTradeJournal";
import ScorePanel from "@/components/ScorePanel";
import PLChart from "@/components/PLChart";
import ThetaChart from "@/components/ThetaChart";
import TradeJournal from "@/components/TradeJournal";

// ─── Field config ─────────────────────────────────────────────────────────────

interface FieldConfig {
  key: keyof TradeFormState;
  label: string;
  placeholder: string;
  type?: "text" | "number";
  suffix?: string;
  hint?: string;
}

const UNDERLYING_FIELDS: FieldConfig[] = [
  { key: "ticker",     label: "Ticker",      placeholder: "AAPL",   type: "text",   hint: "Symbol" },
  { key: "stockPrice", label: "Stock Price",  placeholder: "182.50", type: "number", suffix: "$" },
];

const OPTION_FIELDS: FieldConfig[] = [
  { key: "strikePrice",       label: "Strike Price",       placeholder: "185.00", type: "number", suffix: "$" },
  { key: "daysToExpiry",      label: "Days to Expiry",     placeholder: "21",     type: "number", suffix: "DTE" },
  { key: "delta",             label: "Delta",              placeholder: "0.35",   type: "number", hint: "–1 to +1" },
  { key: "theta",             label: "Theta",              placeholder: "−0.08",  type: "number", hint: "Daily decay" },
  { key: "impliedVolatility", label: "Implied Volatility", placeholder: "32.5",   type: "number", suffix: "%" },
  { key: "entryPrice",        label: "Entry Price",        placeholder: "3.20",   type: "number", suffix: "$" },
];

const RISK_FIELDS: FieldConfig[] = [
  { key: "stopLoss",     label: "Stop Loss",     placeholder: "25",   type: "number", suffix: "%" },
  { key: "targetProfit", label: "Target Profit", placeholder: "50",   type: "number", suffix: "%" },
  { key: "positionSize", label: "Position Size", placeholder: "1000", type: "number", suffix: "$" },
];

// ─── Shared section heading ───────────────────────────────────────────────────

function SectionHeading({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <span className="num">{num}</span>
      <span className="title">{title}</span>
      {children}
      <div className="line" />
    </div>
  );
}

// ─── Form group label ─────────────────────────────────────────────────────────

function GroupLabel({ letter, label }: { letter: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold"
        style={{
          background: "var(--accent-dim)",
          color: "var(--accent)",
          border: "1px solid rgba(0,212,255,0.15)",
        }}
      >
        {letter}
      </span>
      <span
        className="font-mono text-[11px] tracking-widest uppercase"
        style={{ color: "var(--ink-3)" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--bg-border)" }} />
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────

function FormField({
  config,
  value,
  onChange,
}: {
  config: FieldConfig;
  value: string;
  onChange: (key: keyof TradeFormState, val: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between">
        <span className="font-mono text-[11px]" style={{ color: "var(--ink-3)" }}>
          {config.label}
        </span>
        {config.hint && (
          <span className="font-mono text-[10px]" style={{ color: "var(--ink-4)" }}>
            {config.hint}
          </span>
        )}
      </label>

      <div className="field-wrap">
        <input
          type={config.type ?? "text"}
          step="any"
          placeholder={config.placeholder}
          value={value}
          onChange={(e) => onChange(config.key, e.target.value)}
          className="field-input"
        />
        {config.suffix && (
          <span
            className="pr-3 font-mono text-[11px] select-none flex-shrink-0"
            style={{ color: "var(--ink-4)" }}
          >
            {config.suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Option type toggle ───────────────────────────────────────────────────────

function OptionTypeToggle({
  value,
  onChange,
}: {
  value: OptionType;
  onChange: (v: OptionType) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="font-mono text-[11px]"
        style={{ color: "var(--ink-3)" }}
      >
        Option Type
      </label>
      <div
        className="flex rounded-lg overflow-hidden"
        style={{
          border: "1px solid var(--bg-border)",
          background: "var(--bg-inset)",
          height: "40px",
        }}
      >
        {(["call", "put"] as OptionType[]).map((type) => {
          const active = value === type;
          const activeColor = type === "call" ? "var(--green)" : "var(--red)";
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              style={{
                flex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                transition: "all 140ms",
                background: active ? `rgba(${type === "call" ? "0,232,122" : "255,61,107"},0.09)` : "transparent",
                color: active ? activeColor : "var(--ink-4)",
                borderBottom: active ? `2px solid ${activeColor}` : "2px solid transparent",
              }}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Collapsible result section ───────────────────────────────────────────────

function CollapsibleSection({
  num,
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  num: string;
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div className="section-heading cursor-pointer select-none group" onClick={() => setOpen((o) => !o)}>
        <span className="num">{num}</span>
        <span className="title group-hover:text-[--ink-2] transition-colors">{title}</span>
        {badge && (
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[10px]"
            style={{
              border: "1px solid var(--bg-border2)",
              background: "var(--bg-raised)",
              color: "var(--ink-4)",
            }}
          >
            {badge}
          </span>
        )}
        <div className="line" />
        {/* Chevron */}
        <button className="collapse-toggle flex-shrink-0">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 180ms var(--ease-out)",
            }}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{open ? "collapse" : "expand"}</span>
        </button>
      </div>

      {/* Content — CSS height transition for smooth collapse */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 220ms var(--ease-out)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TradeEvaluator() {
  const {
    form, result, restoredAt,
    updateField, saveEvaluation, clearResult, clearAll,
  } = usePersistedTrade();

  const { entries, saveEntry, deleteEntry, clearJournal } = useTradeJournal();
  const [savedFlash, setSavedFlash]   = useState(false);
  const [plData, setPlData]           = useState<PLChartData | null>(null);
  const [thetaData, setThetaData]     = useState<ThetaChartData | null>(null);

  useEffect(() => {
    if (result) {
      setPlData(buildPLData(form));
      setThetaData(buildThetaData(form));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(key: keyof TradeFormState, val: string) {
    updateField(key, val);
    if (result) { clearResult(); }
    setPlData(null);
    setThetaData(null);
  }

  function handleReset() {
    clearAll();
    setPlData(null);
    setThetaData(null);
  }

  function handleEvaluate() {
    const r     = scoreTrade(form);
    const pl    = buildPLData(form);
    const theta = buildThetaData(form);
    saveEvaluation(r);
    setPlData(pl);
    setThetaData(theta);
    setTimeout(() => {
      document.getElementById("score-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleSaveToJournal() {
    if (!result) return;
    saveEntry(form, result);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
    setTimeout(() => {
      document.getElementById("trade-journal")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const requiredFilled =
    form.ticker.trim() !== "" &&
    form.stockPrice    !== "" &&
    form.strikePrice   !== "" &&
    form.entryPrice    !== "";

  return (
    <div className="space-y-0">

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 01 — INPUT FORM
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="page-section" style={{ paddingBottom: "3rem" }}>
        <SectionHeading num="01 /" title="Trade Input">
          {restoredAt && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px]"
              style={{
                color: "rgba(0,212,255,0.6)",
                border: "1px solid rgba(0,212,255,0.15)",
                background: "rgba(0,212,255,0.05)",
              }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: "var(--accent)", opacity: 0.7 }}
              />
              session restored
            </span>
          )}
        </SectionHeading>

        {/* Card */}
        <div className="card">
          <div className="card-accent-top" />

          <div className="p-6 md:p-8 space-y-7">

            {/* A – Underlying */}
            <div>
              <GroupLabel letter="A" label="Underlying" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {UNDERLYING_FIELDS.map((f) => (
                  <FormField key={f.key} config={f} value={form[f.key] as string} onChange={handleChange} />
                ))}
              </div>
            </div>

            <div className="h-px" style={{ background: "var(--bg-border)" }} />

            {/* B – Option Details */}
            <div>
              <GroupLabel letter="B" label="Option Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <OptionTypeToggle value={form.optionType} onChange={(v) => handleChange("optionType", v)} />
                </div>
                {OPTION_FIELDS.map((f) => (
                  <FormField key={f.key} config={f} value={form[f.key] as string} onChange={handleChange} />
                ))}
              </div>
            </div>

            <div className="h-px" style={{ background: "var(--bg-border)" }} />

            {/* C – Risk */}
            <div>
              <GroupLabel letter="C" label="Risk Parameters" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {RISK_FIELDS.map((f) => (
                  <FormField key={f.key} config={f} value={form[f.key] as string} onChange={handleChange} />
                ))}
              </div>
            </div>

            <div className="h-px" style={{ background: "var(--bg-border)" }} />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleEvaluate}
                disabled={!requiredFilled}
                className="btn-primary sm:min-w-[180px]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Evaluate Trade
              </button>

              {result && (
                <button
                  type="button"
                  onClick={handleSaveToJournal}
                  className="btn-ghost sm:min-w-[140px]"
                  style={savedFlash ? {
                    color: "var(--green)",
                    borderColor: "rgba(0,232,122,0.3)",
                    background: "rgba(0,232,122,0.06)",
                  } : {
                    color: "rgba(0,212,255,0.7)",
                    borderColor: "rgba(0,212,255,0.2)",
                    background: "rgba(0,212,255,0.04)",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    {savedFlash ? (
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    ) : (
                      <>
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                        <path d="M17 21v-8H7v8M7 3v5h8"
                          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </>
                    )}
                  </svg>
                  {savedFlash ? "Saved!" : "Save Trade"}
                </button>
              )}

              <button type="button" onClick={handleReset} className="btn-danger">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                    stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reset
              </button>

              {/* Hint */}
              <p
                className="sm:ml-auto font-mono text-[11px]"
                style={{ color: "var(--ink-4)" }}
              >
                {!requiredFilled
                  ? "Ticker · Stock Price · Strike · Entry required"
                  : result
                  ? "Edit any field to re-evaluate"
                  : "Ready — click Evaluate ↑"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTIONS 02–04 — RESULTS (collapsible, gated on result)
      ════════════════════════════════════════════════════════════════════════ */}
      {result && (
        <section
          id="score-result"
          className="page-section space-y-10"
          style={{ paddingBottom: "3rem" }}
        >
          {/* Top visual separator */}
          <div
            className="flex items-center gap-4 mb-2"
            style={{ paddingTop: "0.5rem" }}
          >
            <div className="h-px flex-1" style={{ background: "var(--bg-border)" }} />
            <span
              className="font-mono text-[10px] tracking-widest uppercase px-3"
              style={{ color: "var(--ink-4)" }}
            >
              Results
            </span>
            <div className="h-px flex-1" style={{ background: "var(--bg-border)" }} />
          </div>

          {/* 02 — Score */}
          <CollapsibleSection num="02 /" title="Score Result">
            <ScorePanel result={result} ticker={form.ticker} optionType={form.optionType} />
          </CollapsibleSection>

          {/* 03 — P/L Chart */}
          {plData && (
            <CollapsibleSection num="03 /" title="P / L Chart">
              <PLChart data={plData} ticker={form.ticker} />
            </CollapsibleSection>
          )}

          {/* 04 — Theta Decay */}
          {thetaData && (
            <CollapsibleSection num="04 /" title="Theta Decay">
              <ThetaChart data={thetaData} />
            </CollapsibleSection>
          )}
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 05 — TRADE JOURNAL (always visible)
      ════════════════════════════════════════════════════════════════════════ */}
      <section
        id="trade-journal"
        className="page-section"
        style={{ paddingTop: result ? "0" : "0" }}
      >
        {/* Section separator above journal */}
        <div className="section-divider mb-10" />

        <CollapsibleSection
          num="05 /"
          title="Trade Journal"
          badge={entries.length > 0 ? String(entries.length) : undefined}
          defaultOpen={entries.length > 0}
        >
          <div style={{ paddingTop: "0.25rem" }}>
            <TradeJournal
              entries={entries}
              onDelete={deleteEntry}
              onClear={clearJournal}
            />
          </div>
        </CollapsibleSection>
      </section>

    </div>
  );
}
