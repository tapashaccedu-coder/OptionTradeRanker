import { TradeFormState } from "@/types/trade";

// ─── Output types ─────────────────────────────────────────────────────────────

export type ScoreLabel = "Good" | "Neutral" | "Risky";

export interface ScoreBreakdownItem {
  label: string;
  points: number;
  max: number;
  passed: boolean;
  detail: string;
}

export interface ScoreResult {
  score: number;
  label: ScoreLabel;
  riskReward: number | null;
  breakdown: ScoreBreakdownItem[];
  warnings: string[];
  liquidity: LiquidityResult;   // pre-computed, passed through for UI use
}

export interface TradeExplanation {
  positives: string[];
  negatives: string[];
  neutral:   string[];
}

export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface ConfidenceResult {
  level:   ConfidenceLevel;
  reasons: string[];
  dataCompleteness: number;
}

export type LiquidityGrade = "Excellent" | "Good" | "Moderate" | "Poor";

export interface LiquidityResult {
  grade:      LiquidityGrade;
  spreadPct:  number | null;   // spread as % of premium (null if not calculable)
  score:      number;          // 0–2 points for the scoring criterion
  detail:     string;          // one-line summary for breakdown
  factors:    string[];        // individual signals (shown in tooltip / UI)
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function p(val: string): number {
  return parseFloat(val);
}

function isNum(val: string): boolean {
  return val.trim() !== "" && !isNaN(parseFloat(val));
}

// ─── Liquidity assessment ─────────────────────────────────────────────────────
// Returns a grade + 0–2 scoring points based on spread, volume, and OI.
// Called both inside scoreTrade (for the score) and directly (for the UI label).
//
// Weights (configurable):
//   Spread  — primary signal, 50% weight
//   Volume  — secondary,      30% weight
//   OI      — tertiary,       20% weight
// Each component produces 0–10 sub-points; weighted sum → 0–10 → mapped to grade.

const LIQ = {
  // Spread % of premium thresholds
  SPREAD_EXCELLENT:  2,   // ≤ 2%  → 10 pts
  SPREAD_GOOD:       5,   // ≤ 5%  → 7 pts
  SPREAD_MODERATE:  12,   // ≤ 12% → 4 pts
  SPREAD_POOR:      99,   // > 12% → 1 pt (not 0 so partial credit if vol/OI good)

  // Volume thresholds
  VOL_EXCELLENT:  1000,
  VOL_GOOD:        300,
  VOL_MODERATE:    100,

  // Open Interest thresholds
  OI_EXCELLENT:   5000,
  OI_GOOD:        1000,
  OI_MODERATE:     300,

  // Grade cut-offs (weighted 0–10)
  GRADE_EXCELLENT: 7.5,
  GRADE_GOOD:      5.0,
  GRADE_MODERATE:  2.5,

  // Score → criterion points
  CRITERION_MAX: 2,
} as const;

export function assessLiquidity(form: TradeFormState): LiquidityResult {
  const isN = (v: string) => v.trim() !== "" && !isNaN(parseFloat(v));
  const n   = (v: string) => parseFloat(v);

  const hasSpread = isN(form.bidAskSpread) && isN(form.entryPrice) && n(form.entryPrice) > 0;
  const hasVolume = isN(form.optionVolume);
  const hasOI     = isN(form.openInterest);
  const factors:  string[] = [];

  // How many liquidity fields are provided (affects confidence weight below)
  const provided = [hasSpread, hasVolume, hasOI].filter(Boolean).length;

  // ── Spread score (0–10) ─────────────────────────────────────────────────
  let spreadScore = 5;     // neutral default when not provided
  let spreadPct: number | null = null;
  if (hasSpread) {
    spreadPct = (n(form.bidAskSpread) / n(form.entryPrice)) * 100;
    if      (spreadPct <= LIQ.SPREAD_EXCELLENT) { spreadScore = 10; factors.push(`Spread ${spreadPct.toFixed(1)}% — tight`); }
    else if (spreadPct <= LIQ.SPREAD_GOOD)      { spreadScore =  7; factors.push(`Spread ${spreadPct.toFixed(1)}% — acceptable`); }
    else if (spreadPct <= LIQ.SPREAD_MODERATE)  { spreadScore =  4; factors.push(`Spread ${spreadPct.toFixed(1)}% — wide`); }
    else                                          { spreadScore =  1; factors.push(`Spread ${spreadPct.toFixed(1)}% — very wide`); }
  }

  // ── Volume score (0–10) ─────────────────────────────────────────────────
  let volumeScore = 5;     // neutral default
  if (hasVolume) {
    const vol = n(form.optionVolume);
    if      (vol >= LIQ.VOL_EXCELLENT) { volumeScore = 10; factors.push(`Vol ${vol.toLocaleString()} — high`); }
    else if (vol >= LIQ.VOL_GOOD)      { volumeScore =  7; factors.push(`Vol ${vol.toLocaleString()} — good`); }
    else if (vol >= LIQ.VOL_MODERATE)  { volumeScore =  4; factors.push(`Vol ${vol.toLocaleString()} — low`); }
    else                                { volumeScore =  1; factors.push(`Vol ${vol.toLocaleString()} — very low`); }
  }

  // ── OI score (0–10) ─────────────────────────────────────────────────────
  let oiScore = 5;         // neutral default
  if (hasOI) {
    const oi = n(form.openInterest);
    if      (oi >= LIQ.OI_EXCELLENT) { oiScore = 10; factors.push(`OI ${oi.toLocaleString()} — deep`); }
    else if (oi >= LIQ.OI_GOOD)      { oiScore =  7; factors.push(`OI ${oi.toLocaleString()} — adequate`); }
    else if (oi >= LIQ.OI_MODERATE)  { oiScore =  4; factors.push(`OI ${oi.toLocaleString()} — thin`); }
    else                              { oiScore =  1; factors.push(`OI ${oi.toLocaleString()} — very thin`); }
  }

  // ── Weighted composite (0–10) ────────────────────────────────────────────
  // When a field is missing, its default score (5) still participates but at
  // reduced weight — replace missing field weight with the provided fields.
  // If no liquidity data at all, composite defaults to 3 (below Moderate).
  let composite: number;
  if (provided === 0) {
    composite = 3;   // unknown liquidity = Moderate-risk assumption
    factors.push("No liquidity data provided");
  } else {
    // Weights: spread 0.50, volume 0.30, OI 0.20
    composite = spreadScore * 0.50 + volumeScore * 0.30 + oiScore * 0.20;
  }

  // ── Grade ────────────────────────────────────────────────────────────────
  const grade: LiquidityGrade =
    composite >= LIQ.GRADE_EXCELLENT ? "Excellent"
    : composite >= LIQ.GRADE_GOOD    ? "Good"
    : composite >= LIQ.GRADE_MODERATE? "Moderate"
    : "Poor";

  // ── Criterion points for the scoring system ──────────────────────────────
  // Excellent/Good → 2pts | Moderate → 1pt | Poor → 0pts
  const score = grade === "Excellent" || grade === "Good" ? 2 : grade === "Moderate" ? 1 : 0;

  // ── One-line detail for breakdown display ─────────────────────────────────
  const detail =
    provided === 0 ? "No liquidity data — enter spread, volume, or OI"
    : grade === "Excellent" ? "Tight spread, strong volume/OI"
    : grade === "Good"      ? "Acceptable liquidity for execution"
    : grade === "Moderate"  ? "Thin liquidity — expect some slippage"
    :                         "Poor liquidity — wide spread or very low volume";

  return { grade, spreadPct, score, detail, factors };
}

// ─── Main scorer ──────────────────────────────────────────────────────────────

export function scoreTrade(form: TradeFormState): ScoreResult {
  const warnings: string[] = [];
  const breakdown: ScoreBreakdownItem[] = [];

  const delta = isNum(form.delta)             ? Math.abs(p(form.delta)) : null;
  const dte   = isNum(form.daysToExpiry)      ? p(form.daysToExpiry)   : null;
  const iv    = isNum(form.impliedVolatility) ? p(form.impliedVolatility) : null;
  const theta = isNum(form.theta)             ? p(form.theta)           : null;
  const stop  = isNum(form.stopLoss)          ? p(form.stopLoss)        : null;
  const tgt   = isNum(form.targetProfit)      ? p(form.targetProfit)    : null;

  // 1. Delta 0.50–0.65 → +2
  const deltaPass = delta !== null && delta >= 0.50 && delta <= 0.65;
  breakdown.push({
    label: "Delta (0.50–0.65)",
    points: deltaPass ? 2 : 0,
    max: 2,
    passed: deltaPass,
    detail:
      delta === null ? "No delta provided"
      : deltaPass    ? `Δ ${delta.toFixed(2)} — ideal range`
                     : `Δ ${delta.toFixed(2)} — outside 0.50–0.65`,
  });

  // 2. DTE 30–60 → +2
  const dtePass = dte !== null && dte >= 30 && dte <= 60;
  breakdown.push({
    label: "Days to Expiry (30–60)",
    points: dtePass ? 2 : 0,
    max: 2,
    passed: dtePass,
    detail:
      dte === null ? "No DTE provided"
      : dtePass    ? `${dte} DTE — sweet spot`
      : dte < 30   ? `${dte} DTE — too close to expiry`
                   : `${dte} DTE — further out than ideal`,
  });
  if (dte !== null && dte < 21) {
    warnings.push(`Short DTE (${dte} days) — gamma risk accelerates under 21 DTE.`);
  }

  // 3. IV < 50% → +2
  const ivPass = iv !== null && iv < 50;
  breakdown.push({
    label: "Implied Volatility (< 50%)",
    points: ivPass ? 2 : 0,
    max: 2,
    passed: ivPass,
    detail:
      iv === null ? "No IV provided"
      : ivPass    ? `IV ${iv.toFixed(1)}% — reasonable premium`
                  : `IV ${iv.toFixed(1)}% — elevated; premium is expensive`,
  });
  if (iv !== null && iv >= 50) {
    warnings.push(`High IV (${iv.toFixed(1)}%) — options are expensive; consider credit strategies.`);
  }

  // 4. Theta ≥ –0.05 → +2
  const thetaPass = theta !== null && theta >= -0.05;
  breakdown.push({
    label: "Theta decay (≥ –0.05 / day)",
    points: thetaPass ? 2 : 0,
    max: 2,
    passed: thetaPass,
    detail:
      theta === null  ? "No theta provided"
      : thetaPass     ? `θ ${theta.toFixed(3)} — manageable daily decay`
                      : `θ ${theta.toFixed(3)} — high daily decay`,
  });
  if (theta !== null && theta < -0.05) {
    warnings.push(`High theta decay (θ ${theta.toFixed(3)}) — losing >$${Math.abs(theta * 100).toFixed(0)}/contract per day.`);
  }

  // 5. Risk/Reward ≥ 2 → +2
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
      riskReward === null ? "Stop loss / target not provided"
      : rrPass            ? `R:R ${riskReward.toFixed(2)} — favourable ratio`
                          : `R:R ${riskReward.toFixed(2)} — reward doesn't justify the risk`,
  });
  if (riskReward !== null && !rrPass) {
    warnings.push(`Low R:R ratio (${riskReward.toFixed(2)}) — target profit should be ≥ 2× the stop loss %.`);
  }

  // 6. Liquidity (spread, volume, OI) → 0–2 pts
  const liquidity = assessLiquidity(form);
  breakdown.push({
    label:  "Liquidity (spread / vol / OI)",
    points: liquidity.score,
    max:    LIQ.CRITERION_MAX,
    passed: liquidity.score === LIQ.CRITERION_MAX,
    detail: liquidity.detail,
  });
  if (liquidity.grade === "Poor") {
    warnings.push(`Poor liquidity — wide spread or thin volume makes execution difficult.`);
  }

  const score = breakdown.reduce((sum, b) => sum + b.points, 0);
  const label: ScoreLabel =
    score >= 10 ? "Good" : score >= 6 ? "Neutral" : "Risky";

  return { score, label, riskReward, breakdown, warnings, liquidity };
}

