import { t } from "../strings";
import { GalleryError } from "./errors";

declare const dayBrand: unique symbol;

/**
 * A calendar date with no time zone, formatted `YYYY-MM-DD`. Branded, so a
 * plain string only becomes a Day through `parseDay` or `isDay` at the
 * boundaries (forms, files, capture times); past them it is never re-checked.
 * Days compare correctly as strings.
 */
export type Day = string & { readonly [dayBrand]: true };

/** Whether `value` is a real calendar date written `YYYY-MM-DD`. */
export function isDay(value: string): value is Day {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** The Day written in `value` (surrounding spaces ignored); a GalleryError when it isn't one. */
export function parseDay(value: string): Day {
  const trimmed = value.trim();
  if (!isDay(trimmed)) throw new GalleryError(t.memories.invalidDay);
  return trimmed;
}

/** The Day of `year`, `month` (1–12) and `day`, or undefined when that date doesn't exist (29 February). */
export function dayOf(year: number, month: number, day: number): Day | undefined {
  const value = `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
  return isDay(value) ? value : undefined;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
