import { TradeFormState } from "@/types/trade";

// ─── Output types ─────────────────────────────────────────────────────────────

export type ScoreLabel = "Good" | "Neutral" | "Risky";

export interface ScoreBreakdownItem {
  label: string;
  points: number;     // points awarded for this criterion (0 or max)
  max: number;        // max points possible
  passed: boolean;
  detail: string;     // human-readable reason
}

export interface ScoreResult {
  score: number;                     // 0–10
  label: ScoreLabel;
  riskReward: number | null;         // null if stop loss is 0/missing
  breakdown: ScoreBreakdownItem[];
  warnings: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function p(val: string): number {
  return parseFloat(val);
}

function isNum(val: string): boolean {
  return val.trim() !== "" && !isNaN(parseFloat(val));
}

// ─── Main scorer ─────────────────────────────────────────────────────────────

export function scoreTrade(form: TradeFormState): ScoreResult {
  const warnings: string[] = [];
  const breakdown: ScoreBreakdownItem[] = [];

  const delta = isNum(form.delta) ? Math.abs(p(form.delta)) : null;
  const dte   = isNum(form.daysToExpiry) ? p(form.daysToExpiry) : null;
  const iv    = isNum(form.impliedVolatility) ? p(form.impliedVolatility) : null;
  const theta = isNum(form.theta) ? p(form.theta) : null;
  const stop  = isNum(form.stopLoss) ? p(form.stopLoss) : null;
  const tgt   = isNum(form.targetProfit) ? p(form.targetProfit) : null;

  // ── 1. Delta 0.50–0.65 → +2 ──────────────────────────────────────────────
  const deltaPass = delta !== null && delta >= 0.50 && delta <= 0.65;
  breakdown.push({
    label: "Delta (0.50–0.65)",
    points: deltaPass ? 2 : 0,
    max: 2,
    passed: deltaPass,
    detail:
      delta === null
        ? "No delta provided"
        : deltaPass
        ? `Δ ${delta.toFixed(2)} — ideal range`
        : `Δ ${delta.toFixed(2)} — outside 0.50–0.65`,
  });

  // ── 2. DTE 30–60 → +2 ────────────────────────────────────────────────────
  const dtePass = dte !== null && dte >= 30 && dte <= 60;
  breakdown.push({
    label: "Days to Expiry (30–60)",
    points: dtePass ? 2 : 0,
    max: 2,
    passed: dtePass,
    detail:
      dte === null
        ? "No DTE provided"
        : dtePass
        ? `${dte} DTE — sweet spot`
        : dte < 30
        ? `${dte} DTE — too close to expiry`
        : `${dte} DTE — further out than ideal`,
  });
  if (dte !== null && dte < 21) {
    warnings.push(`Short DTE (${dte} days) — gamma risk accelerates under 21 DTE.`);
  }

  // ── 3. IV < 50% → +2 ─────────────────────────────────────────────────────
  const ivPass = iv !== null && iv < 50;
  breakdown.push({
    label: "Implied Volatility (< 50%)",
    points: ivPass ? 2 : 0,
    max: 2,
    passed: ivPass,
    detail:
      iv === null
        ? "No IV provided"
        : ivPass
        ? `IV ${iv.toFixed(1)}% — reasonable premium`
        : `IV ${iv.toFixed(1)}% — elevated; premium is expensive`,
  });
  if (iv !== null && iv >= 50) {
    warnings.push(`High IV (${iv.toFixed(1)}%) — options are expensive; consider credit strategies.`);
  }

  // ── 4. Theta ≥ –0.05 → +2 ────────────────────────────────────────────────
  const thetaPass = theta !== null && theta >= -0.05;
  breakdown.push({
    label: "Theta decay (≥ –0.05 / day)",
    points: thetaPass ? 2 : 0,
    max: 2,
    passed: thetaPass,
    detail:
      theta === null
        ? "No theta provided"
        : thetaPass
        ? `θ ${theta.toFixed(3)} — manageable daily decay`
        : `θ ${theta.toFixed(3)} — high daily decay`,
  });
  if (theta !== null && theta < -0.05) {
    warnings.push(`High theta decay (θ ${theta.toFixed(3)}) — losing >$${Math.abs(theta * 100).toFixed(0)}/contract per day.`);
  }

  // ── 5. Risk/Reward ≥ 2 → +2 ──────────────────────────────────────────────
  let riskReward: number | null = null;
  let rrPass = false;

  if (stop !== null && stop > 0 && tgt !== null) {
    riskReward = tgt / stop;
    rrPass = riskReward >= 2;
  }

  breakdown.push({
    label: "Risk / Reward (≥ 2 : 1)",
    points: rrPass ? 2 : 0,
    max: 2,
    passed: rrPass,
    detail:
      riskReward === null
        ? "Stop loss / target not provided"
        : rrPass
        ? `R:R ${riskReward.toFixed(2)} — favourable ratio`
        : `R:R ${riskReward.toFixed(2)} — reward doesn't justify the risk`,
  });
  if (riskReward !== null && !rrPass) {
    warnings.push(`Low R:R ratio (${riskReward.toFixed(2)}) — target profit should be ≥ 2× the stop loss %.`);
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  const score = breakdown.reduce((sum, b) => sum + b.points, 0);
  const label: ScoreLabel =
    score >= 8 ? "Good" : score >= 5 ? "Neutral" : "Risky";

  return { score, label, riskReward, breakdown, warnings };
}
