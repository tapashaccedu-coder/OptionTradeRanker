import { TradeFormState } from "@/types/trade";

export interface ThetaPoint {
  day: number;         // days remaining (DTE → 0)
  value: number;       // option value at this point
  decay: number;       // cumulative decay from entry
}

export interface ThetaChartData {
  points: ThetaPoint[];
  entryValue: number;
  totalDecay: number;
  halfLifeDay: number | null;  // day at which 50% of value is lost
  theta: number;
  dte: number;
}

/**
 * Exponential theta decay model.
 *
 * Real theta accelerates as expiry approaches — especially the last 30 DTE.
 * We model this with a modified exponential: V(t) = V0 × e^(k × t/DTE)
 * where k is tuned from the daily theta as a fraction of entry price.
 *
 * This gives a realistic convex curve vs a flat linear one.
 */
export function buildThetaData(form: TradeFormState): ThetaChartData | null {
  const theta       = parseFloat(form.theta);
  const dte         = parseFloat(form.daysToExpiry);
  const entryPrice  = parseFloat(form.entryPrice);

  // Need theta, dte and entry price
  if (isNaN(theta) || isNaN(dte) || dte <= 0 || isNaN(entryPrice) || entryPrice <= 0) {
    return null;
  }

  // theta is negative (decay), work with magnitude per share
  const thetaAbs = Math.abs(theta);                 // $ per day per share
  const entryValue = entryPrice * 100;              // per contract in $

  // Decay rate k: derived from theta as fraction of entry value
  // k controls how fast the curve bends — higher = more acceleration near expiry
  // Floor at 0.5 so even small theta shows some curve shape
  const dailyDecayFraction = (thetaAbs * 100) / entryValue;
  const k = Math.max(0.5, Math.min(4.0, dailyDecayFraction * dte * 1.5));

  const points: ThetaPoint[] = [];

  // Generate one point per day, from DTE down to 0
  const step = dte <= 60 ? 1 : Math.ceil(dte / 60);  // cap at ~60 points

  for (let daysRemaining = Math.ceil(dte); daysRemaining >= 0; daysRemaining -= step) {
    const t = daysRemaining / dte;  // normalized time remaining (1 → 0)

    // Exponential: value = entry × e^(-k(1-t)) — decays most at low t (near expiry)
    const value = entryValue * Math.exp(-k * (1 - t));
    const decay = entryValue - value;

    points.push({
      day: daysRemaining,
      value: Math.max(0, Math.round(value * 100) / 100),
      decay: Math.round(decay * 100) / 100,
    });
  }

  // Ensure t=0 endpoint is always included
  if (points[points.length - 1]?.day !== 0) {
    const expiryValue = entryValue * Math.exp(-k);
    points.push({
      day: 0,
      value: Math.max(0, Math.round(expiryValue * 100) / 100),
      decay: Math.round((entryValue - expiryValue) * 100) / 100,
    });
  }

  // Total decay over full life
  const totalDecay = entryValue - (points[points.length - 1]?.value ?? 0);

  // Half-life: first day where value ≤ 50% of entry
  const halfLifePoint = points.find((p) => p.value <= entryValue * 0.5);
  const halfLifeDay = halfLifePoint?.day ?? null;

  return {
    points,
    entryValue,
    totalDecay: Math.round(totalDecay * 100) / 100,
    halfLifeDay,
    theta,
    dte: Math.ceil(dte),
  };
}
