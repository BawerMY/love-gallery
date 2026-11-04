import { execFile } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  addMedia,
  createMemory,
  deleteMedia,
  deleteMemory,
  getMemory,
  memoryMediaDir,
  openStorage,
  pendingOriginalsDir,
  resumeMediaProcessing,
  whenMediaProcessed,
  type Storage,
} from "@/gallery";
import { FIXTURES, makeDataDir, upload } from "./helpers";

const run = promisify(execFile);

async function memoryIn(storage: Storage) {
  return createMemory(storage, { cities: ["Milano"], startDay: "2025-03-14", endDay: "2025-03-16" });
}

/** Every file left in the data folder, as paths relative to it. */
async function filesIn(dataDir: string): Promise<string[]> {
  const entries = await readdir(dataDir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dataDir, path.join(entry.parentPath, entry.name)))
    .sort();
}

async function probe(file: string) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]);
  return JSON.parse(stdout) as {
    streams: { codec_type: string; codec_name: string; width?: number; height?: number }[];
    format: { duration: string; tags?: Record<string, string> };
  };
}

describe("adding a video", () => {
  it("shows it as processing, then as a ready H.264 + AAC MP4 with fast start, a WebP poster and its capture time, with the original gone", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await memoryIn(storage);

    const [added] = await addMedia(storage, memory.id, [await upload(storage, "sample.mov", "IMG_0003.MOV")]);

    expect(added).toMatchObject({
      kind: "video",
      status: "processing",
      capturedAt: "2025-03-14T18:30:05+01:00",
      cell: { column: 0, row: 0, width: 1, height: 1 },
    });

    await whenMediaProcessed(storage);

    const [item] = (await getMemory(storage, memory.id))!.media;
    expect(item).toMatchObject({
      id: added.id,
      kind: "video",
      status: "ready",
      capturedAt: "2025-03-14T18:30:05+01:00",
      width: 96,
      height: 64,
      cell: added.cell,
    });

    const dir = memoryMediaDir(storage, memory.id);
    const video = await probe(path.join(dir, item.files.display));
    expect(video.streams.map((stream) => [stream.codec_type, stream.codec_name])).toEqual([
      ["video", "h264"],
      ["audio", "aac"],
    ]);
    expect(video.streams[0]).toMatchObject({ width: 96, height: 64 });
    expect(Number(video.format.duration)).toBeCloseTo(1, 0);
    // Fast start: the index (moov) comes before the media data (mdat), so playback starts at once.
    const bytes = await readFile(path.join(dir, item.files.display));
    expect(bytes.indexOf("moov")).toBeLessThan(bytes.indexOf("mdat"));
    // No location or other camera metadata is carried over.
    expect(video.format.tags?.location).toBeUndefined();
    expect(bytes.includes("+45.4642")).toBe(false);

    const poster = await sharp(path.join(dir, item.files.thumbnail)).metadata();
    expect(poster).toMatchObject({ format: "webp", width: 96, height: 64 });

    // Only the database and the two processed files remain: the original is gone.
    expect(await filesIn(dataDir)).toEqual(
      ["database.json", path.join("media", memory.id, item.files.display), path.join("media", memory.id, item.files.thumbnail)].sort(),
    );
  });

  it("marks a corrupt video as failed, removing the original and every temporary file, without holding up the rest", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await memoryIn(storage);

    // Returned in capture-time order: the sample is dated, the corrupt file can't say.
    const [fine, broken] = await addMedia(storage, memory.id, [
      await upload(storage, "corrupt.mov", "IMG_0004.MOV"),
      await upload(storage, "sample.mov", "IMG_0005.MOV"),
    ]);
    expect(broken.capturedAt).toBeUndefined();
    await whenMediaProcessed(storage);

    const media = (await getMemory(storage, memory.id))!.media;
    expect(media.find((item) => item.id === broken.id)).toMatchObject({ kind: "video", status: "failed" });
    expect(media.find((item) => item.id === fine.id)).toMatchObject({ kind: "video", status: "ready" });
    const ready = media.find((item) => item.id === fine.id)!;
    expect(await filesIn(dataDir)).toEqual(
      ["database.json", path.join("media", memory.id, ready.files.display), path.join("media", memory.id, ready.files.thumbnail)].sort(),
    );
  });

  it("only reads the uploaded file itself: a playlist pointing at other files is a failed video", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await memoryIn(storage);
    // A file the playlist would pull in, next to where the upload waits.
    await mkdir(pendingOriginalsDir(storage), { recursive: true });
    await copyFile(path.join(FIXTURES, "sample.mov"), path.join(pendingOriginalsDir(storage), "secret.mov"));
    const playlist = path.join(storage.dataDir, "playlist.mov");
    await writeFile(playlist, "ffconcat version 1.0\nfile secret.mov\n");

    const [item] = await addMedia(storage, memory.id, [{ path: playlist, fileName: "IMG_0006.MOV" }]);
    await whenMediaProcessed(storage);

    expect(item.capturedAt).toBeUndefined();
    expect((await getMemory(storage, memory.id))!.media[0]).toMatchObject({ status: "failed" });
  });

  it("can delete a failed video", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await memoryIn(storage);
    const [broken] = await addMedia(storage, memory.id, [await upload(storage, "corrupt.mov")]);
    await whenMediaProcessed(storage);

    await deleteMedia(storage, memory.id, broken.id);

    expect((await getMemory(storage, memory.id))!.media).toEqual([]);
  });

  it("drops a video deleted while it was still processing, leaving no files behind", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await memoryIn(storage);
    const [item] = await addMedia(storage, memory.id, [await upload(storage, "sample.mov")]);

    await deleteMedia(storage, memory.id, item.id);
    await whenMediaProcessed(storage);

    expect((await getMemory(storage, memory.id))!.media).toEqual([]);
    expect(await filesIn(dataDir)).toEqual(["database.json"]);
  });

  it("leaves no folder behind when its Memory is deleted while videos are still processing", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await memoryIn(storage);
    await addMedia(storage, memory.id, [await upload(storage, "sample.mov"), await upload(storage, "sample.mov")]);

    await deleteMemory(storage, memory.id);
    await whenMediaProcessed(storage);

    expect(await readdir(storage.mediaDir)).toEqual([]);
    expect(await filesIn(dataDir)).toEqual(["database.json"]);
  });
});

