import { t } from "../strings";
import { changeCover } from "./cover";
import { GalleryError } from "./errors";
import { findMemory } from "./find-memory";
import { changeLayout } from "./layout";
import { changeMainOccasion } from "./main-occasion";
import { changeMemoryDetails, type MemoryInput } from "./memories";
import { placeOccasions, type OccasionChoice } from "./occasions";
import type { Storage } from "./storage";
import type { MediaCell, Memory } from "./types";

/** Everything the Curator edits on a Memory's Admin page before pressing its one Save. */
export type MemoryEdits = {
  /** The title, Cities, Date range and note, as typed. */
  details: MemoryInput;
  /** The Memory's Occasions in badge order: from the list, or new ones to create there. */
  occasions: OccasionChoice[];
  /** The Main occasion, as its place in `occasions`; none for "Automatica". */
  mainOccasion?: number;
  /** New Layout cells by Media id, as `saveLayout` takes them. */
  cells: Record<string, MediaCell>;
  /** The chosen cover's Media id; none for the default cover. */
  coverMediaId?: string;
};

/**
 * Saves every edit of a Memory's Admin page at once: details, Occasions (new
 * ones created in the list), Main occasion, Layout and cover. All or nothing:
 * whatever any of `updateMemory`, `createOccasion`, `chooseMainOccasion`,
 * `saveLayout` or `chooseCover` would refuse saves none of it.
 */
export async function saveMemoryEdits(storage: Storage, memoryId: string, edits: MemoryEdits): Promise<Memory> {
  return storage.update((db) => {
    const memory = findMemory(db, memoryId);
    changeMemoryDetails(db, memory, edits.details);
    const occasionIds = placeOccasions(db, memory, edits.occasions);
    const { mainOccasion } = edits;
    if (mainOccasion !== undefined && !occasionIds[mainOccasion]) throw new GalleryError(t.occasions.notOnMemory);
    changeMainOccasion(db, memory, mainOccasion === undefined ? undefined : occasionIds[mainOccasion]);
    changeLayout(memory, edits.cells);
    changeCover(memory, edits.coverMediaId);
    return { ...memory };
  });
}
