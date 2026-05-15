"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { PLChartData } from "@/lib/plChart";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const pl     = payload[0].value as number;
  const isPos  = pl >= 0;
  const color  = isPos ? "#00ff99" : "#ff3366";
  const prefix = isPos ? "+" : "";

  return (
    <div className="rounded-lg border border-[#2a2a3e] bg-[#0d0d14] px-3.5 py-2.5 shadow-xl">
      <p className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase mb-1">
        Stock move
      </p>
      <p className="font-mono text-sm font-bold text-[#e8e8f0]">
        {label > 0 ? "+" : ""}{label}%
      </p>
      <div className="mt-1.5 pt-1.5 border-t border-[#1e1e2e]">
        <p className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase mb-0.5">
          Est. P / L
        </p>
        <p className="font-mono text-sm font-bold" style={{ color }}>
          {prefix}${Math.abs(pl).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] px-3.5 py-2.5 min-w-[90px]">
      <span className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase">{label}</span>
      <span className="font-mono text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PLChart({
  data,
  ticker,
}: {
  data: PLChartData;
  ticker: string;
}) {
  const { points, breakEvenPct, maxProfit, maxLoss, contracts } = data;

  // Format Y-axis tick
  function formatY(v: number) {
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v}`;
  }

  return (
    <div className="relative rounded-2xl border border-[#1e1e2e] bg-[#0d0d14] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      {/* Top accent */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#00d4ff]/25 to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top, rgba(0,212,255,0.04) 0%, transparent 70%)" }}
      />

      <div className="relative p-6 md:p-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase mb-1">
              P / L Simulation
            </p>
            <h3 className="font-mono text-base font-bold text-[#e8e8f0] tracking-tight">
              {ticker.toUpperCase() || "—"}
              <span className="text-[#44445a] font-normal text-xs ml-2">
                · {contracts} contract{contracts !== 1 ? "s" : ""} · mid-trade estimate
              </span>
            </h3>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2">
            <StatPill
              label="Max profit"
              value={maxProfit > 0 ? `+$${maxProfit.toLocaleString()}` : "—"}
              color="#00ff99"
            />
            <StatPill
              label="Max loss"
              value={`-$${Math.abs(maxLoss).toLocaleString()}`}
              color="#ff3366"
            />
            <StatPill
              label="Break-even"
              value={breakEvenPct !== null ? `${breakEvenPct > 0 ? "+" : ""}${breakEvenPct}%` : "—"}
              color="#00d4ff"
            />
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="w-full" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <defs>
                {/* Profit gradient */}
                <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00ff99" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#00ff99" stopOpacity={0.01} />
                </linearGradient>
                {/* Loss gradient */}
                <linearGradient id="gradLoss" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="5%"  stopColor="#ff3366" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#ff3366" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1a1a28"
                vertical={false}
              />

              <XAxis
                dataKey="pricePct"
                tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`}
                tick={{ fill: "#44445a", fontSize: 10, fontFamily: "Space Mono, monospace" }}
                axisLine={{ stroke: "#1e1e2e" }}
                tickLine={false}
                interval={9}
              />

              <YAxis
                tickFormatter={formatY}
                tick={{ fill: "#44445a", fontSize: 10, fontFamily: "Space Mono, monospace" }}
                axisLine={false}
                tickLine={false}
                width={52}
              />

              {/* Zero line */}
              <ReferenceLine
                y={0}
                stroke="#2e2e42"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />

              {/* Break-even line */}
              {breakEvenPct !== null && (
                <ReferenceLine
                  x={Math.round(breakEvenPct)}
                  stroke="#00d4ff"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{
                    value: "B/E",
                    position: "insideTopRight",
                    fill: "#00d4ff",
                    fontSize: 9,
                    fontFamily: "Space Mono, monospace",
                  }}
                />
              )}

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#2e2e42", strokeWidth: 1, strokeDasharray: "3 3" }}
              />

              {/* Loss area (rendered first, behind profit) */}
              <Area
                type="monotone"
                dataKey="pl"
                stroke="none"
                fill="url(#gradLoss)"
                activeDot={false}
                // Only show below zero — we mask via clip via a second Area
              />

              {/* Main line + profit fill */}
              <Area
                type="monotone"
                dataKey="pl"
                stroke="#00d4ff"
                strokeWidth={1.5}
                fill="url(#gradProfit)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#00d4ff",
                  stroke: "#0d0d14",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Disclaimer ── */}
        <p className="mt-4 text-[10px] font-mono text-[#2e2e42] text-center">
          Delta-approximation only · not financial advice · assumes mid-trade hold
        </p>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#1e1e2e] to-transparent" />
    </div>
  );
}
