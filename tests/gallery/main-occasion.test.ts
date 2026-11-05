import { writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  addOneOffOccasion,
  chooseMainOccasion,
  createMemory,
  createYearlyOccasion,
  deleteOneOffOccasion,
  deleteYearlyOccasion,
  GalleryError,
  getMemory,
  listYearlyOccasions,
  openStorage,
  themeOfMemory,
  updateMemory,
  updateYearlyOccasion,
  type Storage,
} from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

/** The Memory's effective Main occasion name and Theme, as the gallery pages see them. */
async function effective(storage: Storage, memoryId: string) {
  const memory = (await getMemory(storage, memoryId))!;
  const { mainOccasion, theme } = themeOfMemory(memory, await listYearlyOccasions(storage));
  return { main: mainOccasion?.name, theme };
}

/** A winter Memory with Natale (25/12) and Capodanno (1/1), both themed. */
async function nataleECapodanno() {
  const storage = openStorage(await makeDataDir());
  const memory = await createMemory(storage, { cities: ["Torino"], startDay: "2025-12-24", endDay: "2026-01-02" });
  const natale = await createYearlyOccasion(storage, { name: "Natale", month: 12, day: 25, theme: "natale" });
  const capodanno = await createYearlyOccasion(storage, { name: "Capodanno", month: 1, day: 1, theme: "capodanno" });
  return { storage, memory, natale, capodanno };
}

