import { describe, expect, it } from "vitest";
import {
  coverOf,
  createMemory,
  createOccasion,
  getMemory,
  listOccasions,
  occasionsOfMemory,
  openStorage,
  saveMemoryEdits,
  themeOfMemory,
  type MediaItem,
  type MemoryEdits,
  type Storage,
} from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

function photo(id: string, column: number, row: number): MediaItem {
  return {
    id,
    kind: "photo",
    status: "ready",
    width: 800,
    height: 600,
    cell: { column, row, width: 1, height: 1 },
    files: { display: `${id}.webp`, thumbnail: `${id}-thumb.webp` },
  };
}

/**
 * A winter Memory in Torino with photos a and b side by side, and the
 * Occasions Pranzo dai nonni (Neutro) and Natale on it; Capodanno is in the
 * list but not on the Memory.
 */
async function inverno() {
  const dataDir = await makeDataDir();
  const storage = openStorage(dataDir);
  const memory = await createMemory(storage, { cities: ["Torino"], startDay: "2025-12-24", endDay: "2025-12-27" });
  const pranzo = await createOccasion(storage, { name: "Pranzo dai nonni" });
  const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
  const capodanno = await createOccasion(storage, { name: "Capodanno", theme: "capodanno" });
  await storage.update((db) => {
    db.memories[0].occasionIds = [pranzo.id, natale.id];
    db.memories[0].media = [photo("a", 0, 0), photo("b", 1, 0)];
  });
  return { dataDir, storage, memoryId: memory.id, pranzo, natale, capodanno };
}

/** The edits that change nothing: the Memory as `inverno` makes it. */
function unchanged(ids: { pranzo: { id: string }; natale: { id: string } }): MemoryEdits {
  return {
    details: { cities: ["Torino"], startDay: "2025-12-24", endDay: "2025-12-27" },
    occasions: [{ id: ids.pranzo.id }, { id: ids.natale.id }],
    mainOccasion: undefined,
    cells: {},
    coverMediaId: undefined,
  };
}

/** A Memory's badges as the gallery pages show them: name and Theme, in badge order. */
async function badges(storage: Storage, memoryId: string) {
  const memory = (await getMemory(storage, memoryId))!;
  return occasionsOfMemory(memory, await listOccasions(storage)).map(({ name, theme }) => [name, theme]);
}

describe("saving a Memory's edits in one go", () => {
  it("applies the details, the Occasions with new ones in their place, the Main occasion, the Layout and the cover together", async () => {
    const { storage, memoryId, natale, capodanno } = await inverno();

    await saveMemoryEdits(storage, memoryId, {
      details: {
        title: " Natale a Torino ",
        note: "Neve!",
        cities: ["Torino", "Asti"],
        startDay: "2025-12-23",
        endDay: "2025-12-28",
      },
      // Pranzo dai nonni is taken off; Capodanno is picked; Tombolata is created in the middle.
      occasions: [{ id: capodanno.id }, { name: "Tombolata", theme: "anniversario" }, { id: natale.id }],
      mainOccasion: 2,
      cells: { a: { column: 0, row: 1, width: 2, height: 2 }, b: { column: 2, row: 0, width: 1, height: 1 } },
      coverMediaId: "b",
    });

    const memory = (await getMemory(storage, memoryId))!;
    expect(memory).toMatchObject({
      title: "Natale a Torino",
      note: "Neve!",
      cities: ["Torino", "Asti"],
      startDay: "2025-12-23",
      endDay: "2025-12-28",
      mainOccasionId: natale.id,
      coverMediaId: "b",
    });
    expect(memory.media.map((item) => item.cell)).toEqual([
      { column: 0, row: 1, width: 2, height: 2 },
      { column: 2, row: 0, width: 1, height: 1 },
    ]);
    expect(coverOf(memory)?.id).toBe("b");
    expect(await badges(storage, memoryId)).toEqual([
      ["Capodanno", "capodanno"],
      ["Tombolata", "anniversario"],
      ["Natale", "natale"],
    ]);
    expect(themeOfMemory(memory, await listOccasions(storage)).theme).toBe("natale");
    // The new Occasion is in the list now, and Pranzo dai nonni is still there.
    expect((await listOccasions(storage)).map((occasion) => occasion.name)).toEqual([
      "Capodanno",
      "Natale",
      "Pranzo dai nonni",
      "Tombolata",
    ]);
  });

  it("saves nothing at all when any part is refused, and says why in Italian", async () => {
    const { dataDir, storage, memoryId, pranzo, natale } = await inverno();
    await createMemory(storage, { cities: ["Roma"], startDay: "2026-01-05", endDay: "2026-01-06" });
    const before = await readDatabaseFile(dataDir);
    const base = unchanged({ pranzo, natale });
    // Every edit here is fine on its own except the one named, so a refusal must undo the rest too.
    const fine: Partial<MemoryEdits> = {
      occasions: [...base.occasions, { name: "Tombolata" }],
      cells: { a: { column: 0, row: 1, width: 1, height: 1 } },
      coverMediaId: "b",
    };
    const refused: [Partial<MemoryEdits>, string][] = [
      [{ occasions: [...base.occasions, { name: " natale " }] }, "C'è già un'occasione chiamata «natale»."],
      [{ occasions: [{ name: "Tombolata" }, { name: "tombolata" }] }, "C'è già un'occasione chiamata «tombolata»."],
      [{ occasions: [...base.occasions, { name: "  " }] }, "Dai un nome all'occasione."],
      [{ occasions: [...base.occasions, { name: "Gita", theme: "gita" }] }, "Scegli uno dei temi della lista."],
      [{ details: { cities: ["Torino"], startDay: "2025-12-27", endDay: "2025-12-24" } }, "L'ultimo giorno non può venire prima del primo."],
      [{ details: { cities: ["Torino"], startDay: "2025-12-24", endDay: "2026-01-05" } }, "Le date si sovrappongono a «Roma»."],
      [{ mainOccasion: 0 }, "Un'occasione con tema Neutro non può dare il tema al ricordo."],
      [{ mainOccasion: 5 }, "Questo ricordo non ha questa occasione."],
      [{ cells: { a: { column: 1, row: 0, width: 1, height: 1 } } }, "Due foto si sovrappongono. Spostane una in celle libere."],
      [{ cells: { b: { column: 2, row: 0, width: 2, height: 1 } } }, "Una foto esce dalla griglia: deve stare nelle 3 colonne."],
    ];
    for (const [wrong, message] of refused) {
      await expect(saveMemoryEdits(storage, memoryId, { ...base, ...fine, ...wrong })).rejects.toThrow(message);
      expect(await readDatabaseFile(dataDir)).toEqual(before);
    }
  });
});
