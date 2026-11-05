import { randomUUID } from "node:crypto";
import { LOCALE } from "../strings";
import { dayOf } from "./days";
import { themeOfMemory } from "./main-occasion";
import { occasionNameKey } from "./occasions";
import { DEFAULT_THEME, type ThemeKey } from "./themes";
import { DATABASE_VERSION, type Database, type Day, type Memory, type Occasion } from "./types";

/**
 * A parsed `database.json` as this version writes it, from whatever version
 * wrote it. A file from version 1 is converted (see `convertVersion1`); the
 * converted file is written back on the next save, as any other change.
 * A file with no version, or one this version doesn't know (say, written by
 * a newer gallery), is refused rather than read as if it were current.
 */
export function upgradeDatabase(raw: unknown): Database {
  const version = (raw as { version?: unknown } | null)?.version;
  if (version === DATABASE_VERSION) return raw as Database;
  if (version === 1) return convertVersion1(raw as Version1Database);
  const found = version === undefined ? "no version" : `version ${JSON.stringify(version)}`;
  throw new Error(
    `database.json has ${found}; this gallery reads versions 1 to ${DATABASE_VERSION}. It was left untouched.`,
  );
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
 *   applied is dropped, as it was already ignored;
 * - every Memory keeps the Main occasion, and so the Theme, it had: where the
 *   tie-break by name would make "Automatica" pick another Occasion, the old
 *   one is chosen for it.
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
    // Every day an Occasion fell on in this Memory, as version 1 listed them:
    // One-off occasions, then Yearly ones, sorted by day alone (a stable sort).
    const fell: FellOn[] = [
      ...oneOffs[index].map(({ old: occasion, occasion: converted }) => ({
        kind: "one-off" as const,
        old: occasion,
        occasion: converted,
        day: occasion.day,
      })),
      ...yearly.flatMap(({ old: occasion, occasion: converted }) =>
        yearlyDays(occasion, memory).map((day) => ({ kind: "yearly" as const, old: occasion, occasion: converted, day })),
      ),
    ].sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));

    // The first day each Occasion fell on, ordered by day, then by name.
    const days = new Map<Occasion, Day>();
    for (const { occasion, day } of fell) if (!days.has(occasion)) days.set(occasion, day);
    const ordered = [...days].sort(
      ([a, dayA], [b, dayB]) => (dayA < dayB ? -1 : dayA > dayB ? 1 : compareNames(a.name, b.name)),
    );
    const occasionIds = ordered.map(([occasion]) => occasion.id);

    const { oneOffOccasions: _oneOffs, mainOccasion: _main, ...kept } = memory;
    const converted: Memory = { ...kept, occasionIds };
    const { previous, chosen } = version1MainOccasion(fell, memory.mainOccasion);
    // Keep the Curator's choice; and where "Automatica" would now pick
    // another Occasion (a same-day tie broken by name), choose the old one.
    if (previous && (chosen || themeOfMemory(converted, occasions).mainOccasion !== previous)) {
      converted.mainOccasionId = previous.id;
    }
    return converted;
  });

  return { version: DATABASE_VERSION, memories, occasions };
}

/** A day a version 1 occasion fell on in a Memory, with the Occasion it became. */
type FellOn = {
  kind: "yearly" | "one-off";
  old: { id: string; theme?: ThemeKey };
  occasion: Occasion;
  day: Day;
};

/**
 * The Occasion version 1 made a Memory's Main occasion, from the days its
 * occasions fell on in version 1's order: the chosen one if it still fell on
 * the Memory and wasn't Neutro (`chosen`), otherwise the first themed one.
 */
function version1MainOccasion(
  fell: FellOn[],
  ref: Version1Memory["mainOccasion"],
): { previous?: Occasion; chosen: boolean } {
  const themed = fell.filter(({ old }) => (old.theme ?? DEFAULT_THEME) !== DEFAULT_THEME);
  const chosen = ref && themed.find(({ kind, old }) => kind === ref.kind && old.id === ref.id);
  return { previous: (chosen ?? themed[0])?.occasion, chosen: Boolean(chosen) };
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
