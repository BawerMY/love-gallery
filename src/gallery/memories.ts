import type { Storage } from "./storage";
import type { Memory } from "./types";

/** Every Memory in Timeline order. */
export async function listTimeline(storage: Storage): Promise<Memory[]> {
  const db = await storage.read();
  return db.memories;
}