describe("a Memory's Main occasion and Theme", () => {
  it("honours the Main occasion the Curator chose", async () => {
    const { storage, memory, capodanno } = await nataleECapodanno();

    await chooseMainOccasion(storage, memory.id, { kind: "yearly", id: capodanno.id });

    expect(await effective(storage, memory.id)).toEqual({ main: "Capodanno", theme: "capodanno" });
  });

  it("uses the first non-Neutro Occasion by day when none is chosen", async () => {
    const { storage, memory } = await nataleECapodanno();
    await addOneOffOccasion(storage, memory.id, { name: "Pranzo", day: "2025-12-24" });

    expect(await effective(storage, memory.id)).toEqual({ main: "Natale", theme: "natale" });
  });

  it("refuses a Neutro Occasion as Main occasion, keeping the previous choice", async () => {
    const { storage, memory, capodanno } = await nataleECapodanno();
    const pranzo = await addOneOffOccasion(storage, memory.id, { name: "Pranzo", day: "2025-12-24" });
    const festa = await createYearlyOccasion(storage, { name: "Festa", month: 12, day: 26 });
    await chooseMainOccasion(storage, memory.id, { kind: "yearly", id: capodanno.id });

    await expect(chooseMainOccasion(storage, memory.id, { kind: "one-off", id: pranzo.id })).rejects.toThrow(
      new GalleryError("Una ricorrenza con tema Neutro non può dare il tema al ricordo."),
    );
    await expect(chooseMainOccasion(storage, memory.id, { kind: "yearly", id: festa.id })).rejects.toThrow(GalleryError);

    expect(await effective(storage, memory.id)).toEqual({ main: "Capodanno", theme: "capodanno" });
  });

  it("skips a chosen Main occasion whose Theme later became Neutro", async () => {
    const { storage, memory, capodanno } = await nataleECapodanno();
    await chooseMainOccasion(storage, memory.id, { kind: "yearly", id: capodanno.id });

    await updateYearlyOccasion(storage, capodanno.id, { name: "Capodanno", month: 1, day: 1, theme: "neutro" });

    expect(await effective(storage, memory.id)).toEqual({ main: "Natale", theme: "natale" });
  });

  it("honours a chosen One-off occasion", async () => {
    const { storage, memory } = await nataleECapodanno();
    const laurea = await addOneOffOccasion(storage, memory.id, { name: "Laurea", day: "2025-12-30", theme: "compleanno" });

    await chooseMainOccasion(storage, memory.id, { kind: "one-off", id: laurea.id });

    expect(await effective(storage, memory.id)).toEqual({ main: "Laurea", theme: "compleanno" });
  });

  it("falls back to the first non-Neutro by day when a Date range edit leaves the chosen one out", async () => {
    const { storage, memory, capodanno } = await nataleECapodanno();
    await chooseMainOccasion(storage, memory.id, { kind: "yearly", id: capodanno.id });

    await updateMemory(storage, memory.id, { cities: ["Torino"], startDay: "2025-12-24", endDay: "2025-12-28" });

    expect(await effective(storage, memory.id)).toEqual({ main: "Natale", theme: "natale" });
  });

  it("falls back when the chosen Yearly or One-off occasion is deleted", async () => {
    const { storage, memory, natale, capodanno } = await nataleECapodanno();
    const laurea = await addOneOffOccasion(storage, memory.id, { name: "Laurea", day: "2025-12-30", theme: "compleanno" });

    await chooseMainOccasion(storage, memory.id, { kind: "yearly", id: natale.id });
    await deleteYearlyOccasion(storage, natale.id);
    expect(await effective(storage, memory.id)).toEqual({ main: "Laurea", theme: "compleanno" });

    await chooseMainOccasion(storage, memory.id, { kind: "one-off", id: laurea.id });
    await deleteOneOffOccasion(storage, memory.id, laurea.id);
    expect(await effective(storage, memory.id)).toEqual({ main: "Capodanno", theme: "capodanno" });
    expect(capodanno.theme).toBe("capodanno");
  });

  it("gives the default look, with no Main occasion, when no Occasion is themed", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await createMemory(storage, { cities: ["Roma"], startDay: "2025-05-01", endDay: "2025-05-03" });
    expect(await effective(storage, memory.id)).toEqual({ main: undefined, theme: "neutro" });

    await addOneOffOccasion(storage, memory.id, { name: "Gita", day: "2025-05-02" });
    await createYearlyOccasion(storage, { name: "Festa", month: 5, day: 1 });
    expect(await effective(storage, memory.id)).toEqual({ main: undefined, theme: "neutro" });
  });

  it("goes back to automatic when the choice is cleared", async () => {
    const { storage, memory, capodanno } = await nataleECapodanno();
    await chooseMainOccasion(storage, memory.id, { kind: "yearly", id: capodanno.id });

    await chooseMainOccasion(storage, memory.id, undefined);

    expect(await effective(storage, memory.id)).toEqual({ main: "Natale", theme: "natale" });
    expect((await getMemory(storage, memory.id))!.mainOccasion).toBeUndefined();
  });

  it("is stored in database.json and refuses an Occasion the Memory doesn't have", async () => {
    const { storage, memory, capodanno } = await nataleECapodanno();
    const pasqua = await createYearlyOccasion(storage, { name: "Pasqua", month: 4, day: 20, theme: "anniversario" });

    await chooseMainOccasion(storage, memory.id, { kind: "yearly", id: capodanno.id });
    await expect(chooseMainOccasion(storage, memory.id, { kind: "yearly", id: pasqua.id })).rejects.toThrow(
      new GalleryError("Questa ricorrenza non esiste più."),
    );
    await expect(chooseMainOccasion(storage, memory.id, { kind: "one-off", id: capodanno.id })).rejects.toThrow(
      GalleryError,
    );

    expect(await readDatabaseFile(storage.dataDir)).toMatchObject({
      memories: [{ id: memory.id, mainOccasion: { kind: "yearly", id: capodanno.id } }],
    });
  });
});

describe("a database.json from before Main occasions", () => {
  it("loads with no Main occasion chosen", async () => {
    const dataDir = await makeDataDir();
    await writeFile(
      path.join(dataDir, "database.json"),
      JSON.stringify({
        version: 1,
        memories: [
          { id: "inverno", cities: ["Torino"], startDay: "2025-12-24", endDay: "2026-01-02", oneOffOccasions: [], media: [] },
        ],
        yearlyOccasions: [
          { id: "capodanno", name: "Capodanno", month: 1, day: 1, theme: "capodanno" },
          { id: "natale", name: "Natale", month: 12, day: 25, theme: "natale" },
        ],
      }),
    );
    const storage = openStorage(dataDir);

    expect((await getMemory(storage, "inverno"))!.mainOccasion).toBeUndefined();
    expect(await effective(storage, "inverno")).toEqual({ main: "Natale", theme: "natale" });
  });
});
