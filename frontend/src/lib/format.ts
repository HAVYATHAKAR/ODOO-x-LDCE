// Small formatting helpers. Money values arrive from the API as decimal strings.

import { differenceInCalendarDays, format, parseISO } from "date-fns";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
};

export function currencySymbol(code: string | null | undefined): string {
  if (!code) return "";
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? `${code} `;
}

/** Format a decimal-string / number as currency, e.g. "₹1,200". */
export function formatMoney(
  value: string | number | null | undefined,
  currency = "INR",
): string {
  if (value === null || value === undefined || value === "") return `${currencySymbol(currency)}0`;
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return `${currencySymbol(currency)}0`;
  const hasFraction = Math.abs(num % 1) > 0;
  return `${currencySymbol(currency)}${num.toLocaleString(undefined, {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Compact numbers for KPI tiles: 1250000 -> "1.2M". */
export function formatCompact(value: number): string {
  return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isNaN(n) ? 0 : n;
}

// ── Dates ────────────────────────────────────────────────────
export function fmtDate(iso: string, pattern = "MMM d, yyyy"): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

/** "Oct 15 – 22, 2025" style range. */
export function fmtDateRange(startIso: string, endIso: string): string {
  try {
    const start = parseISO(startIso);
    const end = parseISO(endIso);
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();
    if (sameMonth) return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
    if (sameYear) return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  } catch {
    return `${startIso} – ${endIso}`;
  }
}

/** Days until a date, or null if in the past. */
export function daysUntil(iso: string): number | null {
  try {
    const diff = differenceInCalendarDays(parseISO(iso), new Date());
    return diff >= 0 ? diff : null;
  } catch {
    return null;
  }
}

export function fmtRelative(iso: string): string {
  try {
    const d = parseISO(iso);
    const days = differenceInCalendarDays(new Date(), d);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return format(d, "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export function fullName(u: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string;
}): string {
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return name || u.username || "Traveler";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
