import { copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createMemory,
  getMemory,
  listOccasions,
  listTimeline,
  occasionsOfMemory,
  openStorage,
  themeOfMemory,
  type Storage,
} from "@/gallery";
import { FIXTURES, makeDataDir, readDatabaseFile } from "./helpers";

/** Writes a `database.json` as version 1 wrote it, with Yearly and One-off occasions, and opens it. */
async function openVersion1(content: {
  memories: Record<string, unknown>[];
  yearlyOccasions: Record<string, unknown>[];
}): Promise<Storage> {
  const dataDir = await makeDataDir();
  await writeFile(
    path.join(dataDir, "database.json"),
    JSON.stringify({
      version: 1,
      memories: content.memories.map((memory) => ({ cities: ["Torino"], oneOffOccasions: [], media: [], ...memory })),
      yearlyOccasions: content.yearlyOccasions,
    }),
  );
  return openStorage(dataDir);
}

/** Every Memory's badges, by Memory id: name and Theme, in badge order. */
async function badgesByMemory(storage: Storage) {
  const occasions = await listOccasions(storage);
  const memories = await listTimeline(storage);
  return Object.fromEntries(
    memories.map((memory) => [memory.id, occasionsOfMemory(memory, occasions).map(({ name, theme }) => [name, theme])]),
  );
}

