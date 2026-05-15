// Utility helpers — will be expanded in future prompts

/**
 * Format a number as a dollar amount
 */
export function formatDollar(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Days between two dates
 */
export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/**
 * Generate a simple unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
