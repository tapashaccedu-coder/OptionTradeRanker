"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
  TooltipProps,
} from "recharts";
import { ThetaChartData } from "@/lib/thetaChart";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const value = payload[0]?.value as number;
  const decay = payload[1]?.value as number;

  return (
    <div className="rounded-lg border border-[#2a2a3e] bg-[#0d0d14] px-3.5 py-2.5 shadow-xl min-w-[140px]">
      <p className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase mb-1">
        Days remaining
      </p>
      <p className="font-mono text-sm font-bold text-[#e8e8f0] mb-2">
        {label} DTE
      </p>

      <div className="space-y-1.5 pt-1.5 border-t border-[#1e1e2e]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-mono text-[#44445a] uppercase tracking-wider">Value</span>
          <span className="font-mono text-xs font-bold text-[#00d4ff]">
            ${value?.toFixed(2) ?? "—"}
          </span>
        </div>
        {decay !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-mono text-[#44445a] uppercase tracking-wider">Decay</span>
            <span className="font-mono text-xs font-bold text-[#ff3366]">
              -${Math.abs(decay)?.toFixed(2) ?? "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color = "#e8e8f0",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] px-3.5 py-2.5 min-w-[100px]">
      <span className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase">{label}</span>
      <span className="font-mono text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ThetaChart({ data }: { data: ThetaChartData }) {
  const { points, entryValue, totalDecay, halfLifeDay, theta, dte } = data;

  // X-axis goes DTE → 0 (time moving forward = DTE decreasing)
  // Recharts renders left→right, so we keep the array as-is (DTE down to 0)
  // and reverse the display by using the natural order

  function formatY(v: number) {
    return `$${v.toFixed(0)}`;
  }

  const decayPct = entryValue > 0
    ? Math.round((totalDecay / entryValue) * 100)
    : 0;

  return (
    <div className="relative rounded-2xl border border-[#1e1e2e] bg-[#0d0d14] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      {/* Top accent */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ff3366]/20 to-transparent" />

      {/* Ambient glow — red-tinted for decay context */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top, rgba(255,51,102,0.04) 0%, transparent 70%)" }}
      />

      <div className="relative p-6 md:p-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-mono text-[#44445a] tracking-widest uppercase mb-1">
              Theta Decay
            </p>
            <h3 className="font-mono text-base font-bold text-[#e8e8f0] tracking-tight">
              Option Value Over Time
              <span className="text-[#44445a] font-normal text-xs ml-2">
                · θ {theta.toFixed(3)} / day · {dte} DTE
              </span>
            </h3>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-2">
            <StatPill
              label="Entry value"
              value={`$${entryValue.toFixed(2)}`}
              color="#e8e8f0"
            />
            <StatPill
              label="Total decay"
              value={`-$${totalDecay.toFixed(2)} (${decayPct}%)`}
              color="#ff3366"
            />
            <StatPill
              label="Half-life"
              value={halfLifeDay !== null ? `${halfLifeDay} DTE` : "—"}
              color="#ffaa00"
            />
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="w-full" style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradTheta" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1a1a28"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                reversed={false}
                tickFormatter={(v: number) => `${v}d`}
                tick={{ fill: "#44445a", fontSize: 10, fontFamily: "Space Mono, monospace" }}
                axisLine={{ stroke: "#1e1e2e" }}
                tickLine={false}
                interval="preserveStartEnd"
                // Show time flowing left→right: DTE decreases = time passes
                // Reverse so "time start" (high DTE) is on left
                // X is already DTE desc in our array so it renders correctly
              />

              <YAxis
                tickFormatter={formatY}
                tick={{ fill: "#44445a", fontSize: 10, fontFamily: "Space Mono, monospace" }}
                axisLine={false}
                tickLine={false}
                width={52}
                domain={[0, "dataMax"]}
              />

              {/* Half-life reference line */}
              {halfLifeDay !== null && (
                <ReferenceLine
                  x={halfLifeDay}
                  stroke="#ffaa00"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{
                    value: "50%",
                    position: "insideTopRight",
                    fill: "#ffaa00",
                    fontSize: 9,
                    fontFamily: "Space Mono, monospace",
                  }}
                />
              )}

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#2e2e42", strokeWidth: 1, strokeDasharray: "3 3" }}
              />

              {/* Decay fill */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#00d4ff"
                strokeWidth={1.5}
                fill="url(#gradTheta)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#00d4ff",
                  stroke: "#0d0d14",
                  strokeWidth: 2,
                }}
              />

              {/* Invisible decay series for tooltip only */}
              <Area
                type="monotone"
                dataKey="decay"
                stroke="none"
                fill="none"
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Insight row ── */}
        <div className="mt-4 flex flex-wrap gap-3">
          {/* Decay acceleration note */}
          <div className="flex items-center gap-2 rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] px-3 py-2">
            <div className="w-6 h-3 rounded-sm overflow-hidden flex-shrink-0">
              {/* Mini sparkline indicator */}
              <svg viewBox="0 0 24 12" className="w-full h-full">
                <path d="M0,2 C6,2 10,3 14,6 C18,9 22,11 24,11" stroke="#ff3366" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[10px] font-mono text-[#44445a]">
              Decay accelerates exponentially near expiry
            </p>
          </div>

          {halfLifeDay !== null && halfLifeDay > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-[#ffaa00]/15 bg-[#ffaa00]/[0.04] px-3 py-2">
              <span className="text-[#ffaa00] text-[10px]">◆</span>
              <p className="text-[10px] font-mono text-[#ffaa00]/70">
                50% of value lost by {halfLifeDay} DTE
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="mt-3 text-[10px] font-mono text-[#2e2e42] text-center">
          Exponential decay model · assumes constant theta · actual decay varies with IV and price
        </p>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#1e1e2e] to-transparent" />
    </div>
  );
}
