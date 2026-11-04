import { readingOrder } from "./layout";
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
