import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test as base, expect, type Page } from "@playwright/test";

export const dataDir = process.env.E2E_DATA_DIR!;
export const galleryPassword = process.env.E2E_GALLERY_PASSWORD!;

type Fixtures = {
  /** A page that has already entered the Gallery password. */
  loggedInPage: Page;
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
  loggedInPage: async ({ page }, use) => {
    await logIn(page);
    await use(page);
  },
});

export async function logIn(page: Page, next = "/") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
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
};

/** Writes these Memories (with no Media or Occasions) straight into `database.json`. */
export async function seedMemories(memories: SeedMemory[]) {
  await writeFile(
    path.join(dataDir, "database.json"),
    JSON.stringify({
      version: 1,
      memories: memories.map((memory) => ({ ...memory, oneOffOccasions: [], media: [] })),
      yearlyOccasions: [],
    }),
  );
}

export { expect };
