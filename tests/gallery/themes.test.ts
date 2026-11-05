import { describe, expect, it } from "vitest";
import {
  addOccasionToMemory,
  createMemory,
  createOccasion,
  GalleryError,
  getMemory,
  listOccasions,
  occasionsOfMemory,
  openStorage,
  updateOccasion,
} from "@/gallery";
import { makeDataDir, readDatabaseFile } from "./helpers";

describe("Themes on Occasions", () => {
  it("are stored with the Occasion and carried by its badges", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);
    const memory = await createMemory(storage, { cities: ["Torino"], startDay: "2024-12-24", endDay: "2024-12-26" });

    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
    await addOccasionToMemory(storage, memory.id, natale.id);

    expect(natale.theme).toBe("natale");
    expect(await readDatabaseFile(dataDir)).toMatchObject({
      occasions: [{ id: natale.id, name: "Natale", theme: "natale" }],
    });
    const occasions = occasionsOfMemory((await getMemory(storage, memory.id))!, await listOccasions(storage));
    expect(occasions.map((occasion) => occasion.theme)).toEqual(["natale"]);
  });

  it("default to Neutro, and can be changed when the Occasion is edited", async () => {
    const storage = openStorage(await makeDataDir());
    const valentino = await createOccasion(storage, { name: "San Valentino" });
    expect(valentino.theme).toBe("neutro");

    await updateOccasion(storage, valentino.id, { name: "San Valentino", theme: "san-valentino" });
    expect((await listOccasions(storage))[0].theme).toBe("san-valentino");

    await updateOccasion(storage, valentino.id, { name: "San Valentino" });
    expect((await listOccasions(storage))[0].theme).toBe("neutro");
  });

  it("accept the Pasqua, Viaggio and Escursione Themes", async () => {
    const dataDir = await makeDataDir();
    const storage = openStorage(dataDir);

    const pasqua = await createOccasion(storage, { name: "Pasqua", theme: "pasqua" });
    const viaggio = await createOccasion(storage, { name: "Viaggio insieme", theme: "viaggio" });
    const escursione = await createOccasion(storage, { name: "Escursione insieme" });
    await updateOccasion(storage, escursione.id, { name: "Escursione insieme", theme: "escursione" });

    expect([pasqua.theme, viaggio.theme]).toEqual(["pasqua", "viaggio"]);
    expect(await readDatabaseFile(dataDir)).toMatchObject({
      occasions: [
        { name: "Pasqua", theme: "pasqua" },
        { name: "Viaggio insieme", theme: "viaggio" },
        { name: "Escursione insieme", theme: "escursione" },
      ],
    });
  });

  it("refuse, in Italian, a Theme that doesn't exist", async () => {
    const storage = openStorage(await makeDataDir());
    await expect(createOccasion(storage, { name: "Ferragosto", theme: "ferragosto" })).rejects.toThrow(
      new GalleryError("Scegli uno dei temi della lista."),
    );
    const natale = await createOccasion(storage, { name: "Natale", theme: "natale" });
    await expect(updateOccasion(storage, natale.id, { name: "Natale", theme: "Natale" })).rejects.toThrow(
      new GalleryError("Scegli uno dei temi della lista."),
    );
    expect(await listOccasions(storage)).toEqual([natale]);
  });
});
