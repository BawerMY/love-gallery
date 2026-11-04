import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  addMedia,
  coverOf,
  createMemory,
  deleteMedia,
  getMemory,
  isOutsideDateRange,
  suggestDateRange,
  GalleryError,
  memoryMediaDir,
  openStorage,
  type MediaItem,
  type Memory,
  type Storage,
} from "@/gallery";
import { makeDataDir, readDatabaseFile, upload } from "./helpers";

async function memoryIn(storage: Storage) {
  return createMemory(storage, { cities: ["Milano"], startDay: "2025-03-14", endDay: "2025-03-16" });
}

describe("adding photos", () => {
  it("turns a JPEG into a rotated WebP of at most 2560px with a thumbnail, no metadata and its capture time, deleting the original", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await memoryIn(storage);
    const original = await upload(storage, "gps-rotated.jpg", "IMG_0001.JPG");

    const [item] = await addMedia(storage, memory.id, [original]);

    expect(item).toMatchObject({
      kind: "photo",
      status: "ready",
      capturedAt: "2025-03-14T18:30:05+01:00",
      // Stored 3000×1500 with EXIF rotation, so it is portrait once rotated.
      width: 1280,
      height: 2560,
      cell: { column: 0, row: 0, width: 1, height: 1 },
    });

    const dir = memoryMediaDir(storage, memory.id);
    expect((await readdir(dir)).sort()).toEqual(
      [item.files.display, item.files.thumbnail].sort(),
    );
    const display = await sharp(path.join(dir, item.files.display)).metadata();
    expect(display).toMatchObject({ format: "webp", width: 1280, height: 2560 });
    expect(display.exif).toBeUndefined();
    expect(display.orientation).toBeUndefined();
    // A WebP keeps metadata in EXIF and XMP chunks; neither is there.
    const bytes = await readFile(path.join(dir, item.files.display));
    expect(bytes.includes("EXIF")).toBe(false);
    expect(bytes.includes("XMP ")).toBe(false);

    const thumbnail = await sharp(path.join(dir, item.files.thumbnail)).metadata();
    expect(thumbnail.format).toBe("webp");
    expect(Math.max(thumbnail.width!, thumbnail.height!)).toBeLessThanOrEqual(800);
    expect(thumbnail.exif).toBeUndefined();

    expect(await readdir(path.dirname(original.path))).toEqual([]);
    const db = (await readDatabaseFile(dataDir)) as { memories: { media: unknown[] }[] };
    expect(db.memories[0].media).toEqual([item]);
  });

  it("converts an iPhone HEIC photo too", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await memoryIn(storage);
    const original = await upload(storage, "sample.heic", "IMG_0002.HEIC");

    const [item] = await addMedia(storage, memory.id, [original]);

    expect(item).toMatchObject({ kind: "photo", status: "ready", width: 64, height: 48 });
    const display = await sharp(path.join(memoryMediaDir(storage, memory.id), item.files.display)).metadata();
    expect(display).toMatchObject({ format: "webp", width: 64, height: 48 });
    expect(await readdir(path.dirname(original.path))).toEqual([]);
  });

  it("refuses a file that is not a photo, deleting it and saving nothing", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await memoryIn(storage);
    const dir = path.join(storage.dataDir, "incoming");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "note.txt"), "ciao");

    const attempt = addMedia(storage, memory.id, [{ path: path.join(dir, "note.txt"), fileName: "note.txt" }]);

    await expect(attempt).rejects.toThrow(GalleryError);
    await expect(attempt).rejects.toThrow("«note.txt» non è una foto che la galleria sa leggere.");
    expect(await readdir(dir)).toEqual([]);
    expect((await getMemory(storage, memory.id))!.media).toEqual([]);
  });
});

describe("placing new Media in the Layout", () => {
  it("adds each batch in new rows below the bottom, in capture-time order", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await memoryIn(storage);

    // The HEIC has no capture time, so it goes after the dated JPEG.
    const first = await addMedia(storage, memory.id, [
      await upload(storage, "sample.heic"),
      await upload(storage, "gps-rotated.jpg"),
    ]);
    expect(first.map((item) => [item.capturedAt, item.cell])).toEqual([
      ["2025-03-14T18:30:05+01:00", { column: 0, row: 0, width: 1, height: 1 }],
      [undefined, { column: 1, row: 0, width: 1, height: 1 }],
    ]);

    const [second] = await addMedia(storage, memory.id, [await upload(storage, "sample.heic")]);
    expect(second.cell).toEqual({ column: 0, row: 1, width: 1, height: 1 });
    expect((await getMemory(storage, memory.id))!.media.map((item) => item.id)).toEqual([
      ...first.map((item) => item.id),
      second.id,
    ]);
  });
});

