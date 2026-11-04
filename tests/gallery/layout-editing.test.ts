import { describe, expect, it } from "vitest";
import {
  chooseCover,
  coverOf,
  createMemory,
  deleteMedia,
  GalleryError,
  getMemory,
  openStorage,
  saveLayout,
  type MediaItem,
  type Storage,
} from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

function photo(id: string, column: number, row: number, extra: Partial<MediaItem> = {}): MediaItem {
  return {
    id,
    kind: "photo",
    status: "ready",
    width: 800,
    height: 600,
    cell: { column, row, width: 1, height: 1 },
    files: { display: `${id}.webp`, thumbnail: `${id}-thumb.webp` },
    ...extra,
  };
}

/** A Memory whose Media is already processed: a, b, c across the first row, d below a. */
async function memoryWithMedia(extra: MediaItem[] = []) {
  const dataDir = await makeDataDir();
  const storage = openStorage(dataDir);
  const memory = await createMemory(storage, { cities: ["Roma"], startDay: "2025-03-14", endDay: "2025-03-16" });
  const media = [photo("a", 0, 0), photo("b", 1, 0), photo("c", 2, 0), photo("d", 0, 1), ...extra];
  await storage.update((db) => {
    db.memories[0].media = media;
  });
  return { dataDir, storage, memoryId: memory.id };
}

async function cellsOf(storage: Storage, memoryId: string) {
  const memory = await getMemory(storage, memoryId);
  return Object.fromEntries(memory!.media.map((item) => [item.id, item.cell]));
}

describe("changing the Layout", () => {
  it("moves and resizes items, leaving empty cells, and saves the result", async () => {
    const { dataDir, storage, memoryId } = await memoryWithMedia();

    await saveLayout(storage, memoryId, {
      a: { column: 0, row: 0, width: 2, height: 2 },
      b: { column: 2, row: 0, width: 1, height: 3 },
      c: { column: 0, row: 4, width: 1, height: 1 },
      d: { column: 1, row: 5, width: 2, height: 1 },
    });

    const expected = {
      a: { column: 0, row: 0, width: 2, height: 2 },
      b: { column: 2, row: 0, width: 1, height: 3 },
      c: { column: 0, row: 4, width: 1, height: 1 },
      d: { column: 1, row: 5, width: 2, height: 1 },
    };
    expect(await cellsOf(storage, memoryId)).toEqual(expected);
    const db = (await readDatabaseFile(dataDir)) as { memories: { media: MediaItem[] }[] };
    expect(db.memories[0].media.map((item) => item.cell)).toEqual(Object.values(expected));
  });

  it("checks a partial change against the items it leaves where they are", async () => {
    const { storage, memoryId } = await memoryWithMedia();

    // d grows into the empty cells beside and below it.
    await saveLayout(storage, memoryId, { d: { column: 0, row: 1, width: 3, height: 2 } });
    expect((await cellsOf(storage, memoryId)).d).toEqual({ column: 0, row: 1, width: 3, height: 2 });

    // a growing down would now cover d.
    await expect(saveLayout(storage, memoryId, { a: { column: 0, row: 0, width: 1, height: 2 } })).rejects.toThrow(
      GalleryError,
    );
  });

  it.each([
    ["wider than the grid", { column: 2, row: 0, width: 2, height: 1 }],
    ["left of the grid", { column: -1, row: 2, width: 1, height: 1 }],
    ["wider than 3 columns", { column: 0, row: 2, width: 4, height: 1 }],
    ["zero wide", { column: 0, row: 2, width: 0, height: 1 }],
    ["zero tall", { column: 0, row: 2, width: 1, height: 0 }],
    ["above the grid", { column: 1, row: -1, width: 1, height: 1 }],
    ["not on whole cells", { column: 1, row: 2.5, width: 1, height: 1 }],
  ])("rejects an item %s, saving nothing", async (_case, cell) => {
    const { dataDir, storage, memoryId } = await memoryWithMedia();
    const before = await readDatabaseFile(dataDir);

    await expect(
      saveLayout(storage, memoryId, { a: { column: 1, row: 3, width: 1, height: 1 }, c: cell }),
    ).rejects.toThrow(GalleryError);

    expect(await readDatabaseFile(dataDir)).toEqual(before);
  });

  it("rejects the whole change when two items would overlap", async () => {
    const { dataDir, storage, memoryId } = await memoryWithMedia();
    const before = await readDatabaseFile(dataDir);

    await expect(
      saveLayout(storage, memoryId, {
        a: { column: 0, row: 3, width: 1, height: 1 }, // fine on its own
        b: { column: 0, row: 1, width: 2, height: 1 }, // covers d
      }),
    ).rejects.toThrow(GalleryError);

    expect(await readDatabaseFile(dataDir)).toEqual(before);
  });

  it("counts items that are still processing when looking for overlaps", async () => {
    const { storage, memoryId } = await memoryWithMedia([photo("p", 1, 1, { status: "processing" })]);

    await expect(saveLayout(storage, memoryId, { d: { column: 0, row: 1, width: 2, height: 1 } })).rejects.toThrow(
      GalleryError,
    );
  });

  it("rejects a change naming Media the Memory doesn't have", async () => {
    const { storage, memoryId } = await memoryWithMedia();

    await expect(saveLayout(storage, memoryId, { gone: { column: 0, row: 3, width: 1, height: 1 } })).rejects.toThrow(
      GalleryError,
    );
  });
});

describe("choosing the cover", () => {
  it("makes the chosen item the cover of the Timeline card", async () => {
    const { dataDir, storage, memoryId } = await memoryWithMedia();

    await chooseCover(storage, memoryId, "c");

    expect(coverOf((await getMemory(storage, memoryId))!)?.id).toBe("c");
    const db = (await readDatabaseFile(dataDir)) as { memories: { coverMediaId?: string }[] };
    expect(db.memories[0].coverMediaId).toBe("c");
  });

  it("falls back to the first item in the Layout once the chosen cover is deleted", async () => {
    const { storage, memoryId } = await memoryWithMedia();
    await chooseCover(storage, memoryId, "c");

    await deleteMedia(storage, memoryId, "c");

    expect(coverOf((await getMemory(storage, memoryId))!)?.id).toBe("a");
  });

  it("goes back to the default cover when the choice is cleared", async () => {
    const { storage, memoryId } = await memoryWithMedia();
    await chooseCover(storage, memoryId, "c");

    await chooseCover(storage, memoryId, undefined);

    expect(coverOf((await getMemory(storage, memoryId))!)?.id).toBe("a");
  });

  it("only accepts a ready item of the Memory", async () => {
    const { storage, memoryId } = await memoryWithMedia([photo("p", 1, 1, { status: "processing" })]);

    await expect(chooseCover(storage, memoryId, "p")).rejects.toThrow(GalleryError);
    await expect(chooseCover(storage, memoryId, "gone")).rejects.toThrow(GalleryError);
    expect((await getMemory(storage, memoryId))!.coverMediaId).toBeUndefined();
  });
});
