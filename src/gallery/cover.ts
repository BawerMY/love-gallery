import { t } from "../strings";
import { GalleryError } from "./errors";
import { findMemory } from "./find-memory";
import { readingOrder } from "./layout";
import type { Storage } from "./storage";
import type { MediaItem, Memory } from "./types";

/**
 * The Media item a Timeline card shows: the chosen cover while it is still
 * there, otherwise the first ready item in the Layout (rows top to bottom,
 * then columns left to right). Undefined when the Memory has no ready Media.
 */
export function coverOf(memory: Memory): MediaItem | undefined {
  const chosen = memory.media.find((item) => item.id === memory.coverMediaId);
  if (chosen) return chosen;
  return readingOrder(memory.media.filter((item) => item.status === "ready"))[0];
}

/**
 * Chooses a ready Media item of the Memory as its cover, or with no id goes
 * back to the default cover (the first ready item in the Layout).
 */
export async function chooseCover(storage: Storage, memoryId: string, mediaId: string | undefined): Promise<void> {
  await storage.update((db) => changeCover(findMemory(db, memoryId), mediaId));
}

/** Chooses a Memory's cover, or the default one with no id, refusing what `chooseCover` refuses. */
export function changeCover(memory: Memory, mediaId: string | undefined): void {
  if (mediaId === undefined) {
    delete memory.coverMediaId;
    return;
  }
  const item = memory.media.find((candidate) => candidate.id === mediaId);
  if (item?.status !== "ready") throw new GalleryError(t.layout.coverNotReady);
  memory.coverMediaId = mediaId;
}
