import { t } from "../strings";
import { GalleryError } from "./errors";
import { findMemory } from "./find-memory";
import { occasionsOfMemory, type Occasion } from "./occasions";
import type { Storage } from "./storage";
import { DEFAULT_THEME, type ThemeKey } from "./themes";
import type { MainOccasionRef, Memory, YearlyOccasion } from "./types";

/** A Memory's effective Main occasion (none when no Occasion is themed) and the Theme it takes. */
export type MemoryTheme = { mainOccasion?: Occasion; theme: ThemeKey };

/**
 * Decides a Memory's Theme:
 * 1. the chosen Main occasion, if it still applies and isn't Neutro;
 * 2. otherwise the first non-Neutro Occasion by day;
 * 3. otherwise the default (Neutro) look, with no Main occasion.
 */
export function themeOfMemory(memory: Memory, yearlyOccasions: YearlyOccasion[]): MemoryTheme {
  const themed = occasionsOfMemory(memory, yearlyOccasions).filter((occasion) => occasion.theme !== DEFAULT_THEME);
  const chosen = memory.mainOccasion && themed.find((occasion) => refersTo(memory.mainOccasion!, occasion));
  const mainOccasion = chosen ?? themed[0];
  return mainOccasion ? { mainOccasion, theme: mainOccasion.theme } : { theme: DEFAULT_THEME };
}

/**
 * Chooses the Main occasion of a Memory, or with nothing goes back to
 * choosing it automatically. It must be one of the Memory's Occasions.
 */
export async function chooseMainOccasion(
  storage: Storage,
  memoryId: string,
  ref: MainOccasionRef | undefined,
): Promise<void> {
  await storage.update((db) => {
    const memory = findMemory(db, memoryId);
    if (!ref) {
      delete memory.mainOccasion;
      return;
    }
    const occasions = occasionsOfMemory(memory, db.yearlyOccasions);
    if (!occasions.some((occasion) => refersTo(ref, occasion))) throw new GalleryError(t.occasions.notFound);
    memory.mainOccasion = { kind: ref.kind, id: ref.id };
  });
}

function refersTo(ref: MainOccasionRef, occasion: Occasion): boolean {
  return ref.kind === occasion.kind && ref.id === occasion.id;
}
