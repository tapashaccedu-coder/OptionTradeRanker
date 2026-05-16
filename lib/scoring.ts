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
}

export interface TradeExplanation {
  positives: string[];
  negatives: string[];
  neutral:   string[];
}

export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface ConfidenceResult {
  level:   ConfidenceLevel;
  reasons: string[];          // why confidence is what it is (compact, 1 per factor)
  dataCompleteness: number;   // 0–100 % of scored fields that were provided
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function p(val: string): number {
  return parseFloat(val);
}

function isNum(val: string): boolean {
  return val.trim() !== "" && !isNaN(parseFloat(val));
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

  const score = breakdown.reduce((sum, b) => sum + b.points, 0);
  const label: ScoreLabel =
    score >= 8 ? "Good" : score >= 5 ? "Neutral" : "Risky";

  return { score, label, riskReward, breakdown, warnings };
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
// Scoring:
//   Start at 100 confidence points.
//   Deduct for each penalty condition.
//   High ≥ 70 | Medium ≥ 40 | Low < 40

export function buildConfidence(
  form: TradeFormState,
  result: ScoreResult
): ConfidenceResult {
  let points = 100;
  const reasons: string[] = [];

  const isN = (v: string) => v.trim() !== "" && !isNaN(parseFloat(v));
  const n   = (v: string) => parseFloat(v);

  // ── Data completeness ─────────────────────────────────────────────────────
  // Scored fields: delta, DTE, IV, theta, stopLoss+targetProfit (R:R pair)
  const coreFields: (keyof TradeFormState)[] = [
    "delta", "daysToExpiry", "impliedVolatility", "theta", "stopLoss", "targetProfit",
  ];
  const filled = coreFields.filter((k) => isN(form[k] as string)).length;
  const dataCompleteness = Math.round((filled / coreFields.length) * 100);

  if (filled <= 2) {
    points -= 35;
    reasons.push("Very few fields filled — estimate only");
  } else if (filled <= 4) {
    points -= 15;
    reasons.push("Some scoring fields missing");
  }

  // ── Bid/ask spread ────────────────────────────────────────────────────────
  if (isN(form.bidAskSpread) && isN(form.entryPrice) && n(form.entryPrice) > 0) {
    const spreadPct = (n(form.bidAskSpread) / n(form.entryPrice)) * 100;
    if (spreadPct > 15) {
      points -= 30;
      reasons.push(`Spread ${spreadPct.toFixed(0)}% of premium — very wide, execution risk`);
    } else if (spreadPct > 7) {
      points -= 15;
      reasons.push(`Spread ${spreadPct.toFixed(0)}% of premium — wide, slippage likely`);
    } else if (spreadPct <= 3) {
      // Tight spread: slight confidence boost (capped at 100)
      points = Math.min(100, points + 8);
      reasons.push(`Spread ${spreadPct.toFixed(0)}% — tight, good liquidity`);
    }
  }

  // ── Option volume ─────────────────────────────────────────────────────────
  if (isN(form.optionVolume)) {
    const vol = n(form.optionVolume);
    if (vol < 50) {
      points -= 25;
      reasons.push(`Volume ${vol.toFixed(0)} — very low, hard to fill`);
    } else if (vol < 200) {
      points -= 12;
      reasons.push(`Volume ${vol.toFixed(0)} — low, may have fill issues`);
    } else if (vol >= 1000) {
      points = Math.min(100, points + 8);
      reasons.push(`Volume ${vol.toLocaleString()} — high, easy to fill`);
    }
  }

  // ── Open interest ─────────────────────────────────────────────────────────
  if (isN(form.openInterest)) {
    const oi = n(form.openInterest);
    if (oi < 100) {
      points -= 20;
      reasons.push(`OI ${oi.toFixed(0)} — very low open interest`);
    } else if (oi < 500) {
      points -= 8;
      reasons.push(`OI ${oi.toFixed(0)} — thin market`);
    } else if (oi >= 5000) {
      points = Math.min(100, points + 5);
      reasons.push(`OI ${oi.toLocaleString()} — deep market`);
    }
  }

  // ── DTE risk extremes ─────────────────────────────────────────────────────
  if (isN(form.daysToExpiry)) {
    const dte = n(form.daysToExpiry);
    if (dte < 7) {
      points -= 20;
      reasons.push("< 7 DTE — binary gamma event risk");
    } else if (dte > 120) {
      points -= 10;
      reasons.push("> 120 DTE — high uncertainty over long horizon");
    }
  }

  // ── Conflicting signals: high IV + low DTE ────────────────────────────────
  if (isN(form.impliedVolatility) && isN(form.daysToExpiry)) {
    const iv = n(form.impliedVolatility);
    const dte = n(form.daysToExpiry);
    if (iv >= 60 && dte < 21) {
      points -= 15;
      reasons.push("High IV + short DTE — conflicting signals, elevated risk");
    }
  }

  // ── Score vs field completeness conflict ──────────────────────────────────
  // High score with sparse data is suspicious — deflate confidence
  if (result.score >= 8 && dataCompleteness < 50) {
    points -= 20;
    reasons.push("High score based on limited data — not reliable");
  }

  // ── Clamp and classify ────────────────────────────────────────────────────
  points = Math.max(0, Math.min(100, points));
  const level: ConfidenceLevel =
    points >= 70 ? "High" : points >= 40 ? "Medium" : "Low";

  // Keep reasons compact: max 3 (most impactful already listed first)
  return {
    level,
    reasons: reasons.slice(0, 3),
    dataCompleteness,
  };
}