describe("deleting a Media item", () => {
  it("removes it and its files, leaving the rest of the Memory alone", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await memoryIn(storage);
    const [gone, kept] = await addMedia(storage, memory.id, [
      await upload(storage, "gps-rotated.jpg"),
      await upload(storage, "sample.heic"),
    ]);

    await deleteMedia(storage, memory.id, gone.id);

    expect((await getMemory(storage, memory.id))!.media).toEqual([kept]);
    expect((await readdir(memoryMediaDir(storage, memory.id))).sort()).toEqual(
      [kept.files.display, kept.files.thumbnail].sort(),
    );
    await expect(deleteMedia(storage, memory.id, gone.id)).rejects.toThrow("Questa foto non esiste più.");
  });
});

/** A ready photo for the pure Memory rules below; only `id`, `cell`, `status` and `capturedAt` matter. */
function photo(id: string, cell: [column: number, row: number], extra: Partial<MediaItem> = {}): MediaItem {
  return {
    id,
    kind: "photo",
    status: "ready",
    width: 10,
    height: 10,
    cell: { column: cell[0], row: cell[1], width: 1, height: 1 },
    files: { display: `${id}.webp`, thumbnail: `${id}-thumb.webp` },
    ...extra,
  };
}

function memoryWith(media: MediaItem[], extra: Partial<Memory> = {}): Memory {
  return { id: "m", cities: ["Roma"], startDay: "2025-03-14", endDay: "2025-03-16", oneOffOccasions: [], media, ...extra };
}

describe("the cover", () => {
  it("is the first ready item in the Layout, reading rows then columns", () => {
    const memory = memoryWith([
      photo("below", [0, 1]),
      photo("processing", [0, 0], { status: "processing" }),
      photo("right", [2, 0]),
      photo("left", [1, 0]),
    ]);
    expect(coverOf(memory)?.id).toBe("left");
  });

  it("is the chosen cover while that item is still there", () => {
    const media = [photo("first", [0, 0]), photo("chosen", [1, 0])];
    expect(coverOf(memoryWith(media, { coverMediaId: "chosen" }))?.id).toBe("chosen");
    expect(coverOf(memoryWith(media, { coverMediaId: "deleted" }))?.id).toBe("first");
  });

  it("is missing when the Memory has no ready Media", () => {
    expect(coverOf(memoryWith([]))).toBeUndefined();
  });
});

describe("the Date range suggestion", () => {
  it("runs from the earliest to the latest capture day, in the time zone the photo was taken", () => {
    const media = [
      photo("a", [0, 0], { capturedAt: "2025-03-16T23:30:00+01:00" }),
      photo("b", [1, 0]),
      photo("c", [2, 0], { capturedAt: "2025-03-13T09:00:00" }),
      photo("d", [0, 1], { capturedAt: "2025-03-14T12:00:00+01:00" }),
    ];
    expect(suggestDateRange(media)).toEqual({ startDay: "2025-03-13", endDay: "2025-03-16" });
  });

  it("is missing when no Media has a capture time", () => {
    expect(suggestDateRange([photo("a", [0, 0])])).toBeUndefined();
  });
});

describe("the out-of-range warning", () => {
  it("flags Media captured on a day outside the Date range, but not undated Media", () => {
    const memory = memoryWith([]);
    const at = (capturedAt?: string) => isOutsideDateRange(memory, photo("x", [0, 0], { capturedAt }));
    expect(at("2025-03-13T23:59:59+01:00")).toBe(true);
    expect(at("2025-03-14T00:00:00+01:00")).toBe(false);
    expect(at("2025-03-16T23:59:59")).toBe(false);
    expect(at("2025-03-17T00:10:00+02:00")).toBe(true);
    expect(at(undefined)).toBe(false);
  });
});
