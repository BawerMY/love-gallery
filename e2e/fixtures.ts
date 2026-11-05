import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test as base, expect, type Page } from "@playwright/test";

export const dataDir = process.env.E2E_DATA_DIR!;
export const galleryPassword = process.env.E2E_GALLERY_PASSWORD!;

type Fixtures = {
  /** A page that has already entered the Gallery password. */
  pageWithSession: Page;
};

/**
 * Every test starts from an empty gallery: `database.json` is reset and
 * `media/` emptied before it runs. Tests may write to the data folder
 * directly to seed Memories.
 */
export const test = base.extend<Fixtures & { emptyGallery: void }>({
  emptyGallery: [
    async ({}, use) => {
      await rm(path.join(dataDir, "media"), { recursive: true, force: true });
      await writeFile(
        path.join(dataDir, "database.json"),
        JSON.stringify({ version: 1, memories: [], yearlyOccasions: [] }),
      );
      await use();
    },
    { auto: true },
  ],
  pageWithSession: async ({ page }, use) => {
    await enterGalleryPassword(page);
    await use(page);
  },
});

export async function enterGalleryPassword(page: Page, next = "/") {
  await page.goto(`/accesso?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Password").fill(galleryPassword);
  await page.getByRole("button", { name: "Entra" }).click();
  await page.waitForURL((url) => url.pathname === next);
}

type SeedMemory = {
  id: string;
  title?: string;
  note?: string;
  cities: string[];
  startDay: string;
  endDay: string;
  oneOffOccasions?: { id: string; name: string; day: string; theme?: string }[];
};

type SeedYearlyOccasion = { id: string; name: string; month: number; day: number; theme?: string };

/**
 * Writes these Memories (with no Media, and no One-off occasions unless
 * given) and Yearly occasions straight into `database.json`.
 */
export async function seedMemories(memories: SeedMemory[], yearlyOccasions: SeedYearlyOccasion[] = []) {
  await writeFile(
    path.join(dataDir, "database.json"),
    JSON.stringify({
      version: 1,
      memories: memories.map((memory) => ({ oneOffOccasions: [], ...memory, media: [] })),
      yearlyOccasions,
    }),
  );
}

/** The title page at the top of a Memory page: the element carrying its Theme in `data-theme` around the title. */
export function memoryTitlePage(page: Page) {
  return page.locator("[data-theme]").filter({ has: page.getByRole("heading", { level: 1 }) });
}

export { expect };
