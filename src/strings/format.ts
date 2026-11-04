/**
 * Formatting shared by every screen, always for the `it-IT` locale.
 * Days are `YYYY-MM-DD` calendar dates with no time zone, so they are read
 * and formatted in UTC to stay on the same day everywhere.
 */
/** Dates are always shown for the Italian locale. */
export const LOCALE = "it-IT";

const dayMonthYear = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", timeZone: "UTC" });
const dayOnly = new Intl.DateTimeFormat(LOCALE, { day: "numeric", timeZone: "UTC" });

function toDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** E.g. "1 maggio 2025", "14–16 marzo 2025", "30 marzo – 2 aprile 2025". */
export function formatDateRange(startDay: string, endDay: string): string {
  const start = toDate(startDay);
  const end = toDate(endDay);
  if (startDay === endDay) return dayMonthYear.format(start);
  if (startDay.slice(0, 7) === endDay.slice(0, 7)) {
    return `${dayOnly.format(start)}–${dayMonthYear.format(end)}`;
  }
  if (startDay.slice(0, 4) === endDay.slice(0, 4)) {
    return `${dayMonth.format(start)} – ${dayMonthYear.format(end)}`;
  }
  return `${dayMonthYear.format(start)} – ${dayMonthYear.format(end)}`;
}

/** A Memory's Cities in order, e.g. "Milano · Bergamo". */
export function formatCities(cities: string[]): string {
  return cities.join(" · ");
}
