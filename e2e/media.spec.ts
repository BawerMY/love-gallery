import { readdir } from "node:fs/promises";
import path from "node:path";
import type { Locator } from "@playwright/test";
import { dataDir, expect, seedMemories, test } from "./fixtures";

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

  await page.getByLabel("Aggiungi foto").setInputFiles([PHOTO]);
  const uploaded = page.getByRole("listitem").filter({ has: page.getByRole("img", { name: "Foto 1" }) });
  await expect(uploaded).toBeVisible();
  await expect(uploaded).toContainText("Scattata fuori dalle date del ricordo");

  await expect(page.getByText("Date suggerite dalle foto: 14 marzo 2025")).toBeVisible();
  await page.getByRole("button", { name: "Usa queste date" }).click();
  await expect(page.getByLabel("Primo giorno")).toHaveValue("2025-03-14");
  await expect(page.getByLabel("Ultimo giorno")).toHaveValue("2025-03-14");

  await page.goto("/memories/milano");
  await expectLoadedImage(page.getByRole("img", { name: "Foto 1" }));

  await page.goto("/");
  const cover = page.getByRole("link", { name: /Milano/ }).locator("img");
  await expectLoadedImage(cover);

  await page.goto("/admin/memories/milano");
  await page.getByRole("button", { name: "Elimina foto" }).click();
  await page.getByRole("button", { name: "Sì, elimina" }).click();
  await expect(page.getByRole("img", { name: "Foto 1" })).toHaveCount(0);
  expect(await readdir(path.join(dataDir, "media", "milano"))).toEqual([]);
});

test("Media is served only with a session, and answers Range requests", async ({ pageWithSession: page, playwright, baseURL }) => {
  await seedMemories([{ id: "roma", cities: ["Roma"], startDay: "2025-03-14", endDay: "2025-03-14" }]);
  await page.goto("/admin/memories/roma");
  await page.getByLabel("Aggiungi foto").setInputFiles([PHOTO]);
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
