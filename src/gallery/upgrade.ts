import { randomUUID } from "node:crypto";
import { LOCALE } from "../strings";
import { dayOf } from "./days";
import { occasionNameKey } from "./occasions";
import { DEFAULT_THEME, type ThemeKey } from "./themes";
import { DATABASE_VERSION, type Database, type Day, type Memory, type Occasion } from "./types";

/**
 * A parsed `database.json` as this version writes it, from whatever version
 * wrote it. A file from version 1 is converted (see `convertVersion1`); the
 * converted file is written back on the next save, as any other change.
 */
export function upgradeDatabase(raw: unknown): Database {
  const db = raw as { version?: number };
  return db.version === 1 ? convertVersion1(raw as Version1Database) : (raw as Database);
}

// Version 1: Occasions matched to Memories by date.

type Version1YearlyOccasion = { id: string; name: string; month: number; day: number; firstYear?: number; theme?: ThemeKey };
type Version1OneOffOccasion = { id: string; name: string; day: Day; theme?: ThemeKey };
type Version1Memory = Omit<Memory, "occasionIds" | "mainOccasionId"> & {
  oneOffOccasions?: Version1OneOffOccasion[];
  mainOccasion?: { kind: "yearly" | "one-off"; id: string };
};
type Version1Database = { version: 1; memories: Version1Memory[]; yearlyOccasions?: Version1YearlyOccasion[] };

/**
 * Turns version 1's Yearly and One-off occasions into the one list of Occasions:
 * - each Yearly occasion becomes an Occasion, added to every Memory it fell on
 *   (on or after its first year, if set);
 * - each One-off occasion becomes an Occasion added to its own Memory;
 * - Occasions with the same name (ignoring case) merge into one, keeping the
 *   first Theme met that isn't Neutro;
 * - each Memory's Occasions are ordered by the day they fell on, then by name;
 * - Main occasion choices point at the new Occasions; a choice that no longer
 *   applied is dropped, as it was already ignored.
 */
function convertVersion1(old: Version1Database): Database {
  const occasions: Occasion[] = [];
  const byName = new Map<string, Occasion>();
  const usedIds = new Set<string>();

  /** The Occasion for this name, created the first time it's met, preferring `id` as its id. */
  function occasionFor(id: string, name: string, theme: ThemeKey = DEFAULT_THEME): Occasion {
    const key = occasionNameKey(name);
    let occasion = byName.get(key);
    if (!occasion) {
      occasion = { id: usedIds.has(id) ? randomUUID() : id, name: name.trim(), theme };
      usedIds.add(occasion.id);
      byName.set(key, occasion);
      occasions.push(occasion);
    } else if (occasion.theme === DEFAULT_THEME) {
      occasion.theme = theme;
    }
    return occasion;
  }

  const yearly = (old.yearlyOccasions ?? []).map((occasion) => ({
    old: occasion,
    occasion: occasionFor(occasion.id, occasion.name, occasion.theme),
  }));
  const oneOffs = old.memories.map((memory) =>
    (memory.oneOffOccasions ?? []).map((occasion) => ({
      old: occasion,
      occasion: occasionFor(occasion.id, occasion.name, occasion.theme),
    })),
  );

  const compareNames = new Intl.Collator(LOCALE).compare;
  const memories = old.memories.map((memory, index): Memory => {
    // The first day each Occasion fell on in this Memory.
    const days = new Map<Occasion, Day>();
    const fellOn = (occasion: Occasion, day: Day) => {
      const known = days.get(occasion);
      if (!known || day < known) days.set(occasion, day);
    };
    for (const { old: occasion, occasion: converted } of yearly) {
      for (const day of yearlyDays(occasion, memory)) fellOn(converted, day);
    }
    for (const { old: occasion, occasion: converted } of oneOffs[index]) fellOn(converted, occasion.day);

    const ordered = [...days].sort(
      ([a, dayA], [b, dayB]) => (dayA < dayB ? -1 : dayA > dayB ? 1 : compareNames(a.name, b.name)),
    );
    const occasionIds = ordered.map(([occasion]) => occasion.id);

    const ref = memory.mainOccasion;
    const chosen =
      ref?.kind === "yearly"
        ? yearly.find(({ old: occasion }) => occasion.id === ref.id)?.occasion
        : ref?.kind === "one-off"
          ? oneOffs[index].find(({ old: occasion }) => occasion.id === ref.id)?.occasion
          : undefined;

    const { oneOffOccasions: _oneOffs, mainOccasion: _main, ...kept } = memory;
    return {
      ...kept,
      occasionIds,
      ...(chosen && occasionIds.includes(chosen.id) && { mainOccasionId: chosen.id }),
    };
  });

  return { version: DATABASE_VERSION, memories, occasions };
}

/**
 * Every day of the Memory's Date range a Yearly occasion fell on: its day in
 * each year Y of the range, with Y on or after the first year if set. A
 * 29 February falls only in leap years.
 */
function yearlyDays(occasion: Version1YearlyOccasion, memory: Pick<Memory, "startDay" | "endDay">): Day[] {
  const days: Day[] = [];
  for (let year = Number(memory.startDay.slice(0, 4)); year <= Number(memory.endDay.slice(0, 4)); year++) {
    if (occasion.firstYear !== undefined && year < occasion.firstYear) continue;
    const day = dayOf(year, occasion.month, occasion.day);
    if (day && day >= memory.startDay && day <= memory.endDay) days.push(day);
  }
  return days;
}
