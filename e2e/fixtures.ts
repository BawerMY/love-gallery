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
        JSON.stringify({ version: 2, memories: [], occasions: [] }),
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
  /** Ids from the list of Occasions, in badge order. */
  occasionIds?: string[];
  mainOccasionId?: string;
  /** Its Media items as stored in `database.json`; none unless given. */
  media?: unknown[];
};

type SeedOccasion = { id: string; name: string; theme?: string };

/**
 * Writes these Memories (with no Media and no Occasions unless given) and
 * this list of Occasions (Neutro unless given a Theme) straight into
 * `database.json`.
 */
export async function seedMemories(memories: SeedMemory[], occasions: SeedOccasion[] = []) {
  await writeFile(
    path.join(dataDir, "database.json"),
    JSON.stringify({
      version: 2,
      memories: memories.map((memory) => ({ occasionIds: [], media: [], ...memory })),
      occasions: occasions.map((occasion) => ({ theme: "neutro", ...occasion })),
    }),
  );
}

/** The title page at the top of a Memory page: the element carrying its Theme in `data-theme` around the title. */
export function memoryTitlePage(page: Page) {
  return page.locator("[data-theme]").filter({ has: page.getByRole("heading", { level: 1 }) });
}

export { expect };

/** The bar at the bottom of a Memory's Admin page, with its one Salva. */
export function saveBar(page: Page) {
  return page.getByRole("region", { name: "Salvataggio" });
}

/** Presses the one Salva of a Memory's Admin page and waits until everything is saved. */
export async function saveMemoryPage(page: Page) {
  await saveBar(page).getByRole("button", { name: "Salva", exact: true }).click();
  await expect(saveBar(page).getByRole("status")).toHaveText("Salvato");
}

/**
 * Adds Media on a Memory's Admin page the way the Curator does: by tapping
 * (or clicking, with `click`) an empty cell of the Galleria and choosing the
 * files. Without `column` and `row`, the first empty cell.
 */
export async function addMediaInCell(
  page: Page,
  files: string[],
  { column, row, click = false }: { column?: number; row?: number; click?: boolean } = {},
) {
  const name = column && row ? `Aggiungi foto e video nella colonna ${column}, riga ${row}` : /^Aggiungi foto e video nella/;
  const cell = page.getByRole("region", { name: "Galleria" }).getByRole("button", { name, exact: true }).first();
  const chooser = page.waitForEvent("filechooser");
  if (click) await cell.click();
  else await cell.tap();
  await (await chooser).setFiles(files);
}