// ─── Explanation engine ───────────────────────────────────────────────────────
// Derives plain-language bullets directly from scoring conditions.
// Every line maps 1-to-1 to a real input value — nothing is invented.
//
// Design rules:
//  - Max 3 positives, 3 negatives, 2 neutral — keeps mobile readable
//  - No two bullets describe the same underlying condition
//  - Incomplete-data neutrals are suppressed (they add noise, not signal)
//  - Strategy-fit hints only fire when they add net new information

export function buildTradeExplanation(
  form: TradeFormState,
  result: ScoreResult
): TradeExplanation {
  const positives: string[] = [];
  const negatives: string[] = [];
  const neutral:   string[] = [];

  const delta  = isNum(form.delta)             ? Math.abs(p(form.delta))   : null;
  const dte    = isNum(form.daysToExpiry)      ? p(form.daysToExpiry)      : null;
  const iv     = isNum(form.impliedVolatility) ? p(form.impliedVolatility) : null;
  const theta  = isNum(form.theta)             ? p(form.theta)             : null;
  const entry  = isNum(form.entryPrice)        ? p(form.entryPrice)        : null;
  const strike = isNum(form.strikePrice)       ? p(form.strikePrice)       : null;
  const stock  = isNum(form.stockPrice)        ? p(form.stockPrice)        : null;
  const rr     = result.riskReward;

  // ── Delta ─────────────────────────────────────────────────────────────────
  // Signals probability of profit — primary driver, always show.
  if (delta !== null) {
    if (delta >= 0.50 && delta <= 0.65) {
      positives.push(`Delta ${delta.toFixed(2)} — high-probability zone (0.50–0.65)`);
    } else if (delta > 0.65) {
      negatives.push(`Delta ${delta.toFixed(2)} — deep ITM; high premium cost`);
    } else if (delta >= 0.30) {
      negatives.push(`Delta ${delta.toFixed(2)} — below ideal range; lower win probability`);
    } else {
      negatives.push(`Delta ${delta.toFixed(2)} — far OTM; speculative, low probability`);
    }
  }

  // ── DTE ───────────────────────────────────────────────────────────────────
  if (dte !== null) {
    if (dte >= 30 && dte <= 60) {
      positives.push(`${Math.round(dte)} DTE — sweet spot for theta and time`);
    } else if (dte < 14) {
      negatives.push(`${Math.round(dte)} DTE — very short; gamma spikes near expiry`);
    } else if (dte < 30) {
      negatives.push(`${Math.round(dte)} DTE — short; theta decay accelerating`);
    } else if (dte > 90) {
      neutral.push(`${Math.round(dte)} DTE — longer-dated; slower decay, more runway`);
    } else {
      // 61–90: minor miss, neutral only
      neutral.push(`${Math.round(dte)} DTE — just outside 30–60 sweet spot`);
    }
  }

  // ── IV ────────────────────────────────────────────────────────────────────
  // Track whether IV fired negative so we can suppress the redundant put hint.
  let ivNegative = false;
  if (iv !== null) {
    if (iv < 25) {
      neutral.push(`IV ${iv.toFixed(1)}% — low; cheap premium, suits long options`);
    } else if (iv < 50) {
      positives.push(`IV ${iv.toFixed(1)}% — moderate; premium fairly priced`);
    } else if (iv < 80) {
      negatives.push(`IV ${iv.toFixed(1)}% — elevated; expensive premium, IV crush risk`);
      ivNegative = true;
    } else {
      negatives.push(`IV ${iv.toFixed(1)}% — extreme; strong IV crush risk on long trades`);
      ivNegative = true;
    }
  }

  // ── Theta ─────────────────────────────────────────────────────────────────
  // Only show theta as a positive when it's genuinely good (≥ -0.02).
  // The -0.02 to -0.05 range is "manageable" but not noteworthy as a positive —
  // the scoring system already awards that full 2pts, so don't double-count.
  // For negatives, show whenever theta < -0.05 (scoring penalty zone).
  if (theta !== null) {
    const daily = Math.abs(theta * 100);
    if (theta >= -0.02) {
      positives.push(`θ ${theta.toFixed(3)} — minimal decay ($${daily.toFixed(0)}/contract/day)`);
    } else if (theta < -0.10) {
      negatives.push(`θ ${theta.toFixed(3)} — heavy decay; $${daily.toFixed(0)}/contract/day`);
    } else if (theta < -0.05) {
      negatives.push(`θ ${theta.toFixed(3)} — elevated decay; $${daily.toFixed(0)}/contract/day`);
    }
    // -0.02 to -0.05: pass silently — already reflected in the score
  }

  // ── Risk / Reward ─────────────────────────────────────────────────────────
  if (rr !== null) {
    if (rr >= 3) {
      positives.push(`R:R ${rr.toFixed(2)}× — excellent; reward well exceeds risk`);
    } else if (rr >= 2) {
      positives.push(`R:R ${rr.toFixed(2)}× — meets 2:1 minimum`);
    } else if (rr >= 1) {
      negatives.push(`R:R ${rr.toFixed(2)}× — below 2:1; reward doesn't justify risk`);
    } else {
      negatives.push(`R:R ${rr.toFixed(2)}× — unfavourable; risking more than the potential gain`);
    }
  }
  // Suppress "R:R incomplete" — only one field filled is just noise.

  // ── Moneyness (context bullet, only when delta doesn't already tell the story)
  // Skip if delta already flagged a directional concern (OTM/ITM) — avoid repetition.
  const deltaAlreadyFlagged = delta !== null && (delta < 0.30 || delta > 0.65);
  if (!deltaAlreadyFlagged && stock !== null && strike !== null && stock > 0) {
    const otmPct = ((stock - strike) / stock) * 100;
    if (form.optionType === "call") {
      if (otmPct > 8)        neutral.push(`Strike ${Math.abs(otmPct).toFixed(1)}% OTM — needs a solid rally`);
      else if (otmPct < -3)  neutral.push(`Strike ${Math.abs(otmPct).toFixed(1)}% ITM — intrinsic value included`);
    } else {
      if (otmPct < -8)       neutral.push(`Put ${Math.abs(otmPct).toFixed(1)}% OTM — needs a meaningful drop`);
      else if (otmPct > 3)   neutral.push(`Put ${Math.abs(otmPct).toFixed(1)}% ITM — has intrinsic value`);
    }
  }

  // ── Premium cost vs underlying ────────────────────────────────────────────
  // Only show when meaningfully expensive — skip the "cheap lottery" neutral (too noisy).
  if (entry !== null && stock !== null && stock > 0) {
    const pct = (entry / stock) * 100;
    if (pct > 8) negatives.push(`Premium $${entry.toFixed(2)} is ${pct.toFixed(1)}% of stock — expensive`);
  }

  // ── Strategy-fit hint ─────────────────────────────────────────────────────
  // Only add the put-selling hint when IV is high AND it doesn't contradict
  // an existing negative (no point saying "good for credit" after "IV crush risk").
  if (form.optionType === "put" && iv !== null && iv >= 50 && !ivNegative) {
    positives.push("High IV suits put-selling strategies (CSP / credit spread)");
  }

  // ── Cap lengths — show most impactful bullets only ────────────────────────
  // Positives and negatives capped at 3 each; neutral at 2.
  // Items are already ordered by importance (scoring criteria first).
  return {
    positives: positives.slice(0, 3),
    negatives: negatives.slice(0, 3),
    neutral:   neutral.slice(0, 2),
  };
}

