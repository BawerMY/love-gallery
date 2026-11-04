import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { openStorage } from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

describe("storage", () => {
  it("creates database.json with no Memories and no Yearly occasions when it is missing", async () => {
    const dataDir = await makeDataDir();

    const storage = openStorage(dataDir);
    const db = await storage.read();

    const expected = { version: 1, memories: [], yearlyOccasions: [] };
    expect(db).toEqual(expected);
    expect(await readDatabaseFile(dataDir)).toEqual(expected);
  });

  it("keeps an existing database.json as it is", async () => {
    const dataDir = await makeDataDir();
    const existing = {
      version: 1,
      memories: [],
      yearlyOccasions: [{ id: "y1", name: "San Valentino", month: 2, day: 14 }],
    };
    await writeFile(path.join(dataDir, "database.json"), JSON.stringify(existing));

    await openStorage(dataDir).ensure();

    expect(await openStorage(dataDir).read()).toEqual(existing);
  });

  it("applies concurrent writes one at a time without losing any", async () => {
    const dataDir = await makeDataDir();
    const first = openStorage(dataDir);
    const second = openStorage(dataDir);

    await Promise.all(
      Array.from({ length: 40 }, (_, i) =>
        (i % 2 ? first : second).update(async (db) => {
          const count = db.yearlyOccasions.length;
          await new Promise((resolve) => setTimeout(resolve, 1));
          db.yearlyOccasions.push({ id: `y${count}`, name: `Occasione ${i}`, month: 1, day: 1 });
        }),
      ),
    );

    const db = (await readDatabaseFile(dataDir)) as { yearlyOccasions: { id: string }[] };
    expect(db.yearlyOccasions.map((o) => o.id)).toEqual(
      Array.from({ length: 40 }, (_, i) => `y${i}`),
    );
  });

  it("saves nothing when a change fails, and leaves no temporary files", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    await storage.update((db) => {
      db.yearlyOccasions.push({ id: "kept", name: "Anniversario", month: 6, day: 1 });
    });

    await expect(
      storage.update((db) => {
        db.yearlyOccasions.push({ id: "lost", name: "Compleanno", month: 3, day: 9 });
        throw new Error("rifiutato");
      }),
    ).rejects.toThrow("rifiutato");

    const db = (await readDatabaseFile(dataDir)) as { yearlyOccasions: { id: string }[] };
    expect(db.yearlyOccasions.map((o) => o.id)).toEqual(["kept"]);
    expect((await readdir(dataDir)).sort()).toEqual(["database.json", "media"]);
  });
});
