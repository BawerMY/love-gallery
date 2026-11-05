import { t } from "../strings";
import { GalleryError } from "./errors";
import { findMemory } from "./find-memory";
import { occasionsOfMemory } from "./occasions";
import type { Storage } from "./storage";
import { DEFAULT_THEME, type ThemeKey } from "./themes";
import type { Memory, Occasion } from "./types";

/** A Memory's effective Main occasion (none when no Occasion is themed) and the Theme it takes. */
export type MemoryTheme = { mainOccasion?: Occasion; theme: ThemeKey };

/**
 * Decides a Memory's Theme, given the list of Occasions:
 * 1. the chosen Main occasion, if the Memory still has it and it isn't Neutro;
 * 2. otherwise the first non-Neutro Occasion in badge order;
 * 3. otherwise the default (Neutro) look, with no Main occasion.
 */
export function themeOfMemory(memory: Memory, occasions: Occasion[]): MemoryTheme {
  const themed = occasionsOfMemory(memory, occasions).filter((occasion) => occasion.theme !== DEFAULT_THEME);
  const chosen = themed.find((occasion) => occasion.id === memory.mainOccasionId);
  const mainOccasion = chosen ?? themed[0];
  return mainOccasion ? { mainOccasion, theme: mainOccasion.theme } : { theme: DEFAULT_THEME };
}

/**
 * Chooses the Main occasion of a Memory by its Occasion id, or with nothing
 * goes back to choosing it automatically. The Memory must have it, and it
 * must not be Neutro: a Neutro Occasion has no Theme to give.
 */
export async function chooseMainOccasion(
  storage: Storage,
  memoryId: string,
  occasionId: string | undefined,
): Promise<void> {
  await storage.update((db) => {
    const memory = findMemory(db, memoryId);
    if (!occasionId) {
      delete memory.mainOccasionId;
      return;
    }
    const occasion = occasionsOfMemory(memory, db.occasions).find((candidate) => candidate.id === occasionId);
    if (!occasion) throw new GalleryError(t.occasions.notOnMemory);
    if (occasion.theme === DEFAULT_THEME) throw new GalleryError(t.occasions.mainOccasionNeutroRefused);
    memory.mainOccasionId = occasionId;
  });
}
