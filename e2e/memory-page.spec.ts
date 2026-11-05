import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Locator } from "@playwright/test";
import { dataDir, expect, memoryTitlePage, test } from "./fixtures";

const FIXTURES = path.join(import.meta.dirname, "..", "tests", "fixtures");

/** Seeds a Christmas Memory, with a Capodanno and a Natale Occasion and one ready photo. */
async function seedChristmasMemory() {
  const dir = path.join(dataDir, "media", "inverno");
  await mkdir(dir, { recursive: true });
  await copyFile(path.join(FIXTURES, "playback-poster.webp"), path.join(dir, "foto.webp"));
  await writeFile(
    path.join(dataDir, "database.json"),
    JSON.stringify({
      version: 1,
      memories: [
        {
          id: "inverno",
          title: "Natale a Torino",
          note: "Il panettone più buono",
          cities: ["Torino", "Asti"],
          startDay: "2025-12-24",
          endDay: "2026-01-02",
          oneOffOccasions: [],
          media: [
            {
              id: "foto",
              kind: "photo",
              status: "ready",
              width: 96,
              height: 64,
              cell: { column: 0, row: 0, width: 1, height: 1 },
              files: { display: "foto.webp", thumbnail: "foto.webp" },
            },
          ],
        },
      ],
      yearlyOccasions: [
        { id: "natale", name: "Natale", month: 12, day: 25, theme: "natale" },
        { id: "capodanno", name: "Capodanno", month: 1, day: 1, theme: "capodanno" },
      ],
    }),
  );
}

const opacityOf = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).opacity);

test("a Memory opens with a title page in the Theme of its Main occasion", async ({ pageWithSession: page }) => {
  await seedChristmasMemory();
  await page.goto("/memories/inverno");

  const header = memoryTitlePage(page);
  await expect(header).toHaveAttribute("data-theme", "natale");
  await expect(header.getByRole("heading", { level: 1 })).toHaveText("Natale a Torino");
  await expect(header).toContainText("Torino · Asti");
  await expect(header).toContainText("“Il panettone più buono”");
  await expect(header.getByRole("listitem")).toHaveText(["Natale", "Capodanno"]);
});

test("Media tiles fade in as they first scroll into view", async ({ pageWithSession: page }) => {
  await seedChristmasMemory();
  // A short screen, so the grid starts below the title page.
  await page.setViewportSize({ width: 412, height: 240 });
  await page.goto("/memories/inverno");
  const tile = page.getByRole("img", { name: "Foto 1" });
  const cell = page.getByRole("listitem").filter({ has: tile });

  await expect.poll(() => opacityOf(cell)).toBe("0");
  await tile.scrollIntoViewIfNeeded();
  await expect.poll(() => opacityOf(cell)).toBe("1");
});

test("with reduced motion, Media tiles show straight away", async ({ pageWithSession: page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedChristmasMemory();
  await page.setViewportSize({ width: 412, height: 240 });
  await page.goto("/memories/inverno");
  const cell = page.getByRole("listitem").filter({ has: page.getByRole("img", { name: "Foto 1" }) });

  await expect.poll(() => opacityOf(cell)).toBe("1");
});