// ─── Confidence engine ────────────────────────────────────────────────────────
// Confidence is orthogonal to score: a high-scoring trade can be Low Confidence
// if liquidity is poor, data is sparse, or signals conflict.
//
// Architecture:
//   - Start from a BASELINE (not 100) that reflects unknown-liquidity uncertainty
//   - Apply penalties that push down from the baseline
//   - Apply credit ONLY to offset specific known penalties (no net boosts above 85)
//   - High ≥ 70 | Medium ≥ 40 | Low < 40
//
// Thresholds are declared as constants so they're easy to tune without
// hunting through conditionals.

const CONF = {
  // Starting baseline — reflects that liquidity is unknown until proven otherwise
  BASELINE: 80,

  // Data completeness penalties
  PENALTY_SPARSE_DATA:      40,  // ≤ 2 of 6 core fields filled
  PENALTY_PARTIAL_DATA:     22,  // 3–4 of 6
  PENALTY_ALMOST_DATA:       8,  // exactly 5 of 6

  // Liquidity not provided at all — soft penalty for unknown
  PENALTY_NO_LIQUIDITY:     12,  // none of bid/ask, volume, OI provided

  // Bid/ask spread (as % of entry premium)
  PENALTY_SPREAD_EXTREME:   35,  // > 20%
  PENALTY_SPREAD_WIDE:      20,  // 10–20%
  PENALTY_SPREAD_MODERATE:  10,  // 5–10%
  CREDIT_SPREAD_TIGHT:      10,  // ≤ 2% — offsets the no-liquidity penalty

  // Volume
  PENALTY_VOLUME_VERY_LOW:  25,  // < 50
  PENALTY_VOLUME_LOW:       12,  // 50–199
  CREDIT_VOLUME_HIGH:        8,  // ≥ 1000

  // Open interest
  PENALTY_OI_VERY_LOW:      20,  // < 100
  PENALTY_OI_LOW:            8,  // 100–499
  CREDIT_OI_HIGH:            5,  // ≥ 5000

  // DTE risk
  PENALTY_DTE_BINARY:       25,  // < 7 — binary gamma
  PENALTY_DTE_SHORT:        10,  // 7–20 — scoring warning zone
  PENALTY_DTE_LONG:         10,  // > 120

  // Conflicting signals
  PENALTY_CONFLICT_IV_DTE:  15,  // IV ≥ 60 + DTE < 21
  PENALTY_CONFLICT_SCORE:   20,  // high score + sparse data (suspicious)
  PENALTY_MANY_WARNINGS:    15,  // 2+ scoring warnings suggests instability

  // Thresholds
  THRESHOLD_HIGH:   70,
  THRESHOLD_MEDIUM: 40,
} as const;

