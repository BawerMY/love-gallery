import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createMemory,
  daysApart,
  deleteMemory,
  GalleryError,
  getMemory,
  listTimeline,
  openStorage,
  parseDay,
  suggestCities,
  updateMemory,
} from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

describe("days apart", () => {
  it("counts the days between the previous Memory's end and the next one's start", () => {
    expect(daysApart({ endDay: parseDay("2025-03-16") }, { startDay: parseDay("2025-03-20") })).toBe(3);
    expect(daysApart({ endDay: parseDay("2024-12-30") }, { startDay: parseDay("2025-01-02") })).toBe(2);
    expect(daysApart({ endDay: parseDay("2024-02-28") }, { startDay: parseDay("2024-03-01") })).toBe(1);
    expect(daysApart({ endDay: parseDay("2025-03-29") }, { startDay: parseDay("2025-10-27") })).toBe(211);
  });

  it("is 0 for back-to-back Memories", () => {
    expect(daysApart({ endDay: parseDay("2025-12-27") }, { startDay: parseDay("2025-12-28") })).toBe(0);
  });
});

describe("City suggestions", () => {
  it("are the distinct Cities of every Memory, in alphabetical order", async () => {
    const storage = openStorage(await makeDataDir());
    expect(await suggestCities(storage)).toEqual([]);

    await createMemory(storage, { cities: ["Roma", "Milano"], startDay: "2025-01-01", endDay: "2025-01-02" });
    await createMemory(storage, { cities: ["Milano"], startDay: "2025-02-01", endDay: "2025-02-02" });
    await createMemory(storage, { cities: ["Ancona", "Écija"], startDay: "2025-03-01", endDay: "2025-03-02" });

    expect(await suggestCities(storage)).toEqual(["Ancona", "Écija", "Milano", "Roma"]);
  });
});

