import { describe, expect, it } from "vitest";
import {
  createMemory,
  createYearlyOccasion,
  deleteYearlyOccasion,
  GalleryError,
  getMemory,
  listYearlyOccasions,
  occasionsOfMemory,
  openStorage,
  updateYearlyOccasion,
  type Memory,
  type YearlyOccasion,
} from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

function memory(startDay: string, endDay: string): Memory {
  return { id: "m", cities: ["Roma"], startDay, endDay, oneOffOccasions: [], media: [] };
}

const capodanno: YearlyOccasion = { id: "capodanno", name: "Capodanno", month: 1, day: 1 };

describe("Yearly occasions of a Memory", () => {
  it("match a Date range that crosses the new year", () => {
    expect(occasionsOfMemory(memory("2024-12-30", "2025-01-02"), [capodanno])).toEqual([
      { id: "capodanno", kind: "yearly", name: "Capodanno", day: "2025-01-01" },
    ]);
  });

  it("leave out a Date range that misses the day", () => {
    expect(occasionsOfMemory(memory("2025-01-02", "2025-12-31"), [capodanno])).toEqual([]);
  });

  it("on 29 February match only in leap years", () => {
    const bisestile: YearlyOccasion = { id: "bisestile", name: "Giorno bisestile", month: 2, day: 29 };
    expect(occasionsOfMemory(memory("2025-02-27", "2025-03-02"), [bisestile])).toEqual([]);
    expect(occasionsOfMemory(memory("2024-02-27", "2024-03-02"), [bisestile])).toEqual([
      { id: "bisestile", kind: "yearly", name: "Giorno bisestile", day: "2024-02-29" },
    ]);
  });

  it("are listed by day, whatever order they were added in", () => {
    const natale: YearlyOccasion = { id: "natale", name: "Natale", month: 12, day: 25 };
    const vigilia: YearlyOccasion = { id: "vigilia", name: "Vigilia", month: 12, day: 24 };
    const occasions = occasionsOfMemory(memory("2024-12-23", "2025-01-02"), [capodanno, natale, vigilia]);
    expect(occasions.map((occasion) => occasion.day)).toEqual(["2024-12-24", "2024-12-25", "2025-01-01"]);
  });

  describe("with a first year", () => {
    const anniversario: YearlyOccasion = {
      id: "anniversario",
      name: "anniversario",
      month: 6,
      day: 14,
      firstYear: 2023,
    };

    it("are not matched before the first year", () => {
      expect(occasionsOfMemory(memory("2022-06-10", "2022-06-20"), [anniversario])).toEqual([]);
    });

    it("are not numbered on the very first year", () => {
      expect(occasionsOfMemory(memory("2023-06-14", "2023-06-14"), [anniversario])).toEqual([
        { id: "anniversario", kind: "yearly", name: "anniversario", day: "2023-06-14" },
      ]);
    });

    it("are numbered by the years since the first year", () => {
      expect(occasionsOfMemory(memory("2025-06-13", "2025-06-15"), [anniversario])).toEqual([
        { id: "anniversario", kind: "yearly", name: "anniversario", day: "2025-06-14", number: 2 },
      ]);
    });
  });
});

describe("managing Yearly occasions", () => {
  it("an occasion added later belongs to Memories made before it, without being stored on them", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const san = await createMemory(storage, { cities: ["Verona"], startDay: "2024-02-13", endDay: "2024-02-15" });

    const valentino = await createYearlyOccasion(storage, { name: "San Valentino", month: 2, day: 14 });

    expect(await listYearlyOccasions(storage)).toEqual([valentino]);
    const saved = (await getMemory(storage, san.id))!;
    expect(occasionsOfMemory(saved, await listYearlyOccasions(storage))).toEqual([
      { id: valentino.id, kind: "yearly", name: "San Valentino", day: "2024-02-14" },
    ]);
    expect(await readDatabaseFile(dataDir)).toEqual({
      version: 1,
      memories: [{ ...san }],
      yearlyOccasions: [{ id: valentino.id, name: "San Valentino", month: 2, day: 14 }],
    });
  });

  it("are listed in calendar order and can be edited and deleted", async () => {
    const storage = openStorage(await makeDataDir());
    const natale = await createYearlyOccasion(storage, { name: "Natale", month: 12, day: 25 });
    const anniversario = await createYearlyOccasion(storage, {
      name: " anniversario ",
      month: 6,
      day: 14,
      firstYear: 2023,
    });
    expect((await listYearlyOccasions(storage)).map((o) => o.name)).toEqual(["anniversario", "Natale"]);

    const edited = await updateYearlyOccasion(storage, anniversario.id, { name: "anniversario", month: 6, day: 15 });
    expect(edited).toEqual({ id: anniversario.id, name: "anniversario", month: 6, day: 15 });

    await deleteYearlyOccasion(storage, natale.id);
    expect(await listYearlyOccasions(storage)).toEqual([edited]);
    await expect(deleteYearlyOccasion(storage, natale.id)).rejects.toThrow("Questa ricorrenza non esiste più.");
  });

  it("refuses, in Italian, a blank name, a day that never exists and a bad first year", async () => {
    const storage = openStorage(await makeDataDir());
    const refused = [
      [{ name: "  ", month: 1, day: 1 }, "Dai un nome alla ricorrenza."],
      [{ name: "Mai", month: 2, day: 30 }, "Scegli un giorno e un mese che esistono."],
      [{ name: "Mai", month: 13, day: 1 }, "Scegli un giorno e un mese che esistono."],
      [{ name: "Mai", month: 4, day: 31 }, "Scegli un giorno e un mese che esistono."],
      [{ name: "Mai", month: 1, day: 1, firstYear: 20.5 }, "Il primo anno non è valido."],
    ] as const;
    for (const [input, message] of refused) {
      await expect(createYearlyOccasion(storage, input)).rejects.toThrow(new GalleryError(message));
    }
    expect(await listYearlyOccasions(storage)).toEqual([]);

    await createYearlyOccasion(storage, { name: "Bisestile", month: 2, day: 29 });
    expect(await listYearlyOccasions(storage)).toHaveLength(1);
  });
});
