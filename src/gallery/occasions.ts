import { randomUUID } from "node:crypto";
import { LOCALE, t } from "../strings";
import { GalleryError } from "./errors";
import { findMemory } from "./find-memory";
import type { Storage } from "./storage";
import { cleanThemeKey } from "./themes";
import type { Database, Memory, Occasion } from "./types";

/** What the Curator fills in for an Occasion on the Admin page. */
export type OccasionInput = {
  name: string;
  /** A Theme key; Neutro when left out. */
  theme?: string;
};

/** The list of Occasions, alphabetically. */
export async function listOccasions(storage: Storage): Promise<Occasion[]> {
  const db = await storage.read();
  const byName = new Intl.Collator(LOCALE).compare;
  return [...db.occasions].sort((a, b) => byName(a.name, b.name));
}

export async function createOccasion(storage: Storage, input: OccasionInput): Promise<Occasion> {
  const fields = cleanOccasionInput(input);
  return storage.update((db) => {
    refuseTakenName(db, fields.name);
    const occasion: Occasion = { id: randomUUID(), ...fields };
    db.occasions.push(occasion);
    return occasion;
  });
}

/** Renames an Occasion or changes its Theme; every Memory that has it shows the change. A Theme left out is Neutro. */
export async function updateOccasion(storage: Storage, id: string, input: OccasionInput): Promise<Occasion> {
  const fields = cleanOccasionInput(input);
  return storage.update((db) => {
    const occasion = findOccasion(db, id);
    refuseTakenName(db, fields.name, id);
    Object.assign(occasion, fields);
    return { ...occasion };
  });
}

/**
 * Deletes an Occasion from the list and takes it off every Memory (dropping
 * it as their Main occasion too). Hands back how many Memories had it.
 */
export async function deleteOccasion(storage: Storage, id: string): Promise<number> {
  return storage.update((db) => {
    db.occasions.splice(db.occasions.indexOf(findOccasion(db, id)), 1);
    const uses = countOccasionUses(db.memories, id);
    for (const memory of db.memories) {
      memory.occasionIds = memory.occasionIds.filter((occasionId) => occasionId !== id);
      if (memory.mainOccasionId === id) delete memory.mainOccasionId;
    }
    return uses;
  });
}

/** How many of these Memories have the Occasion: what deleting it would take it off. */
export function countOccasionUses(memories: Memory[], occasionId: string): number {
  return memories.filter((memory) => memory.occasionIds.includes(occasionId)).length;
}

/** Adds an Occasion from the list to the end of a Memory's Occasions. */
export async function addOccasionToMemory(storage: Storage, memoryId: string, occasionId: string): Promise<void> {
  await storage.update((db) => {
    const memory = findMemory(db, memoryId);
    findOccasion(db, occasionId);
    if (memory.occasionIds.includes(occasionId)) throw new GalleryError(t.occasions.alreadyOnMemory);
    memory.occasionIds.push(occasionId);
  });
}

/**
 * Creates a new Occasion in the list and adds it to the end of a Memory's
 * Occasions in one step, refusing what `createOccasion` refuses.
 */
export async function createOccasionOnMemory(storage: Storage, memoryId: string, input: OccasionInput): Promise<Occasion> {
  const fields = cleanOccasionInput(input);
  return storage.update((db) => {
    const memory = findMemory(db, memoryId);
    refuseTakenName(db, fields.name);
    const occasion: Occasion = { id: randomUUID(), ...fields };
    db.occasions.push(occasion);
    memory.occasionIds.push(occasion.id);
    return occasion;
  });
}

/** Takes an Occasion off a Memory. It stays in the list and on every other Memory. */
export async function removeOccasionFromMemory(storage: Storage, memoryId: string, occasionId: string): Promise<void> {
  await storage.update((db) => {
    const memory = findMemory(db, memoryId);
    const index = memory.occasionIds.indexOf(occasionId);
    if (index < 0) throw new GalleryError(t.occasions.notOnMemory);
    memory.occasionIds.splice(index, 1);
  });
}

/**
 * Sets a Memory's whole badge order. Refused unless it holds exactly the
 * Memory's current Occasions, each once: an order made from a stale page
 * never adds, drops or repeats one.
 */
export async function setOccasionOrder(storage: Storage, memoryId: string, occasionIds: string[]): Promise<void> {
  await storage.update((db) => {
    const memory = findMemory(db, memoryId);
    const current = new Set(memory.occasionIds);
    const isPermutation =
      occasionIds.length === current.size &&
      new Set(occasionIds).size === occasionIds.length &&
      occasionIds.every((id) => current.has(id));
    if (!isPermutation) throw new GalleryError(t.occasions.orderOutdated);
    memory.occasionIds = [...occasionIds];
  });
}

/**
 * A Memory's Occasions as its badges show them, in badge order, each with its
 * Theme. An id no longer in the list is skipped.
 */
export function occasionsOfMemory(memory: Memory, occasions: Occasion[]): Occasion[] {
  const byId = new Map(occasions.map((occasion) => [occasion.id, occasion]));
  return memory.occasionIds.flatMap((id) => byId.get(id) ?? []);
}

function findOccasion(db: Database, id: string): Occasion {
  const occasion = db.occasions.find((candidate) => candidate.id === id);
  if (!occasion) throw new GalleryError(t.occasions.notFound);
  return occasion;
}

/** Trims the name and checks the Theme. */
function cleanOccasionInput(input: OccasionInput): Omit<Occasion, "id"> {
  const name = input.name.trim();
  if (!name) throw new GalleryError(t.occasions.noName);
  return { name, theme: cleanThemeKey(input.theme) };
}

/** Two names are the same Occasion name when they match ignoring upper and lower case and surrounding spaces. */
export function occasionNameKey(name: string): string {
  return name.trim().toLocaleLowerCase(LOCALE);
}

/** Refuses a name another Occasion already has (the Occasion `ignoreId` may keep its own). */
function refuseTakenName(db: Database, name: string, ignoreId?: string) {
  const key = occasionNameKey(name);
  if (db.occasions.some((occasion) => occasion.id !== ignoreId && occasionNameKey(occasion.name) === key)) {
    throw new GalleryError(t.occasions.duplicateName(name));
  }
}