describe("memories", () => {
  it("deletes a Memory together with its folder in media/, leaving the others alone", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const gone = await createMemory(storage, { cities: ["Roma"], startDay: "2025-05-01", endDay: "2025-05-01" });
    const kept = await createMemory(storage, { cities: ["Pisa"], startDay: "2025-06-01", endDay: "2025-06-01" });
    for (const memory of [gone, kept]) {
      await mkdir(path.join(dataDir, "media", memory.id), { recursive: true });
      await writeFile(path.join(dataDir, "media", memory.id, "foto.webp"), "x");
    }

    await deleteMemory(storage, gone.id);

    expect((await listTimeline(storage)).map((m) => m.id)).toEqual([kept.id]);
    expect(await readdir(path.join(dataDir, "media"))).toEqual([kept.id]);
    await expect(deleteMemory(storage, gone.id)).rejects.toThrow("Questo ricordo non esiste più.");
  });

  it("deletes a Memory that has no folder in media/ yet", async () => {
    const storage = openStorage(await makeDataDir());
    const memory = await createMemory(storage, { cities: ["Roma"], startDay: "2025-05-01", endDay: "2025-05-01" });

    await deleteMemory(storage, memory.id);

    expect(await listTimeline(storage)).toEqual([]);
  });

  it("edits every field of a Memory, keeping its id, and can clear the title and note", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const created = await createMemory(storage, {
      title: "Weekend",
      note: "Bello",
      cities: ["Roma"],
      startDay: "2025-05-01",
      endDay: "2025-05-03",
    });

    const edited = await updateMemory(storage, created.id, {
      cities: ["Napoli", "Salerno"],
      startDay: "2025-05-02",
      endDay: "2025-05-05",
    });

    const expected = {
      id: created.id,
      cities: ["Napoli", "Salerno"],
      startDay: "2025-05-02",
      endDay: "2025-05-05",
      occasionIds: [],
      media: [],
    };
    expect(edited).toEqual(expected);
    expect(await getMemory(storage, created.id)).toEqual(expected);
    expect(await readDatabaseFile(dataDir)).toMatchObject({ memories: [expected] });
  });

  it("refuses an edit that overlaps another Memory, but not one that overlaps its own old dates", async () => {
    const storage = openStorage(await makeDataDir());
    const first = await createMemory(storage, {
      title: "Pasqua",
      cities: ["Roma"],
      startDay: "2025-04-18",
      endDay: "2025-04-21",
    });
    const second = await createMemory(storage, {
      cities: ["Milano"],
      startDay: "2025-05-01",
      endDay: "2025-05-03",
    });

    await expect(
      updateMemory(storage, second.id, { cities: ["Milano"], startDay: "2025-04-21", endDay: "2025-05-03" }),
    ).rejects.toThrow("Le date si sovrappongono a «Pasqua»");
    await updateMemory(storage, first.id, { cities: ["Roma"], startDay: "2025-04-19", endDay: "2025-04-22" });

    expect((await getMemory(storage, second.id))?.startDay).toBe("2025-05-01");
    expect((await getMemory(storage, first.id))?.endDay).toBe("2025-04-22");
  });

  it("refuses to edit a Memory that does not exist", async () => {
    const storage = openStorage(await makeDataDir());

    await expect(
      updateMemory(storage, "nessuno", { cities: ["Roma"], startDay: "2025-05-01", endDay: "2025-05-01" }),
    ).rejects.toThrow("Questo ricordo non esiste più.");
    expect(await getMemory(storage, "nessuno")).toBeUndefined();
  });

  it("has an empty Timeline in a new data folder", async () => {
    const storage = openStorage(await makeDataDir());

    expect(await listTimeline(storage)).toEqual([]);
  });

  it("creates a Memory with a title, note, Cities in order and a Date range", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);

    const memory = await createMemory(storage, {
      title: "Primo incontro",
      note: "Pioveva.",
      cities: ["Milano", "Bergamo"],
      startDay: "2025-03-14",
      endDay: "2025-03-16",
    });

    expect(memory).toMatchObject({
      id: expect.any(String),
      title: "Primo incontro",
      note: "Pioveva.",
      cities: ["Milano", "Bergamo"],
      startDay: "2025-03-14",
      endDay: "2025-03-16",
      occasionIds: [],
      media: [],
    });
    expect(await listTimeline(storage)).toEqual([memory]);
    expect(await readDatabaseFile(dataDir)).toMatchObject({ memories: [memory] });
  });

  it("lists Memories from oldest to newest, whatever order they were added in", async () => {
    const storage = openStorage(await makeDataDir());
    await createMemory(storage, { cities: ["Roma"], startDay: "2025-06-01", endDay: "2025-06-03" });
    await createMemory(storage, { cities: ["Torino"], startDay: "2024-12-30", endDay: "2025-01-02" });
    await createMemory(storage, { cities: ["Napoli"], startDay: "2025-02-10", endDay: "2025-02-10" });

    const timeline = await listTimeline(storage);

    expect(timeline.map((m) => m.cities[0])).toEqual(["Torino", "Napoli", "Roma"]);
  });

  it("refuses, in Italian, a Date range that overlaps another Memory and saves nothing", async () => {
    const storage = openStorage(await makeDataDir());
    await createMemory(storage, {
      title: "Natale",
      cities: ["Roma"],
      startDay: "2025-12-23",
      endDay: "2025-12-27",
    });

    for (const [startDay, endDay] of [
      ["2025-12-20", "2025-12-23"],
      ["2025-12-27", "2025-12-29"],
      ["2025-12-24", "2025-12-25"],
      ["2025-12-01", "2026-01-10"],
    ]) {
      const attempt = createMemory(storage, { cities: ["Milano"], startDay, endDay });
      await expect(attempt).rejects.toThrow(GalleryError);
      await expect(attempt).rejects.toThrow("Le date si sovrappongono a «Natale»");
    }
    expect(await listTimeline(storage)).toHaveLength(1);
  });

  it("trims what the Curator typed and leaves out a blank title, note or City", async () => {
    const storage = openStorage(await makeDataDir());

    const memory = await createMemory(storage, {
      title: "   ",
      note: "",
      cities: [" Firenze ", "", "  "],
      startDay: "2025-05-01",
      endDay: "2025-05-01",
    });

    expect(memory.cities).toEqual(["Firenze"]);
    expect(memory).not.toHaveProperty("title");
    expect(memory).not.toHaveProperty("note");
  });

  it("refuses, in Italian, a Memory with no City or an impossible Date range", async () => {
    const storage = openStorage(await makeDataDir());
    const valid = { cities: ["Roma"], startDay: "2025-05-01", endDay: "2025-05-03" };

    await expect(createMemory(storage, { ...valid, cities: [" "] })).rejects.toThrow(
      "Aggiungi almeno una città.",
    );
    await expect(
      createMemory(storage, { ...valid, startDay: "2025-05-04", endDay: "2025-05-03" }),
    ).rejects.toThrow("L'ultimo giorno non può venire prima del primo.");
    await expect(createMemory(storage, { ...valid, startDay: "2025-02-30" })).rejects.toThrow(
      "Inserisci date valide.",
    );
    await expect(createMemory(storage, { ...valid, endDay: "" })).rejects.toThrow(
      "Inserisci date valide.",
    );
    expect(await listTimeline(storage)).toEqual([]);
  });

  it("allows back-to-back Memories", async () => {
    const storage = openStorage(await makeDataDir());
    await createMemory(storage, { cities: ["Roma"], startDay: "2025-12-23", endDay: "2025-12-27" });

    await createMemory(storage, { cities: ["Milano"], startDay: "2025-12-28", endDay: "2025-12-30" });
    await createMemory(storage, { cities: ["Pisa"], startDay: "2025-12-22", endDay: "2025-12-22" });

    expect(await listTimeline(storage)).toHaveLength(3);
  });
});