describe("when the app starts again", () => {
  /**
   * The state the app leaves behind if it stops while videos are processing:
   * the items saved as processing, the originals still waiting.
   */
  async function stoppedWhileProcessing(storage: Storage, originals: Record<string, string | undefined>) {
    const memory = await memoryIn(storage);
    await mkdir(pendingOriginalsDir(storage), { recursive: true });
    await storage.update((db) => {
      db.memories[0].media = Object.keys(originals).map((id, row) => ({
        id,
        kind: "video",
        status: "processing",
        width: 0,
        height: 0,
        cell: { column: 0, row, width: 1, height: 1 },
        files: { display: `${id}.mp4`, thumbnail: `${id}-poster.webp` },
      }));
    });
    for (const [id, fixture] of Object.entries(originals)) {
      if (fixture) await copyFile(path.join(FIXTURES, fixture), path.join(pendingOriginalsDir(storage), `${id}.mov`));
    }
    // An original whose item is gone, e.g. deleted just before the app stopped.
    await writeFile(path.join(pendingOriginalsDir(storage), "orphan.mov"), "x");
    return memory;
  }

  it("processes again the videos that were still processing, and marks failed those whose original is lost", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await stoppedWhileProcessing(storage, { waiting: "sample.mov", lost: undefined });

    await resumeMediaProcessing(storage);
    await whenMediaProcessed(storage);

    const media = (await getMemory(storage, memory.id))!.media;
    expect(media.map((item) => [item.id, item.status])).toEqual([
      ["waiting", "ready"],
      ["lost", "failed"],
    ]);
    expect(await filesIn(dataDir)).toEqual(
      ["database.json", path.join("media", memory.id, "waiting.mp4"), path.join("media", memory.id, "waiting-poster.webp")].sort(),
    );
  });
});
