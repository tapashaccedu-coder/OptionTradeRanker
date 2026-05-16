"use client";

import { useState, useCallback } from "react";
import { TradeFormState, defaultTradeForm } from "@/types/trade";
import { ScoreResult } from "@/lib/scoring";

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_FORM   = "optionrank:form:v1";
const KEY_RESULT = "optionrank:result:v1";

// ─── Safe localStorage helpers ────────────────────────────────────────────────
// localStorage is unavailable during SSR and can throw in private mode.

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked — silently ignore
  }
}

function clearStorage(...keys: string[]): void {
  if (typeof window === "undefined") return;
  try {
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** Ensure restored form has all required keys — guards against schema drift */
function isValidForm(obj: unknown): obj is TradeFormState {
  if (!obj || typeof obj !== "object") return false;
  const required = Object.keys(defaultTradeForm) as (keyof TradeFormState)[];
  return required.every((k) => k in (obj as object));
}

/** Basic shape check for a persisted ScoreResult */
function isValidResult(obj: unknown): obj is ScoreResult {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.score === "number" &&
    typeof r.label === "string" &&
    Array.isArray(r.breakdown) &&
    Array.isArray(r.warnings)
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface PersistedTradeState {
  form:           TradeFormState;
  result:         ScoreResult | null;
  restoredAt:     Date | null;
  setForm:        (f: TradeFormState) => void;
  updateField:    (key: keyof TradeFormState, val: string) => void;
  saveEvaluation: (result: ScoreResult) => void;
  clearResult:    () => void;
  clearAll:       () => void;
}

export function usePersistedTrade(): PersistedTradeState {
  // ── Initialise from localStorage synchronously on first render ──
  // Using a lazy initialiser keeps SSR safe (window not accessed during server render)
  const [form, setFormState] = useState<TradeFormState>(() => {
    const saved = readStorage<TradeFormState>(KEY_FORM);
    return isValidForm(saved) ? saved : defaultTradeForm;
  });

  const [result, setResultState] = useState<ScoreResult | null>(() => {
    const saved = readStorage<ScoreResult>(KEY_RESULT);
    return isValidResult(saved) ? saved : null;
  });

  // Track whether we hydrated from storage (used for the "Restored" badge)
  const [restoredAt] = useState<Date | null>(() => {
    const hadForm   = isValidForm(readStorage(KEY_FORM));
    const hadResult = isValidResult(readStorage(KEY_RESULT));
    return (hadForm || hadResult) ? new Date() : null;
  });

  // ── Write-through: persist form on every change ──
  const setForm = useCallback((f: TradeFormState) => {
    setFormState(f);
    writeStorage(KEY_FORM, f);
  }, []);

  const updateField = useCallback(
    (key: keyof TradeFormState, val: string) => {
      setFormState((prev) => {
        const next = { ...prev, [key]: val };
        writeStorage(KEY_FORM, next);
        return next;
      });
    },
    []
  );

  // ── Save result after evaluation ──
  const saveEvaluation = useCallback((r: ScoreResult) => {
    setResultState(r);
    writeStorage(KEY_RESULT, r);
  }, []);

  // ── Clear just the result (form stays) ──
  const clearResult = useCallback(() => {
    setResultState(null);
    clearStorage(KEY_RESULT);
  }, []);

  // ── Clear everything ──
  const clearAll = useCallback(() => {
    setFormState(defaultTradeForm);
    setResultState(null);
    clearStorage(KEY_FORM, KEY_RESULT);
  }, []);

  return { form, result, restoredAt, setForm, updateField, saveEvaluation, clearResult, clearAll };
}
