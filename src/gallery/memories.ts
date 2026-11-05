import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { LOCALE, t } from "../strings";
import { parseDay } from "./days";
import { GalleryError } from "./errors";
import { findMemory } from "./find-memory";
import type { Storage } from "./storage";
import type { Database, Day, Memory } from "./types";

/** What the Curator fills in for a Memory on the Admin page, as typed: the days are checked here. */
export type MemoryInput = {
  title?: string;
  note?: string;
  cities: string[];
  startDay: string;
  endDay: string;
};

type MemoryFields = Pick<Memory, "title" | "note" | "cities" | "startDay" | "endDay">;

/** Every Memory in Timeline order. */
export async function listTimeline(storage: Storage): Promise<Memory[]> {
  const db = await storage.read();
  return [...db.memories].sort((a, b) => compareDays(a.startDay, b.startDay));
}

/** Creates a Memory with no Media and no Occasions. */
export async function createMemory(storage: Storage, input: MemoryInput): Promise<Memory> {
  const fields = cleanInput(input);
  return storage.update((db) => {
    refuseOverlap(db, fields);
    const memory: Memory = { id: randomUUID(), ...fields, occasionIds: [], media: [] };
    db.memories.push(memory);
    return memory;
  });
}

/** The Memory with this id, if there is one. */
export async function getMemory(storage: Storage, id: string): Promise<Memory | undefined> {
  const db = await storage.read();
  return db.memories.find((memory) => memory.id === id);
}

/**
 * Replaces the title, note, Cities and Date range of a Memory. A title or note
 * left out (or blank) is removed. Its Media and Occasions are kept.
 */
export async function updateMemory(
  storage: Storage,
  id: string,
  input: MemoryInput,
): Promise<Memory> {
  const fields = cleanInput(input);
  return storage.update((db) => {
    const current = findMemory(db, id);
    refuseOverlap(db, fields, id);
    const { title: _title, note: _note, ...kept } = current;
    const memory: Memory = { ...kept, ...fields };
    db.memories[db.memories.indexOf(current)] = memory;
    return memory;
  });
}

/** The folder inside `media/` that holds a Memory's processed files. */
export function memoryMediaDir(storage: Storage, id: string): string {
  return path.join(storage.mediaDir, id);
}

/** Deletes a Memory and its folder in `media/`. There is no undo. */
export async function deleteMemory(storage: Storage, id: string): Promise<void> {
  await storage.update(async (db) => {
    db.memories.splice(db.memories.indexOf(findMemory(db, id)), 1);
    // Inside the write lock, so nothing can add Media to it meanwhile. If the
    // folder can't be removed, the Memory is kept and the Curator can retry.
    await rm(memoryMediaDir(storage, id), { recursive: true, force: true });
  });
}

/** Every City used by some Memory, once each, in Italian alphabetical order. */
export async function suggestCities(storage: Storage): Promise<string[]> {
  const db = await storage.read();
  const cities = new Set(db.memories.flatMap((memory) => memory.cities));
  return [...cities].sort(new Intl.Collator(LOCALE).compare);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How many days the couple spent apart between two Memories next to each
 * other on the Timeline: the next start day minus the previous end day,
 * minus 1. Back-to-back Memories are 0 days apart.
 */
export function daysApart(previous: Pick<Memory, "endDay">, next: Pick<Memory, "startDay">): number {
  return (dayNumber(next.startDay) - dayNumber(previous.endDay)) / DAY_MS - 1;
}

/** A Day as UTC milliseconds, so time zones and daylight saving never matter. */
function dayNumber(day: Day): number {
  return Date.parse(`${day}T00:00:00Z`);
}

/** Trims every field, drops blank ones, and checks the Cities and the Date range. */
function cleanInput(input: MemoryInput): MemoryFields {
  const title = input.title?.trim();
  const note = input.note?.trim();
  const cities = input.cities.map((city) => city.trim()).filter(Boolean);
  if (!cities.length) throw new GalleryError(t.memories.noCity);
  const startDay = parseDay(input.startDay);
  const endDay = parseDay(input.endDay);
  if (endDay < startDay) throw new GalleryError(t.memories.endBeforeStart);

  return { ...(title && { title }), ...(note && { note }), cities, startDay, endDay };
}

function compareDays(a: Day, b: Day): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Two Date ranges overlap when they share at least one day. */
function refuseOverlap(db: Database, range: { startDay: Day; endDay: Day }, ignoreId?: string) {
  const other = db.memories.find(
    (memory) =>
      memory.id !== ignoreId && memory.startDay <= range.endDay && range.startDay <= memory.endDay,
  );
  if (other) throw new GalleryError(t.memories.overlaps(memoryName(other)));
}

/** How a Memory is named in messages: its title, or else its Cities. */
function memoryName(memory: Memory): string {
  return memory.title ?? memory.cities.join(", ");
}
