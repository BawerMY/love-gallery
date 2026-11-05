import { randomUUID } from "node:crypto";
import { mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { t } from "../strings";
import { byCaptureTime } from "./capture-days";
import { GalleryError } from "./errors";
import { findMemory } from "./find-memory";
import { cellsBelowLayout, cellsFrom } from "./layout";
import { memoryMediaDir } from "./memories";
import { photoHandler } from "./photos";
import {
  enqueueProcessing,
  pendingOriginalsDir,
  removeFilesNamedAfter,
  removeFolderOfDeletedMemory,
  type BackgroundJob,
} from "./processing";
import { videoHandler } from "./videos";
import type { Storage } from "./storage";
import type { MediaCell, MediaItem } from "./types";

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
  /**
   * Set for kinds that are slow to process (videos). The upload request then
   * only calls `prepare`, which must be quick and never throw, and saves the
   * item as `processing`; `process` runs later in the background queue
   * (see `processing.ts`).
   */
  prepare?(upload: Upload, output: { id: string }): Promise<Pick<MediaItem, "capturedAt" | "files">>;
};

const MEDIA_HANDLERS: readonly MediaHandler[] = [photoHandler, videoHandler];

/**
 * Where the Curator asked new Media to go: the cell she tapped, and the cells
 * her unsaved Layout already holds, which are skipped as well as the saved
 * ones (see `cellsFrom`).
 */
export type MediaPlacement = { column: number; row: number; taken?: MediaCell[] };

/**
 * Processes uploads into Media items of a Memory and deletes the originals
 * (ADR-0001). The new items are 1×1 tiles in capture-time order: from the
 * tapped cell on with a `placement`, otherwise below the bottom of the
 * Layout, left to right.
 *
 * All or nothing: if any upload can't be read, nothing is added, every
 * original is deleted, and a GalleryError names the file.
 */
export async function addMedia(
  storage: Storage,
  memoryId: string,
  uploads: Upload[],
  placement?: MediaPlacement,
): Promise<MediaItem[]> {
  const dir = memoryMediaDir(storage, memoryId);
  const created: string[] = [];
  const background: BackgroundJob[] = [];
  try {
    const jobs = uploads.map((upload) => {
      const handler = MEDIA_HANDLERS.find((candidate) => candidate.accepts(upload));
      if (!handler) throw new GalleryError(t.media.unsupported(upload.fileName));
      return { upload, handler };
    });

    // Checked and created inside the write lock, so the folder of a Memory
    // being deleted at the same time is never created again.
    await storage.update(async (db) => {
      findMemory(db, memoryId);
      await mkdir(dir, { recursive: true });
    });
    const processed: Omit<MediaItem, "cell">[] = [];
    for (const { upload, handler } of jobs) {
      const id = randomUUID();
      if (handler.prepare) {
        const prepared = await handler.prepare(upload, { id });
        const original = path.join(pendingOriginalsDir(storage), `${id}${path.extname(upload.path)}`);
        await mkdir(path.dirname(original), { recursive: true });
        await rename(upload.path, original);
        created.push(original);
        background.push({ memoryId, mediaId: id, original, handler });
        processed.push({ id, kind: handler.kind, status: "processing", width: 0, height: 0, ...prepared });
        continue;
      }
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
      const memory = findMemory(db, memoryId);
      const saved = memory.media.map((item) => item.cell);
      const cells = placement
        ? cellsFrom([...saved, ...(placement.taken ?? [])], ordered.length, placement)
        : cellsBelowLayout(saved, ordered.length);
      const items = ordered.map((item, i) => ({ ...item, cell: cells[i] }));
      memory.media.push(...items);
      return items;
    });
    created.length = 0;
    for (const job of background) enqueueProcessing(storage, job);
    return added;
  } catch (error) {
    // The Memory may have been deleted while the uploads were processed.
    await storage.update((db) => removeFolderOfDeletedMemory(db, storage, memoryId));
    throw error;
  } finally {
    await Promise.all([
      ...uploads.map((upload) => rm(upload.path, { force: true })),
      ...created.map((file) => rm(file, { force: true })),
    ]);
  }
}

/**
 * Picks up background processing after the app restarts: items still
 * processing are queued again when their original is still waiting, and
 * marked failed when it isn't. Originals no item waits for are deleted.
 * Resolves once that is decided, not when processing is done.
 */
export async function resumeMediaProcessing(storage: Storage): Promise<void> {
  const pendingDir = pendingOriginalsDir(storage);
  const originals = new Map(
    (await readdir(pendingDir).catch(() => [] as string[])).map((file) => [path.parse(file).name, file]),
  );
  const failed: { memoryId: string; mediaId: string }[] = [];
  const jobs = await storage.update((db) => {
    const found: BackgroundJob[] = [];
    for (const memory of db.memories) {
      for (const item of memory.media) {
        if (item.status !== "processing") continue;
        const original = originals.get(item.id);
        const handler = MEDIA_HANDLERS.find((candidate) => candidate.kind === item.kind && candidate.prepare);
        if (original && handler) {
          found.push({ memoryId: memory.id, mediaId: item.id, original: path.join(pendingDir, original), handler });
          originals.delete(item.id);
        } else {
          item.status = "failed";
          failed.push({ memoryId: memory.id, mediaId: item.id });
        }
      }
    }
    return found;
  });
  await Promise.all([
    ...[...originals.values()].map((file) => rm(path.join(pendingDir, file), { force: true })),
    // Whatever a failed item's processing had half written when the app stopped.
    ...failed.map(({ memoryId, mediaId }) => removeFilesNamedAfter(mediaId, memoryMediaDir(storage, memoryId))),
  ]);
  for (const job of jobs) enqueueProcessing(storage, job);
}

/** Deletes one Media item and its files. There is no undo. */
export async function deleteMedia(storage: Storage, memoryId: string, mediaId: string): Promise<void> {
  await storage.update(async (db) => {
    const memory = findMemory(db, memoryId);
    const index = memory.media.findIndex((item) => item.id === mediaId);
    if (index < 0) throw new GalleryError(t.media.notFound);
    const [item] = memory.media.splice(index, 1);
    if (memory.coverMediaId === mediaId) delete memory.coverMediaId;
    const dir = memoryMediaDir(storage, memoryId);
    await Promise.all(Object.values(item.files).map((file) => rm(path.join(dir, file), { force: true })));
  });
}
