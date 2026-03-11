import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined, currency = "USD", decimals = 2): string {
  if (value == null || isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrencyRound(value: number | null | undefined, currency = "USD"): string {
  return formatCurrency(value, currency, 0);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

export function parseNumber(value: string | null | undefined): number | null {
  if (!value || value === "" || value === "#REF!" || value === "#N/A" || value === "#VALUE!") {
    return null;
  }
  const cleaned = value.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function parseDate(value: string | null | undefined): Date | null {
  if (!value || value === "") return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** Safely convert a possibly-serialized Date back to a Date object */
export function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return isNaN(d.getTime()) ? null : d;
}

export function isEmptyRow(row: string[]): boolean {
  return row.every((cell) => !cell || cell.trim() === "");
}
