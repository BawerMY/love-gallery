import { randomUUID } from "node:crypto";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { t } from "../strings";
import { GalleryError } from "./errors";
import { cellsBelowLayout } from "./layout";
import { memoryMediaDir } from "./memories";
import { photoHandler } from "./photos";
import type { Storage } from "./storage";
import type { MediaItem, Memory } from "./types";

/** A file the Curator uploaded, fully received on disk and not yet processed. */
export type Upload = {
  /** Where the received file is. It is always deleted once processed. */
  path: string;
  /** The name the file had on the Curator's device. */
  fileName: string;
};

/** What a handler produces for one upload: everything a Media item needs but its id and cell. */
export type ProcessedMedia = Pick<MediaItem, "status" | "width" | "height" | "capturedAt" | "files">;

/**
 * Turns one kind of upload into processed files. The upload pipeline picks
 * the first handler that accepts a file; each kind of Media (photos now,
 * videos next) is one handler in `MEDIA_HANDLERS`.
 */
export type MediaHandler = {
  kind: MediaItem["kind"];
  accepts(upload: Upload): boolean;
  /**
   * Writes the processed files into `output.dir`, named after `output.id`.
   * Must not delete the upload: the pipeline does that.
   */
  process(upload: Upload, output: { dir: string; id: string }): Promise<ProcessedMedia>;
};

const MEDIA_HANDLERS: readonly MediaHandler[] = [photoHandler];

/**
 * Processes uploads into Media items of a Memory and deletes the originals
 * (ADR-0001). The new items go below the bottom of the Layout as 1×1 tiles,
 * left to right in capture-time order.
 *
 * All or nothing: if any upload can't be read, nothing is added, every
 * original is deleted, and a GalleryError names the file.
 */
export async function addMedia(storage: Storage, memoryId: string, uploads: Upload[]): Promise<MediaItem[]> {
  const dir = memoryMediaDir(storage, memoryId);
  const created: string[] = [];
  try {
    if (!(await storage.read()).memories.some((memory) => memory.id === memoryId)) {
      throw new GalleryError(t.memories.notFound);
    }
    const jobs = uploads.map((upload) => {
      const handler = MEDIA_HANDLERS.find((candidate) => candidate.accepts(upload));
      if (!handler) throw new GalleryError(t.media.unsupported(upload.fileName));
      return { upload, handler };
    });

    await mkdir(dir, { recursive: true });
    const processed: Omit<MediaItem, "cell">[] = [];
    for (const { upload, handler } of jobs) {
      const id = randomUUID();
      let result: ProcessedMedia;
      try {
        result = await handler.process(upload, { dir, id });
      } catch (error) {
        console.error(error);
        await removeFilesNamedAfter(id, dir);
        throw new GalleryError(t.media.conversionFailed(upload.fileName));
      }
      processed.push({ id, kind: handler.kind, ...result });
      created.push(...Object.values(result.files).map((file) => path.join(dir, file)));
    }

    const ordered = byCaptureTime(processed);
    const added = await storage.update((db) => {
      const memory = findMemory(db.memories, memoryId);
      const cells = cellsBelowLayout(memory.media.map((item) => item.cell), ordered.length);
      const items = ordered.map((item, i) => ({ ...item, cell: cells[i] }));
      memory.media.push(...items);
      return items;
    });
    created.length = 0;
    return added;
  } finally {
    await Promise.all([
      ...uploads.map((upload) => rm(upload.path, { force: true })),
      ...created.map((file) => rm(file, { force: true })),
    ]);
  }
}

/** Deletes one Media item and its files. There is no undo. */
export async function deleteMedia(storage: Storage, memoryId: string, mediaId: string): Promise<void> {
  await storage.update(async (db) => {
    const memory = findMemory(db.memories, memoryId);
    const index = memory.media.findIndex((item) => item.id === mediaId);
    if (index < 0) throw new GalleryError(t.media.notFound);
    const [item] = memory.media.splice(index, 1);
    if (memory.coverMediaId === mediaId) delete memory.coverMediaId;
    const dir = memoryMediaDir(storage, memoryId);
    await Promise.all(Object.values(item.files).map((file) => rm(path.join(dir, file), { force: true })));
  });
}

function findMemory(memories: Memory[], id: string): Memory {
  const memory = memories.find((candidate) => candidate.id === id);
  if (!memory) throw new GalleryError(t.memories.notFound);
  return memory;
}

/** Removes what a failed handler left behind: handlers name every file after the item id. */
async function removeFilesNamedAfter(id: string, dir: string): Promise<void> {
  const leftovers = (await readdir(dir)).filter((file) => file.startsWith(id));
  await Promise.all(leftovers.map((file) => rm(path.join(dir, file), { force: true })));
}

/** Oldest capture first; items with no capture time keep their order at the end. */
function byCaptureTime<T extends Pick<MediaItem, "capturedAt">>(items: T[]): T[] {
  const time = (item: T) => (item.capturedAt ? Date.parse(item.capturedAt) : Number.MAX_SAFE_INTEGER);
  return [...items].sort((a, b) => time(a) - time(b));
}
