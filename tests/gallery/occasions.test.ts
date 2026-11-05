import { describe, expect, it } from "vitest";
import {
  addOccasionToMemory,
  createMemory,
  countOccasionUses,
  createOccasion,
  createOccasionOnMemory,
  deleteOccasion,
  GalleryError,
  getMemory,
  listOccasions,
  listTimeline,
  occasionsOfMemory,
  openStorage,
  removeOccasionFromMemory,
  setOccasionOrder,
  updateMemory,
  updateOccasion,
  type Storage,
} from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

/** A Memory's badges as the gallery pages show them: name and Theme, in badge order. */
async function badges(storage: Storage, memoryId: string) {
  const memory = (await getMemory(storage, memoryId))!;
  return occasionsOfMemory(memory, await listOccasions(storage)).map(({ name, theme }) => [name, theme]);
}

describe("the list of Occasions", () => {
  it("holds Occasions with a name and a Theme, defaulting to Neutro, listed alphabetically", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);

    const viaggio = await createOccasion(storage, { name: " Viaggio insieme ", theme: "anniversario" });
    const anniversario = await createOccasion(storage, { name: "anniversario" });
    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });

    expect(viaggio).toEqual({ id: expect.any(String), name: "Viaggio insieme", theme: "anniversario" });
    expect(anniversario.theme).toBe("neutro");
    expect(await listOccasions(storage)).toEqual([anniversario, natale, viaggio]);
    expect(await readDatabaseFile(dataDir)).toEqual({
      version: 2,
      memories: [],
      occasions: [viaggio, anniversario, natale],
    });
  });

  it("refuses, in Italian, a blank name, a name already in the list and an unknown Theme", async () => {
    const storage = openStorage(await makeDataDir());
    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
    const refused = [
      [{ name: "  " }, "Dai un nome all'occasione."],
      [{ name: " natale " }, "C'è già un'occasione chiamata «natale»."],
      [{ name: "NATALE", theme: "capodanno" }, "C'è già un'occasione chiamata «NATALE»."],
      [{ name: "Gita", theme: "gita" }, "Scegli uno dei temi della lista."],
    ] as const;
    for (const [input, message] of refused) {
      await expect(createOccasion(storage, input)).rejects.toThrow(new GalleryError(message));
    }
    expect(await listOccasions(storage)).toEqual([natale]);
  });

  it("renames and re-themes an Occasion, and every Memory that has it shows the change", async () => {
    const storage = openStorage(await makeDataDir());
    const estate = await createMemory(storage, { cities: ["Bari"], startDay: "2025-08-01", endDay: "2025-08-05" });
    const autunno = await createMemory(storage, { cities: ["Asti"], startDay: "2025-10-01", endDay: "2025-10-02" });
    const viaggio = await createOccasion(storage, { name: "Viaggio" });
    for (const memory of [estate, autunno]) await addOccasionToMemory(storage, memory.id, viaggio.id);

    const edited = await updateOccasion(storage, viaggio.id, { name: "Viaggio insieme", theme: "anniversario" });

    expect(edited).toEqual({ id: viaggio.id, name: "Viaggio insieme", theme: "anniversario" });
    for (const memory of [estate, autunno]) {
      expect(await badges(storage, memory.id)).toEqual([["Viaggio insieme", "anniversario"]]);
    }
    // A Theme left out goes back to Neutro; a change of case alone is not a clash with itself.
    await updateOccasion(storage, viaggio.id, { name: "viaggio insieme" });
    expect(await badges(storage, estate.id)).toEqual([["viaggio insieme", "neutro"]]);
  });

  it("refuses, in Italian, an edit to another Occasion's name, an unknown Theme or a missing Occasion", async () => {
    const storage = openStorage(await makeDataDir());
    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
    const capodanno = await createOccasion(storage, { name: "Capodanno", theme: "capodanno" });

    await expect(updateOccasion(storage, capodanno.id, { name: "natale" })).rejects.toThrow(
      new GalleryError("C'è già un'occasione chiamata «natale»."),
    );
    await expect(updateOccasion(storage, capodanno.id, { name: "Capodanno", theme: "Capodanno" })).rejects.toThrow(
      new GalleryError("Scegli uno dei temi della lista."),
    );
    await expect(updateOccasion(storage, "nessuna", { name: "Pasqua" })).rejects.toThrow(
      new GalleryError("Questa occasione non esiste più."),
    );
    expect(await listOccasions(storage)).toEqual([capodanno, natale]);
  });

  it("deletes an Occasion from the list and every Memory, reporting how many Memories used it", async () => {
    const storage = openStorage(await makeDataDir());
    const estate = await createMemory(storage, { cities: ["Bari"], startDay: "2025-08-01", endDay: "2025-08-05" });
    const autunno = await createMemory(storage, { cities: ["Asti"], startDay: "2025-10-01", endDay: "2025-10-02" });
    const inverno = await createMemory(storage, { cities: ["Aosta"], startDay: "2025-12-01", endDay: "2025-12-02" });
    const viaggio = await createOccasion(storage, { name: "Viaggio insieme" });
    const gita = await createOccasion(storage, { name: "Gita" });
    for (const memory of [estate, autunno]) await addOccasionToMemory(storage, memory.id, viaggio.id);
    await addOccasionToMemory(storage, estate.id, gita.id);

    // Counted ahead, for the confirmation.
    const memories = await listTimeline(storage);
    expect(countOccasionUses(memories, viaggio.id)).toBe(2);
    expect(countOccasionUses(memories, gita.id)).toBe(1);

    expect(await deleteOccasion(storage, viaggio.id)).toBe(2);

    expect(await listOccasions(storage)).toEqual([gita]);
    expect(await badges(storage, estate.id)).toEqual([["Gita", "neutro"]]);
    expect(await badges(storage, autunno.id)).toEqual([]);
    expect((await getMemory(storage, autunno.id))!.occasionIds).toEqual([]);
    expect(await deleteOccasion(storage, (await createOccasion(storage, { name: "Mai usata" })).id)).toBe(0);
    expect(await badges(storage, inverno.id)).toEqual([]);
    await expect(deleteOccasion(storage, viaggio.id)).rejects.toThrow(
      new GalleryError("Questa occasione non esiste più."),
    );
  });
});

