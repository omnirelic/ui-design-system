// `parseDate` / `formatDateTime` de web/src/lib/safe-date.ts de CLP : jamais « Invalid Date » à l'écran. Interne au paquet.
const LOCALE = "fr-FR";

export function parseDate(value: unknown): Date | null {
  if (value == null) return null;
  if (typeof value === "string" && !value.trim()) return null;
  if (!(value instanceof Date) && typeof value !== "string" && typeof value !== "number") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(value: unknown, options?: Intl.DateTimeFormatOptions, fallback = "—"): string {
  return parseDate(value)?.toLocaleString(LOCALE, options) ?? fallback;
}
