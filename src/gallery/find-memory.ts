import { t } from "../strings";
import { GalleryError } from "./errors";
import type { Database, Memory } from "./types";

/** The Memory with this id; a GalleryError when there is none (it may have just been deleted). */
export function findMemory(db: Pick<Database, "memories">, id: string): Memory {
  const memory = db.memories.find((candidate) => candidate.id === id);
  if (!memory) throw new GalleryError(t.memories.notFound);
  return memory;
}
