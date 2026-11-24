/**
 * Small date formatting helpers.
 *
 * These replace the two `date-fns` calls that remained in the UI after the
 * dependency cleanup, so the app does not need to ship a whole date library
 * for two labels.
 */

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "2-digit",
  year: "numeric",
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

function toDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. `Nov 24, 2026` */
export function formatDate(value: Date | string | number): string {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", DATE_OPTIONS).format(date);
}

/** e.g. `Nov 24, 2026 14:05` */
export function formatDateTime(value: Date | string | number): string {
  const date = toDate(value);
  if (!date) return "—";
  const time = new Intl.DateTimeFormat("en-US", TIME_OPTIONS).format(date);
  return `${formatDate(date)} ${time}`;
}
