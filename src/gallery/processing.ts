import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import type { MediaHandler } from "./media";
import { memoryMediaDir } from "./memories";
import type { Storage } from "./storage";
import { GalleryError } from "./errors";
import { findMemory } from "./find-memory";
import type { Database, MediaItem } from "./types";

/**
 * Slow Media (videos) is processed in the background, one item at a time
 * per data folder, so an upload request returns as soon as the files are
 * received and the Admin page can show the items as processing.
 *
 * While an item waits or is being processed its original is kept in
 * `<data>/processing/`, named after the item id, so processing can start
 * over if the app stops half way (see `resumeMediaProcessing`).
 */

/** Where originals wait for background processing: inside the data folder, so on the same volume. */
export function pendingOriginalsDir(storage: Storage): string {
  return path.join(storage.dataDir, "processing");
}

/**
 * The queue lives on `globalThis` because Next.js may load this module more
 * than once (instrumentation, route handlers, server actions), and there
 * must be a single queue per process.
 */
const QUEUES_KEY = Symbol.for("love-gallery.media-processing");
type Queues = Map<string, Promise<void>>;
const queues: Queues = ((globalThis as Record<symbol, unknown>)[QUEUES_KEY] ??= new Map()) as Queues;

export type BackgroundJob = {
  memoryId: string;
  mediaId: string;
  /** The waiting original in `pendingOriginalsDir`. */
  original: string;
  handler: MediaHandler;
};

/** Adds a job to the data folder's queue. It runs after every job queued before it. */
export function enqueueProcessing(storage: Storage, job: BackgroundJob): void {
  const previous = queues.get(storage.dataDir) ?? Promise.resolve();
  const next = previous.then(() => runJob(storage, job));
  queues.set(storage.dataDir, next);
  void next.then(() => {
    if (queues.get(storage.dataDir) === next) queues.delete(storage.dataDir);
  });
}

/** Resolves once nothing is left to process in the background for this data folder. */
export async function whenMediaProcessed(storage: Storage): Promise<void> {
  for (let pending = queues.get(storage.dataDir); pending; pending = queues.get(storage.dataDir)) {
    await pending;
  }
}

/**
 * Processes one item: on success it becomes ready with its files; on
 * failure it is marked failed and whatever was written is removed. Either
 * way the original is deleted (ADR-0001). An item deleted in the meantime is
 * simply dropped, and when its whole Memory was deleted the Memory's folder
 * is never created again. Never rejects, so one bad file can't stop the queue.
 */
async function runJob(storage: Storage, { memoryId, mediaId, original, handler }: BackgroundJob): Promise<void> {
  const dir = memoryMediaDir(storage, memoryId);
  try {
    // Checked and created inside the write lock, so a Memory deleted at the
    // same time can't have its folder created again after it was removed.
    const started = await storage.update(async (db) => {
      if (findItem(db, memoryId, mediaId)?.status !== "processing") return false;
      await mkdir(dir, { recursive: true });
      return true;
    });
    if (!started) return;
    let result: Awaited<ReturnType<MediaHandler["process"]>> | undefined;
    try {
      result = await handler.process({ path: original, fileName: path.basename(original) }, { dir, id: mediaId });
    } catch (error) {
      console.error(error);
      await removeFilesNamedAfter(mediaId, dir);
    }
    await storage.update(async (db) => {
      const item = findItem(db, memoryId, mediaId);
      if (!item) {
        await removeFilesNamedAfter(mediaId, dir);
        await removeFolderOfDeletedMemory(db, storage, memoryId);
        return;
      }
      if (result) Object.assign(item, { ...result, capturedAt: result.capturedAt ?? item.capturedAt });
      else item.status = "failed";
      if (!item.capturedAt) delete item.capturedAt;
    });
  } catch (error) {
    console.error(error);
  } finally {
    await rm(original, { force: true });
  }
}

/** The item, or undefined when it or its whole Memory was deleted in the meantime. */
function findItem(db: Database, memoryId: string, mediaId: string): MediaItem | undefined {
  try {
    return findMemory(db, memoryId).media.find((item) => item.id === mediaId);
  } catch (error) {
    if (error instanceof GalleryError) return undefined;
    throw error;
  }
}

/**
 * Removes the Memory's folder in `media/` when the Memory is no longer in
 * `db`. Called inside `storage.update`, so nothing can add Media to it meanwhile.
 */
export async function removeFolderOfDeletedMemory(db: Database, storage: Storage, memoryId: string): Promise<void> {
  if (db.memories.some((memory) => memory.id === memoryId)) return;
  await rm(memoryMediaDir(storage, memoryId), { recursive: true, force: true });
}

/** Removes the files of an item: handlers name every file they write after the item id. */
export async function removeFilesNamedAfter(id: string, dir: string): Promise<void> {
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return;
  }
  await Promise.all(files.filter((file) => file.startsWith(id)).map((file) => rm(path.join(dir, file), { force: true })));
}
