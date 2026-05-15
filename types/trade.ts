// Trade types

export type OptionType = "call" | "put";
export type TradeStrategy = "long" | "short" | "spread" | "iron_condor" | "strangle";

/** Raw form state — all strings until parsed/validated */
export interface TradeFormState {
  ticker: string;
  stockPrice: string;
  optionType: OptionType;
  strikePrice: string;
  daysToExpiry: string;
  delta: string;
  theta: string;
  impliedVolatility: string;
  entryPrice: string;
  stopLoss: string;
  targetProfit: string;
  positionSize: string;
}

export const defaultTradeForm: TradeFormState = {
  ticker: "",
  stockPrice: "",
  optionType: "call",
  strikePrice: "",
  daysToExpiry: "",
  delta: "",
  theta: "",
  impliedVolatility: "",
  entryPrice: "",
  stopLoss: "",
  targetProfit: "",
  positionSize: "",
};

/** Parsed trade (post-validation) */
export interface Trade {
  id: string;
  ticker: string;
  stockPrice: number;
  optionType: OptionType;
  strikePrice: number;
  daysToExpiry: number;
  delta: number;
  theta: number;
  impliedVolatility: number;
  entryPrice: number;
  stopLoss: number;
  targetProfit: number;
  positionSize: number;
  createdAt: string;
}

export interface TradeScore {
  tradeId: string;
  score: number; // 0–100
  ivRank: number;
  riskReward: number;
  daysToExpiry: number;
  verdict: "strong" | "moderate" | "weak" | "avoid";
}
