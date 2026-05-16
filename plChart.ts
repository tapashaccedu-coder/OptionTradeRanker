"use client";

import { useState, useCallback } from "react";
import { JournalEntry } from "@/types/journal";
import { TradeFormState } from "@/types/trade";
import { ScoreResult } from "@/lib/scoring";

// ─── Storage ──────────────────────────────────────────────────────────────────

const KEY_JOURNAL = "optionrank:journal:v1";
const MAX_ENTRIES = 50; // cap to avoid unbounded growth

function readJournal(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_JOURNAL);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JournalEntry[]) : [];
  } catch {
    return [];
  }
}

function writeJournal(entries: JournalEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_JOURNAL, JSON.stringify(entries));
  } catch { /* storage full — ignore */ }
}

// ─── ID generator ─────────────────────────────────────────────────────────────

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface TradeJournalState {
  entries:     JournalEntry[];
  saveEntry:   (form: TradeFormState, result: ScoreResult) => JournalEntry;
  deleteEntry: (id: string) => void;
  clearJournal: () => void;
}

export function useTradeJournal(): TradeJournalState {
  const [entries, setEntries] = useState<JournalEntry[]>(() => readJournal());

  const saveEntry = useCallback(
    (form: TradeFormState, result: ScoreResult): JournalEntry => {
      const entry: JournalEntry = {
        id:           makeId(),
        savedAt:      new Date().toISOString(),
        ticker:       form.ticker.trim().toUpperCase(),
        optionType:   form.optionType,
        strikePrice:  form.strikePrice,
        entryPrice:   form.entryPrice,
        daysToExpiry: form.daysToExpiry,
        score:        result.score,
        label:        result.label,
        riskReward:   result.riskReward,
        warnings:     result.warnings,
      };

      setEntries((prev) => {
        // Prepend newest, cap at MAX_ENTRIES
        const next = [entry, ...prev].slice(0, MAX_ENTRIES);
        writeJournal(next);
        return next;
      });

      return entry;
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeJournal(next);
      return next;
    });
  }, []);

  const clearJournal = useCallback(() => {
    setEntries([]);
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(KEY_JOURNAL); } catch { /* ignore */ }
    }
  }, []);

  return { entries, saveEntry, deleteEntry, clearJournal };
}
