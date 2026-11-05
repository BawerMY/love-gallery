import { describe, expect, it } from "vitest";
import {
  addOccasionToMemory,
  chooseMainOccasion,
  createMemory,
  createOccasion,
  deleteOccasion,
  GalleryError,
  getMemory,
  listOccasions,
  openStorage,
  removeOccasionFromMemory,
  themeOfMemory,
  updateOccasion,
  type Storage,
} from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

/** The Memory's effective Main occasion name and Theme, as the gallery pages see them. */
async function effective(storage: Storage, memoryId: string) {
  const memory = (await getMemory(storage, memoryId))!;
  const { mainOccasion, theme } = themeOfMemory(memory, await listOccasions(storage));
  return { main: mainOccasion?.name, theme };
}

/** A winter Memory with a Neutro "Pranzo dai nonni" first, then Natale and Capodanno, both themed. */
async function inverno() {
  const storage = openStorage(await makeDataDir());
  const memory = await createMemory(storage, { cities: ["Torino"], startDay: "2025-12-24", endDay: "2026-01-02" });
  const pranzo = await createOccasion(storage, { name: "Pranzo dai nonni" });
  const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
  const capodanno = await createOccasion(storage, { name: "Capodanno", theme: "capodanno" });
  for (const occasion of [pranzo, natale, capodanno]) await addOccasionToMemory(storage, memory.id, occasion.id);
  return { storage, memory, pranzo, natale, capodanno };
}

describe("a Memory's Main occasion and Theme", () => {
  it("honours the Main occasion the Curator chose", async () => {
    const { storage, memory, capodanno } = await inverno();

    await chooseMainOccasion(storage, memory.id, capodanno.id);

    expect(await effective(storage, memory.id)).toEqual({ main: "Capodanno", theme: "capodanno" });
    expect(await readDatabaseFile(storage.dataDir)).toMatchObject({
      memories: [{ id: memory.id, mainOccasionId: capodanno.id }],
    });
  });

  it("uses the first non-Neutro Occasion in badge order when none is chosen", async () => {
    const { storage, memory } = await inverno();

    expect(await effective(storage, memory.id)).toEqual({ main: "Natale", theme: "natale" });
  });

  it("refuses, in Italian, a Neutro Occasion or one the Memory doesn't have, keeping the previous choice", async () => {
    const { storage, memory, pranzo, capodanno } = await inverno();
    const pasqua = await createOccasion(storage, { name: "Pasqua", theme: "anniversario" });
    await chooseMainOccasion(storage, memory.id, capodanno.id);

    await expect(chooseMainOccasion(storage, memory.id, pranzo.id)).rejects.toThrow(
      new GalleryError("Un'occasione con tema Neutro non può dare il tema al ricordo."),
    );
    await expect(chooseMainOccasion(storage, memory.id, pasqua.id)).rejects.toThrow(
      new GalleryError("Questo ricordo non ha questa occasione."),
    );

    expect(await effective(storage, memory.id)).toEqual({ main: "Capodanno", theme: "capodanno" });
  });

  it("falls back to the first non-Neutro in badge order when the chosen one is removed from the Memory", async () => {
    const { storage, memory, capodanno } = await inverno();
    await chooseMainOccasion(storage, memory.id, capodanno.id);

    await removeOccasionFromMemory(storage, memory.id, capodanno.id);

    expect(await effective(storage, memory.id)).toEqual({ main: "Natale", theme: "natale" });
  });

  it("falls back when the chosen one is deleted from the list", async () => {
    const { storage, memory, natale } = await inverno();
    await chooseMainOccasion(storage, memory.id, natale.id);

    await deleteOccasion(storage, natale.id);

    expect(await effective(storage, memory.id)).toEqual({ main: "Capodanno", theme: "capodanno" });
  });

  it("falls back when the chosen one is turned Neutro", async () => {
    const { storage, memory, natale } = await inverno();
    await chooseMainOccasion(storage, memory.id, natale.id);

    await updateOccasion(storage, natale.id, { name: "Natale", theme: "neutro" });

    expect(await effective(storage, memory.id)).toEqual({ main: "Capodanno", theme: "capodanno" });
  });

  it("forgets the choice when the chosen one is removed from the Memory, so adding it back doesn't bring the choice back", async () => {
    const { storage, memory, capodanno } = await inverno();
    await chooseMainOccasion(storage, memory.id, capodanno.id);

    await removeOccasionFromMemory(storage, memory.id, capodanno.id);
    await addOccasionToMemory(storage, memory.id, capodanno.id);

    expect(await effective(storage, memory.id)).toEqual({ main: "Natale", theme: "natale" });
    expect((await getMemory(storage, memory.id))!.mainOccasionId).toBeUndefined();
  });

  it("forgets the choice on every Memory when the chosen one is turned Neutro, so giving it a Theme again doesn't bring the choice back", async () => {
    const { storage, memory, natale, capodanno } = await inverno();
    const other = await createMemory(storage, { cities: ["Roma"], startDay: "2024-12-24", endDay: "2025-01-02" });
    for (const occasion of [natale, capodanno]) await addOccasionToMemory(storage, other.id, occasion.id);
    await chooseMainOccasion(storage, memory.id, capodanno.id);
    await chooseMainOccasion(storage, other.id, capodanno.id);

    await updateOccasion(storage, capodanno.id, { name: "Capodanno", theme: "neutro" });
    await updateOccasion(storage, capodanno.id, { name: "Capodanno", theme: "capodanno" });

    expect(await effective(storage, memory.id)).toEqual({ main: "Natale", theme: "natale" });
    expect(await effective(storage, other.id)).toEqual({ main: "Natale", theme: "natale" });
  });

  it("keeps the choice when the chosen one is renamed or given another Theme that isn't Neutro", async () => {
    const { storage, memory, capodanno } = await inverno();
    await chooseMainOccasion(storage, memory.id, capodanno.id);

    await updateOccasion(storage, capodanno.id, { name: "Fine anno", theme: "anniversario" });

    expect(await effective(storage, memory.id)).toEqual({ main: "Fine anno", theme: "anniversario" });
  });

  it("gives the default look, with no Main occasion, when no Occasion is themed", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await createMemory(storage, { cities: ["Roma"], startDay: "2025-05-01", endDay: "2025-05-03" });
    expect(await effective(storage, memory.id)).toEqual({ main: undefined, theme: "neutro" });

    const gita = await createOccasion(storage, { name: "Gita" });
    await addOccasionToMemory(storage, memory.id, gita.id);
    expect(await effective(storage, memory.id)).toEqual({ main: undefined, theme: "neutro" });
  });

  it("goes back to automatic when the choice is cleared", async () => {
    const { storage, memory, capodanno } = await inverno();
    await chooseMainOccasion(storage, memory.id, capodanno.id);

    await chooseMainOccasion(storage, memory.id, undefined);

    expect(await effective(storage, memory.id)).toEqual({ main: "Natale", theme: "natale" });
    expect((await getMemory(storage, memory.id))!.mainOccasionId).toBeUndefined();
  });
});
