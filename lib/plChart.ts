import { TradeFormState } from "@/types/trade";

export interface PLDataPoint {
  pricePct: number;   // stock price change % (-50 → +50)
  pl: number;         // estimated P/L in dollars
  isProfit: boolean;
}

export interface PLChartData {
  points: PLDataPoint[];
  breakEvenPct: number | null;  // approx break-even stock move %
  maxProfit: number;
  maxLoss: number;
  entryPrice: number;
  contracts: number;
}

/**
 * Lightweight linear P/L simulation using delta approximation.
 *
 * P/L per contract ≈ (delta × stockMove × 100) − (theta × daysHeld × 100) − entryPremium×100
 * We sweep stock price from −50% to +50% of current price,
 * hold DTE/2 days (mid-trade snapshot), and scale by position size.
 *
 * No Black-Scholes — intentionally simple and honest about that.
 */
export function buildPLData(form: TradeFormState): PLChartData | null {
  const stockPrice  = parseFloat(form.stockPrice);
  const entryPrice  = parseFloat(form.entryPrice);
  const delta       = parseFloat(form.delta);
  const theta       = parseFloat(form.theta);
  const dte         = parseFloat(form.daysToExpiry);
  const positionSize = parseFloat(form.positionSize);
  const stopLossPct  = parseFloat(form.stopLoss);
  const targetPct    = parseFloat(form.targetProfit);
  const optionType   = form.optionType;

  // Need at least these to draw something meaningful
  if (
    isNaN(stockPrice) || stockPrice <= 0 ||
    isNaN(entryPrice) || entryPrice <= 0 ||
    isNaN(delta)
  ) return null;

  // Contracts purchased (each contract = 100 shares)
  const premiumPerContract = entryPrice * 100;
  const contracts = positionSize > 0 && !isNaN(positionSize)
    ? Math.max(1, Math.floor(positionSize / premiumPerContract))
    : 1;

  // Days held assumption: half of DTE (mid-life snapshot)
  const daysHeld = !isNaN(dte) && dte > 0 ? dte / 2 : 10;
  const thetaDecay = !isNaN(theta) ? theta * daysHeld * 100 * contracts : 0;

  // Cost basis
  const totalCost = premiumPerContract * contracts;

  // Stop-loss ceiling / target cap in dollar P/L terms
  const stopLossDollar  = !isNaN(stopLossPct)  && stopLossPct  > 0 ? -(totalCost * stopLossPct  / 100) : null;
  const targetDollar    = !isNaN(targetPct)    && targetPct    > 0 ?  (totalCost * targetPct    / 100) : null;

  const points: PLDataPoint[] = [];

  // Sweep −50% to +50% in 1% increments (101 points)
  for (let pct = -50; pct <= 50; pct += 1) {
    const stockMove = stockPrice * (pct / 100);  // absolute move in $

    // Delta-approximate option price change
    // For calls: value rises when stock rises
    // For puts:  value rises when stock falls (delta is negative for puts)
    const effectiveDelta = optionType === "put" ? -Math.abs(delta) : Math.abs(delta);
    const optionMovePerShare = effectiveDelta * stockMove;

    // P/L = (price change − theta decay) × 100 shares × contracts − cost
    // We express as net P/L relative to entry cost
    const rawPL = (optionMovePerShare * 100 * contracts) + thetaDecay;

    // Clamp to stop-loss / target if set
    let pl = rawPL;
    if (stopLossDollar !== null && pl < stopLossDollar) pl = stopLossDollar;
    if (targetDollar   !== null && pl > targetDollar)   pl = targetDollar;

    points.push({
      pricePct: pct,
      pl: Math.round(pl),
      isProfit: pl >= 0,
    });
  }

  // Find approximate break-even (where P/L crosses zero)
  let breakEvenPct: number | null = null;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if ((a.pl < 0 && b.pl >= 0) || (a.pl >= 0 && b.pl < 0)) {
      // Linear interpolation
      const t = Math.abs(a.pl) / (Math.abs(a.pl) + Math.abs(b.pl));
      breakEvenPct = a.pricePct + t * (b.pricePct - a.pricePct);
      breakEvenPct = Math.round(breakEvenPct * 10) / 10;
      break;
    }
  }

  const plValues = points.map((p) => p.pl);
  const maxProfit = Math.max(...plValues);
  const maxLoss   = Math.min(...plValues);

  return { points, breakEvenPct, maxProfit, maxLoss, entryPrice, contracts };
}