describe("Occasions on a Memory", () => {
  it("are added by hand from the list, shown in the order they were added, and saved as ids", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await createMemory(storage, { cities: ["Torino"], startDay: "2025-06-01", endDay: "2025-06-03" });
    expect(memory.occasionIds).toEqual([]);
    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
    const viaggio = await createOccasion(storage, { name: "Viaggio insieme" });

    await addOccasionToMemory(storage, memory.id, viaggio.id);
    await addOccasionToMemory(storage, memory.id, natale.id);

    // Dates don't matter: Natale belongs to a June Memory because the Curator said so.
    expect(await badges(storage, memory.id)).toEqual([
      ["Viaggio insieme", "neutro"],
      ["Natale", "natale"],
    ]);
    expect(await readDatabaseFile(dataDir)).toMatchObject({
      memories: [{ id: memory.id, occasionIds: [viaggio.id, natale.id] }],
    });
  });

  it("refuse, in Italian, an Occasion the Memory already has or that isn't in the list", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await createMemory(storage, { cities: ["Torino"], startDay: "2025-06-01", endDay: "2025-06-03" });
    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
    await addOccasionToMemory(storage, memory.id, natale.id);

    await expect(addOccasionToMemory(storage, memory.id, natale.id)).rejects.toThrow(
      new GalleryError("Questo ricordo ha già questa occasione."),
    );
    await expect(addOccasionToMemory(storage, memory.id, "nessuna")).rejects.toThrow(
      new GalleryError("Questa occasione non esiste più."),
    );
    expect(await badges(storage, memory.id)).toEqual([["Natale", "natale"]]);
  });

  it("can be created from a Memory, joining the list and the end of that Memory's Occasions in one step", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await createMemory(storage, { cities: ["Napoli"], startDay: "2025-05-10", endDay: "2025-05-11" });
    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
    await addOccasionToMemory(storage, memory.id, natale.id);

    const pizza = await createOccasionOnMemory(storage, memory.id, { name: " Prima pizza insieme " });

    expect(pizza).toEqual({ id: expect.any(String), name: "Prima pizza insieme", theme: "neutro" });
    expect((await listOccasions(storage)).map((occasion) => occasion.name)).toEqual(["Natale", "Prima pizza insieme"]);
    expect(await badges(storage, memory.id)).toEqual([
      ["Natale", "natale"],
      ["Prima pizza insieme", "neutro"],
    ]);
    expect(await readDatabaseFile(dataDir)).toMatchObject({
      memories: [{ id: memory.id, occasionIds: [natale.id, pizza.id] }],
    });
  });

  it("created from a Memory refuse, in Italian, a name already in the list or an unknown Theme, adding nothing", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await createMemory(storage, { cities: ["Napoli"], startDay: "2025-05-10", endDay: "2025-05-11" });
    await createOccasion(storage, { name: "Natale", theme: "natale" });
    const before = await readDatabaseFile(dataDir);

    await expect(createOccasionOnMemory(storage, memory.id, { name: "natale" })).rejects.toThrow(
      new GalleryError("C'è già un'occasione chiamata «natale»."),
    );
    await expect(createOccasionOnMemory(storage, memory.id, { name: "Gita", theme: "gita" })).rejects.toThrow(
      new GalleryError("Scegli uno dei temi della lista."),
    );
    await expect(createOccasionOnMemory(storage, "nessuno", { name: "Gita" })).rejects.toThrow(GalleryError);

    expect(await readDatabaseFile(dataDir)).toEqual(before);
  });

  it("are removed from one Memory only, staying in the list and on other Memories", async () => {
    const storage = openStorage(await makeDataDir());
    const estate = await createMemory(storage, { cities: ["Bari"], startDay: "2025-08-01", endDay: "2025-08-05" });
    const autunno = await createMemory(storage, { cities: ["Asti"], startDay: "2025-10-01", endDay: "2025-10-02" });
    const viaggio = await createOccasion(storage, { name: "Viaggio insieme" });
    const gita = await createOccasion(storage, { name: "Gita" });
    for (const memory of [estate, autunno]) await addOccasionToMemory(storage, memory.id, viaggio.id);
    await addOccasionToMemory(storage, estate.id, gita.id);

    await removeOccasionFromMemory(storage, estate.id, viaggio.id);

    expect(await badges(storage, estate.id)).toEqual([["Gita", "neutro"]]);
    expect(await badges(storage, autunno.id)).toEqual([["Viaggio insieme", "neutro"]]);
    expect((await listOccasions(storage)).map((occasion) => occasion.name)).toEqual(["Gita", "Viaggio insieme"]);
    await expect(removeOccasionFromMemory(storage, estate.id, viaggio.id)).rejects.toThrow(
      new GalleryError("Questo ricordo non ha questa occasione."),
    );
  });

  it("are left alone by a Date range edit", async () => {
    const storage = openStorage(await makeDataDir());
    const input = { cities: ["Torino"], startDay: "2025-12-24", endDay: "2025-12-26" };
    const memory = await createMemory(storage, input);
    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
    await addOccasionToMemory(storage, memory.id, natale.id);

    const moved = await updateMemory(storage, memory.id, { ...input, startDay: "2026-03-01", endDay: "2026-03-02" });

    expect(moved.occasionIds).toEqual([natale.id]);
    expect(await badges(storage, memory.id)).toEqual([["Natale", "natale"]]);
  });

  it("are reordered by setting the Memory's whole order, which becomes the badge order", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await createMemory(storage, { cities: ["Torino"], startDay: "2025-12-24", endDay: "2026-01-01" });
    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
    const capodanno = await createOccasion(storage, { name: "Capodanno", theme: "capodanno" });
    const pranzo = await createOccasion(storage, { name: "Pranzo dai nonni" });
    for (const occasion of [natale, capodanno, pranzo]) await addOccasionToMemory(storage, memory.id, occasion.id);

    await setOccasionOrder(storage, memory.id, [pranzo.id, capodanno.id, natale.id]);

    expect(await badges(storage, memory.id)).toEqual([
      ["Pranzo dai nonni", "neutro"],
      ["Capodanno", "capodanno"],
      ["Natale", "natale"],
    ]);
    expect(await readDatabaseFile(dataDir)).toMatchObject({
      memories: [{ id: memory.id, occasionIds: [pranzo.id, capodanno.id, natale.id] }],
    });
  });

  it("refuse, in Italian, an order that isn't the Memory's own Occasions rearranged", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await createMemory(storage, { cities: ["Torino"], startDay: "2025-12-24", endDay: "2026-01-01" });
    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
    const capodanno = await createOccasion(storage, { name: "Capodanno", theme: "capodanno" });
    const gita = await createOccasion(storage, { name: "Gita" });
    for (const occasion of [natale, capodanno]) await addOccasionToMemory(storage, memory.id, occasion.id);

    const refused = [
      [capodanno.id],
      [capodanno.id, natale.id, gita.id],
      [capodanno.id, gita.id],
      [capodanno.id, capodanno.id],
      [natale.id, capodanno.id, natale.id],
    ];
    for (const order of refused) {
      await expect(setOccasionOrder(storage, memory.id, order)).rejects.toThrow(
        new GalleryError("L'ordine delle occasioni è cambiato nel frattempo: ricarica la pagina e riprova."),
      );
    }
    expect(await badges(storage, memory.id)).toEqual([
      ["Natale", "natale"],
      ["Capodanno", "capodanno"],
    ]);
  });
});