describe("a database.json from version 1", () => {
  it("turns each Yearly occasion into an Occasion on every Memory it falls on, respecting its first year", async () => {
    const storage = await openVersion1({
      memories: [
        { id: "capodanno-2025", startDay: "2024-12-30", endDay: "2025-01-02" },
        { id: "giugno-2022", startDay: "2022-06-10", endDay: "2022-06-20" },
        { id: "giugno-2023", startDay: "2023-06-14", endDay: "2023-06-14" },
        { id: "bisestile-no", startDay: "2025-02-27", endDay: "2025-03-02" },
        { id: "bisestile-si", startDay: "2024-02-27", endDay: "2024-03-02" },
        { id: "niente", startDay: "2025-05-01", endDay: "2025-05-03" },
      ],
      yearlyOccasions: [
        { id: "capodanno", name: "Capodanno", month: 1, day: 1, theme: "capodanno" },
        { id: "anniversario", name: "Anniversario", month: 6, day: 14, firstYear: 2023, theme: "anniversario" },
        { id: "bisestile", name: "Giorno bisestile", month: 2, day: 29 },
        { id: "ferragosto", name: "Ferragosto", month: 8, day: 15, theme: "neutro" },
      ],
    });

    expect(await badgesByMemory(storage)).toEqual({
      "capodanno-2025": [["Capodanno", "capodanno"]],
      "giugno-2022": [],
      "giugno-2023": [["Anniversario", "anniversario"]],
      "bisestile-no": [],
      "bisestile-si": [["Giorno bisestile", "neutro"]],
      niente: [],
    });
    // Every Yearly occasion stays in the list, even one that falls on no Memory.
    expect((await listOccasions(storage)).map(({ name }) => name)).toEqual([
      "Anniversario",
      "Capodanno",
      "Ferragosto",
      "Giorno bisestile",
    ]);
  });

  it("turns each One-off occasion into an Occasion on its own Memory, ordering badges by day, then name", async () => {
    const storage = await openVersion1({
      memories: [
        {
          id: "inverno",
          startDay: "2025-12-23",
          endDay: "2026-01-02",
          oneOffOccasions: [
            { id: "regali", name: "Regali", day: "2025-12-25", theme: "compleanno" },
            { id: "cena", name: "Cenone", day: "2025-12-31" },
            { id: "arrivo", name: "Arrivo", day: "2025-12-23", theme: "neutro" },
          ],
        },
      ],
      yearlyOccasions: [
        { id: "capodanno", name: "Capodanno", month: 1, day: 1, theme: "capodanno" },
        { id: "natale", name: "Natale", month: 12, day: 25, theme: "natale" },
      ],
    });

    expect(await badgesByMemory(storage)).toEqual({
      inverno: [
        ["Arrivo", "neutro"],
        ["Natale", "natale"],
        ["Regali", "compleanno"],
        ["Cenone", "neutro"],
        ["Capodanno", "capodanno"],
      ],
    });
  });

  it("merges Occasions with the same name, ignoring case, keeping the first Theme met that isn't Neutro", async () => {
    const storage = await openVersion1({
      memories: [
        {
          id: "estate",
          startDay: "2025-07-01",
          endDay: "2025-07-05",
          oneOffOccasions: [{ id: "c1", name: "compleanno di Giulia", day: "2025-07-02", theme: "anniversario" }],
        },
        {
          id: "roma",
          startDay: "2025-09-01",
          endDay: "2025-09-02",
          oneOffOccasions: [{ id: "p1", name: "Prima pizza", day: "2025-09-01", theme: "neutro" }],
        },
        {
          id: "napoli",
          startDay: "2025-10-01",
          endDay: "2025-10-02",
          oneOffOccasions: [{ id: "p2", name: " prima PIZZA ", day: "2025-10-02", theme: "natale" }],
        },
      ],
      yearlyOccasions: [{ id: "giulia", name: "Compleanno di Giulia", month: 7, day: 3, theme: "neutro" }],
    });

    expect(await listOccasions(storage)).toEqual([
      { id: expect.any(String), name: "Compleanno di Giulia", theme: "anniversario" },
      { id: expect.any(String), name: "Prima pizza", theme: "natale" },
    ]);
    // On a Memory where both fall, the merged Occasion shows once, on its first day.
    expect(await badgesByMemory(storage)).toEqual({
      estate: [["Compleanno di Giulia", "anniversario"]],
      roma: [["Prima pizza", "natale"]],
      napoli: [["Prima pizza", "natale"]],
    });
  });

  it("carries over the Main occasion chosen, whether a Yearly or a One-off occasion", async () => {
    const storage = await openVersion1({
      memories: [
        { id: "inverno", startDay: "2025-12-24", endDay: "2026-01-02", mainOccasion: { kind: "yearly", id: "capodanno" } },
        {
          id: "estate",
          startDay: "2025-07-01",
          endDay: "2025-07-05",
          oneOffOccasions: [{ id: "laurea", name: "Laurea", day: "2025-07-04", theme: "compleanno" }],
          mainOccasion: { kind: "one-off", id: "laurea" },
        },
        // A choice that no longer applied, as the Date range had moved away from it.
        { id: "primavera", startDay: "2026-04-01", endDay: "2026-04-03", mainOccasion: { kind: "yearly", id: "natale" } },
      ],
      yearlyOccasions: [
        { id: "natale", name: "Natale", month: 12, day: 25, theme: "natale" },
        { id: "capodanno", name: "Capodanno", month: 1, day: 1, theme: "capodanno" },
        { id: "luglio", name: "Inizio estate", month: 7, day: 1, theme: "san-valentino" },
      ],
    });

    const occasions = await listOccasions(storage);
    const main = async (id: string) => themeOfMemory((await getMemory(storage, id))!, occasions);
    expect(await main("inverno")).toMatchObject({ mainOccasion: { name: "Capodanno" }, theme: "capodanno" });
    expect(await main("estate")).toMatchObject({ mainOccasion: { name: "Laurea" }, theme: "compleanno" });
    expect(await main("primavera")).toEqual({ theme: "neutro" });
    expect((await getMemory(storage, "primavera"))!.mainOccasionId).toBeUndefined();
  });

  it("keeps the Theme an automatic Memory had when two themed Occasions fell on the same day, though badges then go by name", async () => {
    // Version 1 put One-off occasions before Yearly ones on the same day, and
    // Yearly ones in list order; the new badge order breaks the tie by name.
    const storage = await openVersion1({
      memories: [
        {
          id: "natale",
          startDay: "2025-12-24",
          endDay: "2025-12-26",
          oneOffOccasions: [{ id: "zampogne", name: "Zampogne", day: "2025-12-25", theme: "natale" }],
        },
        { id: "estate", startDay: "2025-07-01", endDay: "2025-07-02" },
        { id: "pari", startDay: "2025-03-01", endDay: "2025-03-01" },
      ],
      yearlyOccasions: [
        { id: "auguri", name: "Auguri", month: 12, day: 25, theme: "anniversario" },
        { id: "zucca", name: "Zucca", month: 7, day: 1, theme: "capodanno" },
        { id: "arance", name: "Arance", month: 7, day: 1, theme: "compleanno" },
        { id: "marzo", name: "Marzo", month: 3, day: 1, theme: "san-valentino" },
      ],
    });

    const occasions = await listOccasions(storage);
    const look = async (id: string) => {
      const memory = (await getMemory(storage, id))!;
      return [occasionsOfMemory(memory, occasions).map(({ name }) => name), themeOfMemory(memory, occasions).theme];
    };
    expect(await look("natale")).toEqual([["Auguri", "Zampogne"], "natale"]);
    expect(await look("estate")).toEqual([["Arance", "Zucca"], "capodanno"]);
    expect(await look("pari")).toEqual([["Marzo"], "san-valentino"]);
    // Only where the look would change is a Main occasion chosen for it.
    expect((await getMemory(storage, "pari"))!.mainOccasionId).toBeUndefined();
  });

  it("is written back as version 2 on the next save", async () => {
    const storage = await openVersion1({
      memories: [{ id: "inverno", startDay: "2025-12-24", endDay: "2025-12-26" }],
      yearlyOccasions: [{ id: "natale", name: "Natale", month: 12, day: 25 }],
    });
    await createMemory(storage, { cities: ["Roma"], startDay: "2026-03-01", endDay: "2026-03-01" });

    const saved = (await readDatabaseFile(storage.dataDir)) as Record<string, unknown>;
    expect(saved).toMatchObject({
      version: 2,
      occasions: [{ id: expect.any(String), name: "Natale", theme: "neutro" }],
      memories: [{ id: "inverno", occasionIds: [expect.any(String)] }, { cities: ["Roma"], occasionIds: [] }],
    });
    expect(saved).not.toHaveProperty("yearlyOccasions");
    expect((saved.memories as object[])[0]).not.toHaveProperty("oneOffOccasions");
  });

  it("converts a gallery shaped like the live one (themed Yearly occasions, a first year, two One-offs) with nothing the Partner sees changed but the anniversary numbers", async () => {
    const dataDir = await makeDataDir();
    await copyFile(path.join(FIXTURES, "database-v1.json"), path.join(dataDir, "database.json"));
    const storage = openStorage(dataDir);

    const occasions = await listOccasions(storage);
    expect(occasions.map(({ name, theme }) => [name, theme])).toEqual([
      ["Capodanno", "capodanno"],
      ["Compleanno di lei", "compleanno"],
      ["Compleanno di lui", "compleanno"],
      ["Giro in gondola", "neutro"],
      ["Il nostro anniversario", "anniversario"],
      ["Natale", "natale"],
      ["Prima pizza insieme", "neutro"],
      ["San Valentino", "san-valentino"],
    ]);
    const memories = await listTimeline(storage);
    expect(
      memories.map((memory) => [
        memory.title ?? memory.cities.join(),
        occasionsOfMemory(memory, occasions).map(({ name }) => name),
        themeOfMemory(memory, occasions).theme,
      ]),
    ).toEqual([
      ["Febbraio 2025", ["San Valentino"], "san-valentino"],
      ["Aprile 2025", [], "neutro"],
      ["Giugno 2025", ["Prima pizza insieme"], "neutro"],
      ["Bologna", ["Il nostro anniversario"], "anniversario"],
      ["Dicembre 2025", ["Natale", "Capodanno"], "natale"],
      ["Febbraio 2026", ["San Valentino"], "san-valentino"],
      ["Luglio 2026", ["Compleanno di lei", "Giro in gondola"], "compleanno"],
      ["Settembre 2026", ["Il nostro anniversario"], "anniversario"],
    ]);
  });
});
