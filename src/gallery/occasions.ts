import { randomUUID } from "node:crypto";
import { LOCALE, t } from "../strings";
import { GalleryError } from "./errors";
import type { Storage } from "./storage";
import type { Day, Memory, YearlyOccasion } from "./types";

/** What the Curator fills in for a Yearly occasion on the Admin page. */
export type YearlyOccasionInput = {
  name: string;
  month: number;
  day: number;
  firstYear?: number;
};

/** Every Yearly occasion, in calendar order (January first), then by name. */
export async function listYearlyOccasions(storage: Storage): Promise<YearlyOccasion[]> {
  const db = await storage.read();
  const byName = new Intl.Collator(LOCALE).compare;
  return [...db.yearlyOccasions].sort(
    (a, b) => a.month - b.month || a.day - b.day || byName(a.name, b.name),
  );
}

export async function createYearlyOccasion(
  storage: Storage,
  input: YearlyOccasionInput,
): Promise<YearlyOccasion> {
  const fields = cleanYearlyInput(input);
  return storage.update((db) => {
    const occasion: YearlyOccasion = { id: randomUUID(), ...fields };
    db.yearlyOccasions.push(occasion);
    return occasion;
  });
}

/** Replaces every field of a Yearly occasion. A first year left out is removed. */
export async function updateYearlyOccasion(
  storage: Storage,
  id: string,
  input: YearlyOccasionInput,
): Promise<YearlyOccasion> {
  const fields = cleanYearlyInput(input);
  return storage.update((db) => {
    const index = db.yearlyOccasions.findIndex((occasion) => occasion.id === id);
    if (index < 0) throw new GalleryError(t.occasions.notFound);
    const occasion: YearlyOccasion = { id, ...fields };
    db.yearlyOccasions[index] = occasion;
    return occasion;
  });
}

/** Deletes a Yearly occasion, so it no longer shows on any Memory. */
export async function deleteYearlyOccasion(storage: Storage, id: string): Promise<void> {
  await storage.update((db) => {
    const index = db.yearlyOccasions.findIndex((occasion) => occasion.id === id);
    if (index < 0) throw new GalleryError(t.occasions.notFound);
    db.yearlyOccasions.splice(index, 1);
  });
}

/** Trims the name and checks the day, month and first year. 29 February is allowed. */
function cleanYearlyInput(input: YearlyOccasionInput): Omit<YearlyOccasion, "id"> {
  const name = input.name.trim();
  const { month, day, firstYear } = input;
  if (!name) throw new GalleryError(t.occasions.noName);
  // 2024 is a leap year, so every day that exists in some year passes.
  if (!Number.isInteger(month) || !Number.isInteger(day) || !dayInYear({ month, day }, 2024)) {
    throw new GalleryError(t.occasions.invalidDay);
  }
  if (firstYear !== undefined && (!Number.isInteger(firstYear) || firstYear < 1 || firstYear > 9999)) {
    throw new GalleryError(t.occasions.invalidFirstYear);
  }
  return { name, month, day, ...(firstYear !== undefined && { firstYear }) };
}

/**
 * One Occasion as it appears on a Memory: a Yearly occasion matched to a day
 * of its Date range (or, later, a One-off occasion added to it).
 */
export type Occasion = {
  /** The id of the Yearly or One-off occasion this comes from. */
  id: string;
  kind: "yearly" | "one-off";
  name: string;
  /** The day of the Date range it falls on. */
  day: Day;
  /** For a Yearly occasion with a first year: how many years since then (1 or more). */
  number?: number;
};

/**
 * The Occasions of a Memory, sorted by day. Yearly occasions are never stored
 * on a Memory: one belongs to it whenever its Date range includes the
 * occasion's day in some year Y, with Y on or after the first year if set.
 * One-off occasions (ticket 09) are merged into the same list before sorting.
 */
export function occasionsOfMemory(memory: Memory, yearlyOccasions: YearlyOccasion[]): Occasion[] {
  const occasions: Occasion[] = [];
  const firstYear = Number(memory.startDay.slice(0, 4));
  const lastYear = Number(memory.endDay.slice(0, 4));
  for (const yearly of yearlyOccasions) {
    for (let year = firstYear; year <= lastYear; year++) {
      const day = dayInYear(yearly, year);
      if (!day || day < memory.startDay || day > memory.endDay) continue;
      if (yearly.firstYear !== undefined && year < yearly.firstYear) continue;
      const number = yearly.firstYear === undefined ? 0 : year - yearly.firstYear;
      occasions.push({
        id: yearly.id,
        kind: "yearly",
        name: yearly.name,
        day,
        ...(number > 0 && { number }),
      });
    }
  }
  return occasions.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

/** The occasion's day in `year`, or nothing if that year has no such day (29 February). */
function dayInYear(yearly: Pick<YearlyOccasion, "month" | "day">, year: number): Day | undefined {
  if (yearly.month < 1 || yearly.month > 12 || yearly.day < 1) return undefined;
  const day = `${String(year).padStart(4, "0")}-${pad(yearly.month)}-${pad(yearly.day)}`;
  const date = new Date(`${day}T00:00:00Z`);
  return date.getUTCDate() === yearly.day ? day : undefined;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
