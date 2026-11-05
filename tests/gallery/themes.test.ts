import { writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  addOneOffOccasion,
  createMemory,
  createYearlyOccasion,
  GalleryError,
  getMemory,
  listYearlyOccasions,
  occasionsOfMemory,
  openStorage,
  updateYearlyOccasion,
} from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

describe("Themes on Yearly occasions", () => {
  it("are stored with the occasion and carried by its badges", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await createMemory(storage, { cities: ["Torino"], startDay: "2024-12-24", endDay: "2024-12-26" });

    const natale = await createYearlyOccasion(storage, { name: "Natale", month: 12, day: 25, theme: "natale" });

    expect(natale.theme).toBe("natale");
    expect(await readDatabaseFile(dataDir)).toMatchObject({
      yearlyOccasions: [{ id: natale.id, name: "Natale", theme: "natale" }],
    });
    const occasions = occasionsOfMemory((await getMemory(storage, memory.id))!, await listYearlyOccasions(storage));
    expect(occasions.map((occasion) => occasion.theme)).toEqual(["natale"]);
  });

  it("default to Neutro, and can be changed when the occasion is edited", async () => {
    const storage = openStorage(await makeDataDir());
    const valentino = await createYearlyOccasion(storage, { name: "San Valentino", month: 2, day: 14 });
    expect(valentino.theme).toBe("neutro");

    await updateYearlyOccasion(storage, valentino.id, { name: "San Valentino", month: 2, day: 14, theme: "san-valentino" });
    expect((await listYearlyOccasions(storage))[0].theme).toBe("san-valentino");

    await updateYearlyOccasion(storage, valentino.id, { name: "San Valentino", month: 2, day: 14 });
    expect((await listYearlyOccasions(storage))[0].theme).toBe("neutro");
  });

  it("accept the Pasqua, Viaggio and Escursione Themes", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);

    const pasqua = await createYearlyOccasion(storage, { name: "Pasqua", month: 4, day: 20, theme: "pasqua" });
    const viaggio = await createYearlyOccasion(storage, { name: "Viaggio insieme", month: 7, day: 1, theme: "viaggio" });
    const escursione = await createYearlyOccasion(storage, { name: "Escursione insieme", month: 9, day: 1 });
    await updateYearlyOccasion(storage, escursione.id, { name: "Escursione insieme", month: 9, day: 1, theme: "escursione" });

    expect([pasqua.theme, viaggio.theme]).toEqual(["pasqua", "viaggio"]);
    expect(await readDatabaseFile(dataDir)).toMatchObject({
      yearlyOccasions: [
        { name: "Pasqua", theme: "pasqua" },
        { name: "Viaggio insieme", theme: "viaggio" },
        { name: "Escursione insieme", theme: "escursione" },
      ],
    });
  });

  it("refuse, in Italian, a Theme that doesn't exist", async () => {
    const storage = openStorage(await makeDataDir());
    await expect(createYearlyOccasion(storage, { name: "Ferragosto", month: 8, day: 15, theme: "ferragosto" })).rejects.toThrow(
      new GalleryError("Scegli uno dei temi della lista."),
    );
    const natale = await createYearlyOccasion(storage, { name: "Natale", month: 12, day: 25, theme: "natale" });
    await expect(
      updateYearlyOccasion(storage, natale.id, { name: "Natale", month: 12, day: 25, theme: "Natale" }),
    ).rejects.toThrow(new GalleryError("Scegli uno dei temi della lista."));
    expect(await listYearlyOccasions(storage)).toEqual([natale]);
  });
});

describe("Themes on One-off occasions", () => {
  it("are stored with the occasion, default to Neutro and refuse unknown keys", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await createMemory(storage, { cities: ["Napoli"], startDay: "2025-03-10", endDay: "2025-03-12" });

    const laurea = await addOneOffOccasion(storage, memory.id, { name: "Laurea", day: "2025-03-11", theme: "compleanno" });
    const cena = await addOneOffOccasion(storage, memory.id, { name: "Cena", day: "2025-03-10" });
    await expect(
      addOneOffOccasion(storage, memory.id, { name: "Gita", day: "2025-03-12", theme: "gita" }),
    ).rejects.toThrow(new GalleryError("Scegli uno dei temi della lista."));

    expect(await readDatabaseFile(dataDir)).toMatchObject({
      memories: [{ oneOffOccasions: [{ id: laurea.id, theme: "compleanno" }, { id: cena.id, theme: "neutro" }] }],
    });
    const occasions = occasionsOfMemory((await getMemory(storage, memory.id))!, []);
    expect(occasions.map(({ name, theme }) => [name, theme])).toEqual([
      ["Cena", "neutro"],
      ["Laurea", "compleanno"],
    ]);
  });
});

describe("a database.json from before Themes", () => {
  it("loads with every Occasion treated as Neutro", async () => {
    const dataDir = await makeDataDir();
    await writeFile(
      path.join(dataDir, "database.json"),
      JSON.stringify({
        version: 1,
        memories: [
          {
            id: "capodanno-a-napoli",
            cities: ["Napoli"],
            startDay: "2024-12-31",
            endDay: "2025-01-01",
            oneOffOccasions: [{ id: "cena", name: "Cenone", day: "2024-12-31" }],
            media: [],
          },
        ],
        yearlyOccasions: [{ id: "capodanno", name: "Capodanno", month: 1, day: 1 }],
      }),
    );
    const storage = openStorage(dataDir);

    const yearly = await listYearlyOccasions(storage);
    expect(yearly).toEqual([{ id: "capodanno", name: "Capodanno", month: 1, day: 1, theme: "neutro" }]);
    const memory = (await getMemory(storage, "capodanno-a-napoli"))!;
    expect(memory.oneOffOccasions).toEqual([{ id: "cena", name: "Cenone", day: "2024-12-31", theme: "neutro" }]);
    expect(occasionsOfMemory(memory, yearly).map(({ name, theme }) => [name, theme])).toEqual([
      ["Cenone", "neutro"],
      ["Capodanno", "neutro"],
    ]);
  });
});
