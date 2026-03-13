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

/**
 * Parse a date from Google Sheets.
 * Handles:
 * 1. Serial numbers (e.g. 45730) — Google Sheets UNFORMATTED_VALUE for date cells
 * 2. DD/MM/YYYY or D/M/YYYY — Argentine locale strings
 * 3. ISO 8601 / standard formats that new Date() understands
 */
export function parseDate(value: string | number | null | undefined): Date | null {
  if (value == null || value === "") return null;

  // 1. Google Sheets serial number (number or numeric string)
  const numVal = typeof value === "number" ? value : parseFloat(String(value));
  if (!isNaN(numVal) && numVal > 25000 && numVal < 100000) {
    // Google Sheets epoch: days since 1899-12-30
    // Account for the Lotus 1-2-3 leap year bug (serial 60 = Feb 29, 1900 which doesn't exist)
    const msPerDay = 86400000;
    const sheetsEpoch = new Date(1899, 11, 30).getTime(); // Dec 30, 1899
    const date = new Date(sheetsEpoch + numVal * msPerDay);
    if (!isNaN(date.getTime())) return date;
  }

  const str = String(value).trim();

  // 2. DD/MM/YYYY, D/M/YYYY, or DD/MM/YY (Argentine format, 2 or 4 digit year)
  const ddmmyy = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (ddmmyy) {
    const day = parseInt(ddmmyy[1], 10);
    const month = parseInt(ddmmyy[2], 10);
    let year = parseInt(ddmmyy[3], 10);
    // Handle 2-digit year: 00-49 → 2000-2049, 50-99 → 1950-1999
    if (year < 100) year += year < 50 ? 2000 : 1900;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // 3. YYYY-MM-DD or other ISO formats
  const date = new Date(str);
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
