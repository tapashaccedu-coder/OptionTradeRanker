import { ScoreLabel } from "@/lib/scoring";
import { OptionType } from "@/types/trade";

export interface JournalEntry {
  id: string;                   // uuid-like, generated at save time
  savedAt: string;              // ISO timestamp
  ticker: string;
  optionType: OptionType;
  strikePrice: string;
  entryPrice: string;
  daysToExpiry: string;
  score: number;
  label: ScoreLabel;
  riskReward: number | null;
  warnings: string[];
}