export function buildConfidence(
  form: TradeFormState,
  result: ScoreResult
): ConfidenceResult {
  let points: number = CONF.BASELINE;
  const cap = CONF.BASELINE; // credits never push above the starting baseline
  const reasons: string[] = [];

  const isN = (v: string) => v.trim() !== "" && !isNaN(parseFloat(v));
  const n   = (v: string) => parseFloat(v);

  // ── Data completeness ─────────────────────────────────────────────────────
  // Core scored fields — these directly affect the score, so missing = uncertain
  const coreFields: (keyof TradeFormState)[] = [
    "delta", "daysToExpiry", "impliedVolatility", "theta", "stopLoss", "targetProfit",
  ];
  const filled = coreFields.filter((k) => isN(form[k] as string)).length;
  const dataCompleteness = Math.round((filled / coreFields.length) * 100);

  if (filled <= 2) {
    points -= CONF.PENALTY_SPARSE_DATA;
    reasons.push("Very few fields filled — estimate only");
  } else if (filled <= 4) {
    points -= CONF.PENALTY_PARTIAL_DATA;
    reasons.push("Several scoring fields missing");
  } else if (filled === 5) {
    points -= CONF.PENALTY_ALMOST_DATA;
    // Silent — minor gap, no reason needed
  }

  // ── Liquidity fields — penalize absence, credit presence ─────────────────
  const hasSpread = isN(form.bidAskSpread);
  const hasVolume = isN(form.optionVolume);
  const hasOI     = isN(form.openInterest);
  const liquidityFieldCount = [hasSpread, hasVolume, hasOI].filter(Boolean).length;

  if (liquidityFieldCount === 0) {
    // No liquidity data at all — unknown execution quality
    points -= CONF.PENALTY_NO_LIQUIDITY;
    reasons.push("No liquidity data — fill spread, volume, or OI to improve");
  }

  // Bid/ask spread
  if (hasSpread && isN(form.entryPrice) && n(form.entryPrice) > 0) {
    const spreadPct = (n(form.bidAskSpread) / n(form.entryPrice)) * 100;
    if (spreadPct > 20) {
      points -= CONF.PENALTY_SPREAD_EXTREME;
      reasons.push(`Spread ${spreadPct.toFixed(0)}% of premium — extremely wide, execution very risky`);
    } else if (spreadPct > 10) {
      points -= CONF.PENALTY_SPREAD_WIDE;
      reasons.push(`Spread ${spreadPct.toFixed(0)}% of premium — wide, expect slippage`);
    } else if (spreadPct > 5) {
      points -= CONF.PENALTY_SPREAD_MODERATE;
      reasons.push(`Spread ${spreadPct.toFixed(0)}% of premium — moderate spread`);
    } else if (spreadPct <= 2) {
      // Tight spread: credit — but cap so we can't exceed BASELINE
      points = Math.min(cap, points + CONF.CREDIT_SPREAD_TIGHT);
      reasons.push(`Spread ${spreadPct.toFixed(1)}% — tight, good execution`);
    }
  }

  // Option volume
  if (hasVolume) {
    const vol = n(form.optionVolume);
    if (vol < 50) {
      points -= CONF.PENALTY_VOLUME_VERY_LOW;
      reasons.push(`Volume ${vol.toFixed(0)} — very thin, difficult to fill`);
    } else if (vol < 200) {
      points -= CONF.PENALTY_VOLUME_LOW;
      reasons.push(`Volume ${vol.toFixed(0)} — below 200, fill quality uncertain`);
    } else if (vol >= 1000) {
      points = Math.min(cap, points + CONF.CREDIT_VOLUME_HIGH);
      reasons.push(`Volume ${vol.toLocaleString()} — liquid, easy fills`);
    }
    // 200–999: acceptable, no signal either way
  }

  // Open interest
  if (hasOI) {
    const oi = n(form.openInterest);
    if (oi < 100) {
      points -= CONF.PENALTY_OI_VERY_LOW;
      reasons.push(`OI ${oi.toFixed(0)} — very thin market`);
    } else if (oi < 500) {
      points -= CONF.PENALTY_OI_LOW;
      reasons.push(`OI ${oi.toFixed(0)} — low open interest`);
    } else if (oi >= 5000) {
      points = Math.min(cap, points + CONF.CREDIT_OI_HIGH);
      reasons.push(`OI ${oi.toLocaleString()} — deep market`);
    }
  }

  // ── DTE risk ──────────────────────────────────────────────────────────────
  if (isN(form.daysToExpiry)) {
    const dte = n(form.daysToExpiry);
    if (dte < 7) {
      points -= CONF.PENALTY_DTE_BINARY;
      reasons.push(`${Math.round(dte)} DTE — near-binary outcome, gamma explodes`);
    } else if (dte < 21) {
      // Aligned with scoring warning boundary
      points -= CONF.PENALTY_DTE_SHORT;
      reasons.push(`${Math.round(dte)} DTE — short expiry, gamma risk elevated`);
    } else if (dte > 120) {
      points -= CONF.PENALTY_DTE_LONG;
      reasons.push(`${Math.round(dte)} DTE — long horizon, higher macro uncertainty`);
    }
  }

  // ── Conflicting signals ───────────────────────────────────────────────────
  if (isN(form.impliedVolatility) && isN(form.daysToExpiry)) {
    const iv  = n(form.impliedVolatility);
    const dte = n(form.daysToExpiry);
    if (iv >= 60 && dte < 21) {
      points -= CONF.PENALTY_CONFLICT_IV_DTE;
      reasons.push("High IV + short DTE — conflicting signals, IV crush imminent");
    }
  }

  // Multiple scoring warnings = model itself is flagging instability
  if (result.warnings.length >= 2) {
    points -= CONF.PENALTY_MANY_WARNINGS;
    reasons.push(`${result.warnings.length} scoring warnings — check criteria breakdown`);
  }

  // High score on sparse data — don't trust it
  if (result.score >= 8 && dataCompleteness < 50) {
    points -= CONF.PENALTY_CONFLICT_SCORE;
    reasons.push("High score from limited data — not reliable");
  }

  // ── Clamp and classify ────────────────────────────────────────────────────
  points = Math.max(0, Math.min(100, points));
  const level: ConfidenceLevel =
    points >= CONF.THRESHOLD_HIGH   ? "High"
    : points >= CONF.THRESHOLD_MEDIUM ? "Medium"
    : "Low";

  // Surface the most impactful reasons first (already ordered by deduction size).
  // Suppress the "no liquidity" reason if liquidity was actually provided —
  // that reason is only inserted when liquidityFieldCount === 0, so no extra filter needed.
  return {
    level,
    reasons: reasons.slice(0, 3),
    dataCompleteness,
  };
}
