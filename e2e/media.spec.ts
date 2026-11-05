import { readdir } from "node:fs/promises";
import path from "node:path";
import type { Locator } from "@playwright/test";
import { addMediaInCell, dataDir, expect, saveBar, saveMemoryPage, seedMemories, test } from "./fixtures";
import { mouseDrag } from "./gestures";

const PHOTO = path.join(import.meta.dirname, "..", "tests", "fixtures", "gps-rotated.jpg");

async function expectLoadedImage(image: Locator) {
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
}

test("the Curator uploads a photo, sees it on the Memory page and as the Timeline cover, then deletes it", async ({
  pageWithSession: page,
}) => {
  // The photo was taken on 14 March, a day before this Memory's Date range.
  await seedMemories([
    { id: "milano", title: "Milano", cities: ["Milano"], startDay: "2025-03-15", endDay: "2025-03-16" },
  ]);
  await page.goto("/admin/memories/milano");

  // Tapping an empty cell of the Galleria picks the files; the photo lands in that cell.
  const galleria = page.getByRole("region", { name: "Galleria" });
  await addMediaInCell(page, [PHOTO], { column: 2, row: 2 });
  await expect(galleria.getByRole("group", { name: "Foto 1, 1×1, colonna 2, riga 2" })).toBeVisible();
  await expect(galleria.getByRole("img", { name: "Foto 1" })).toBeVisible();
  await expect(galleria.getByText("Foto 1: scattata fuori dalle date del ricordo")).toBeVisible();

  await expect(page.getByText("Date suggerite dalle foto: 14 marzo 2025")).toBeVisible();
  await page.getByRole("button", { name: "Usa queste date" }).click();
  await expect(page.getByLabel("Primo giorno")).toHaveValue("2025-03-14");
  await expect(page.getByLabel("Ultimo giorno")).toHaveValue("2025-03-14");
  await saveMemoryPage(page);

  await page.goto("/memories/milano");
  await expectLoadedImage(page.getByRole("img", { name: "Foto 1" }));

  await page.goto("/");
  const cover = page.getByRole("link", { name: /Milano/ }).locator("img");
  await expectLoadedImage(cover);

  // The ✕ on the tile asks first; "Annulla" keeps it.
  await page.goto("/admin/memories/milano");
  await page.getByRole("button", { name: "Elimina foto 1" }).tap();
  const confirm = page.getByRole("alertdialog", { name: "Elimina foto 1" });
  await expect(confirm).toContainText("Eliminare questa foto? Non si può annullare.");
  await confirm.getByRole("button", { name: "Annulla" }).tap();
  await expect(confirm).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Foto 1" })).toBeVisible();
  await page.getByRole("button", { name: "Elimina foto 1" }).click();
  await confirm.getByRole("button", { name: "Sì, elimina" }).click();
  await expect(page.getByRole("img", { name: "Foto 1" })).toHaveCount(0);
  expect(await readdir(path.join(dataDir, "media", "milano"))).toEqual([]);
});

test("Media is served only with a session, and answers Range requests", async ({ pageWithSession: page, playwright, baseURL }) => {
  await seedMemories([{ id: "roma", cities: ["Roma"], startDay: "2025-03-14", endDay: "2025-03-14" }]);
  await page.goto("/admin/memories/roma");
  await addMediaInCell(page, [PHOTO], { click: true });
  await expect(page.getByRole("img", { name: "Foto 1" })).toBeVisible();
  const src = (await page.getByRole("img", { name: "Foto 1" }).getAttribute("src"))!;

  const ranged = await page.request.get(src, { headers: { Range: "bytes=0-9" } });
  expect(ranged.status()).toBe(206);
  expect((await ranged.body()).length).toBe(10);
  expect(ranged.headers()["content-range"]).toMatch(/^bytes 0-9\/\d+$/);

  const anonymous = await playwright.request.newContext({ baseURL });
  expect((await anonymous.get(src)).status()).toBe(401);
  const upload = await anonymous.post("/api/upload/roma", { multipart: { files: { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from("x") } } });
  expect(upload.status()).toBe(401);
  await anonymous.dispose();
});

test("an upload to a Memory that doesn't exist is refused with 404", async ({ pageWithSession: page }) => {
  const response = await page.request.post("/api/upload/nessuno", {
    multipart: { files: { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from("x") } },
  });
  expect(response.status()).toBe(404);
  expect(await response.json()).toEqual({ error: "Questo ricordo non esiste più." });
});

test("several files chosen from one cell fill it and then the next free cells, around the unsaved Layout, which survives", async ({
  pageWithSession: page,
}) => {
  await seedMemories([{ id: "milano", title: "Milano", cities: ["Milano"], startDay: "2025-03-14", endDay: "2025-03-14" }]);
  await page.goto("/admin/memories/milano");
  const galleria = page.getByRole("region", { name: "Galleria" });
  await addMediaInCell(page, [PHOTO, PHOTO], { click: true });
  await expect(galleria.getByRole("group", { name: "Foto 2, 1×1, colonna 2, riga 1" })).toBeVisible();

  // Foto 1 goes down a row, not saved yet.
  const pitch = (await galleria.getByRole("group", { name: /^Foto 1,/ }).boundingBox())!.width + 4;
  await mouseDrag(page, galleria.getByRole("button", { name: "Sposta foto 1" }), 0, pitch);
  await expect(galleria.getByRole("group", { name: "Foto 1, 1×1, colonna 1, riga 2" })).toBeVisible();

  // Three photos into the last cell of the first row: there, then past Foto 1's new place.
  await addMediaInCell(page, [PHOTO, PHOTO, PHOTO], { column: 3, row: 1 });
  await expect(galleria.getByRole("group", { name: /^Foto 5,/ })).toBeVisible();
  await expect(galleria.getByRole("group", { name: "Foto 3, 1×1, colonna 3, riga 1" })).toBeVisible();
  await expect(galleria.getByRole("group", { name: "Foto 4, 1×1, colonna 2, riga 2" })).toBeVisible();
  await expect(galleria.getByRole("group", { name: "Foto 5, 1×1, colonna 3, riga 2" })).toBeVisible();
  await expect(galleria.getByRole("group", { name: "Foto 1, 1×1, colonna 1, riga 2" })).toBeVisible();
  await expect(saveBar(page).getByRole("status")).toHaveText("Modifiche non salvate");
  // Below the Layout there is always an empty row to tap.
  await expect(galleria.getByRole("button", { name: "Aggiungi foto e video nella colonna 1, riga 3" })).toBeVisible();
});
