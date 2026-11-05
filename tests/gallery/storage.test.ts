import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { openStorage } from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

describe("storage", () => {
  it("creates database.json with no Memories and no Occasions when it is missing", async () => {
    const dataDir = await makeDataDir();

    const storage = openStorage(dataDir);
    const db = await storage.read();

    const expected = { version: 2, memories: [], occasions: [] };
    expect(db).toEqual(expected);
    expect(await readDatabaseFile(dataDir)).toEqual(expected);
  });

  it("keeps an existing database.json as it is", async () => {
    const dataDir = await makeDataDir();
    const existing = {
      version: 2,
      memories: [],
      occasions: [{ id: "y1", name: "San Valentino", theme: "san-valentino" }],
    };
    await writeFile(path.join(dataDir, "database.json"), JSON.stringify(existing));

    await openStorage(dataDir).ensure();

    expect(await openStorage(dataDir).read()).toEqual(existing);
  });

  it.each([
    ["a newer version", { version: 3, memories: [], occasions: [] }, "version 3"],
    ["no version", { memories: [], occasions: [] }, "no version"],
  ])("refuses a database.json with %s, leaving it untouched", async (_, content, named) => {
    const dataDir = await makeDataDir();
    await writeFile(path.join(dataDir, "database.json"), JSON.stringify(content));
    const storage = openStorage(dataDir);

    await expect(storage.read()).rejects.toThrow(named);
    await expect(storage.update(() => undefined)).rejects.toThrow(named);
    expect(await readDatabaseFile(dataDir)).toEqual(content);
  });

  it("applies concurrent writes one at a time without losing any", async () => {
    const dataDir = await makeDataDir();
    const first = openStorage(dataDir);
    const second = openStorage(dataDir);

    await Promise.all(
      Array.from({ length: 40 }, (_, i) =>
        (i % 2 ? first : second).update(async (db) => {
          const count = db.occasions.length;
          await new Promise((resolve) => setTimeout(resolve, 1));
          db.occasions.push({ id: `y${count}`, name: `Occasione ${i}`, theme: "neutro" });
        }),
      ),
    );

    const db = (await readDatabaseFile(dataDir)) as { occasions: { id: string }[] };
    expect(db.occasions.map((o) => o.id)).toEqual(
      Array.from({ length: 40 }, (_, i) => `y${i}`),
    );
  });

  it("saves nothing when a change fails, and leaves no temporary files", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    await storage.update((db) => {
      db.occasions.push({ id: "kept", name: "Anniversario", theme: "neutro" });
    });

    await expect(
      storage.update((db) => {
        db.occasions.push({ id: "lost", name: "Compleanno", theme: "neutro" });
        throw new Error("rifiutato");
      }),
    ).rejects.toThrow("rifiutato");

    const db = (await readDatabaseFile(dataDir)) as { occasions: { id: string }[] };
    expect(db.occasions.map((o) => o.id)).toEqual(["kept"]);
    expect((await readdir(dataDir)).sort()).toEqual(["database.json", "media"]);
  });

  it("saves the database the change was given, and hands back what the change returns", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);

    const returned = await storage.update((db) => {
      db.occasions.push({ id: "y1", name: "Anniversario", theme: "neutro" });
      return db.occasions.length;
    });

    expect(returned).toBe(1);
    expect(((await readDatabaseFile(dataDir)) as { occasions: unknown[] }).occasions).toHaveLength(1);
    // A change can't hand back a new database instead of changing the one it was given.
    // @ts-expect-error a returned database would not be saved
    await storage.update((db) => ({ ...db, memories: [] }));
    // @ts-expect-error a returned database would not be saved
    await storage.update(async (db) => db);
  });
});
