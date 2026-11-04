import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { dataDir, expect, seedMemories, test } from "./fixtures";

test("the Curator creates a Memory in the Admin page and finds it on the Timeline", async ({
  loggedInPage: page,
}) => {
  await seedMemories([
    { id: "vecchio", cities: ["Bergamo"], startDay: "2025-01-04", endDay: "2025-01-06" },
  ]);
  await page.goto("/admin");
  await page.getByRole("link", { name: "Nuovo ricordo" }).click();

  await page.getByLabel("Titolo").fill("Primo weekend");
  await page.getByLabel("Città 1", { exact: true }).fill("Milano");
  await page.getByRole("button", { name: "Aggiungi città" }).click();
  await page.getByLabel("Città 2", { exact: true }).fill("Bergamo");
  await expect(page.locator("#city-suggestions option")).toHaveAttribute("value", "Bergamo");
  await page.getByLabel("Primo giorno").fill("2025-03-14");
  await page.getByLabel("Ultimo giorno").fill("2025-03-16");
  await page.getByLabel("Nota").fill("Pioveva, ma che importa.");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByText("Ricordo salvato.")).toBeVisible();

  await page.goto("/");
  const card = page.getByRole("link", { name: /Primo weekend/ });
  await expect(card).toContainText("Milano · Bergamo");
  await expect(card).toContainText("14–16 marzo 2025");
  await expect(page.getByText("66 giorni di distanza")).toBeVisible();

  await card.click();
  await expect(page.getByRole("heading", { name: "Primo weekend" })).toBeVisible();
  await expect(page.getByText("Milano · Bergamo")).toBeVisible();
  await expect(page.getByText("14–16 marzo 2025")).toBeVisible();
  await expect(page.getByText("Pioveva, ma che importa.")).toBeVisible();
});

test("refuses, in Italian, a Date range that overlaps another Memory", async ({
  loggedInPage: page,
}) => {
  await seedMemories([
    { id: "natale", title: "Natale", cities: ["Roma"], startDay: "2025-12-23", endDay: "2025-12-27" },
  ]);
  await page.goto("/admin/memories/new");

  await page.getByLabel("Città 1", { exact: true }).fill("Milano");
  await page.getByLabel("Primo giorno").fill("2025-12-27");
  await page.getByLabel("Ultimo giorno").fill("2025-12-29");
  await page.getByRole("button", { name: "Salva" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Le date si sovrappongono a «Natale»" })).toBeVisible();
  await expect(page.getByLabel("Città 1", { exact: true })).toHaveValue("Milano");
});

test("the Curator edits a Memory, then deletes it after confirming, with its media folder", async ({
  loggedInPage: page,
}) => {
  await seedMemories([
    { id: "pasqua", title: "Pasqua", cities: ["Roma"], startDay: "2025-04-18", endDay: "2025-04-21" },
  ]);
  await mkdir(path.join(dataDir, "media", "pasqua"), { recursive: true });
  await writeFile(path.join(dataDir, "media", "pasqua", "foto.webp"), "x");

  await page.goto("/admin");
  await page.getByRole("link", { name: /Pasqua/ }).click();
  await page.getByLabel("Titolo").fill("Pasqua a Roma");
  await page.getByRole("button", { name: "Salva" }).click();
  await expect(page.getByText("Ricordo salvato.")).toBeVisible();

  await page.getByRole("button", { name: "Elimina ricordo" }).click();
  await page.getByRole("button", { name: "Annulla" }).click();
  await page.getByRole("button", { name: "Elimina ricordo" }).click();
  await page.getByRole("button", { name: "Sì, elimina" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Pasqua a Roma")).toHaveCount(0);
  expect(await readdir(path.join(dataDir, "media"))).toEqual([]);
});

test("the Timeline opens scrolled to the newest Memory at the bottom", async ({
  loggedInPage: page,
}) => {
  await seedMemories(
    Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, "0");
      return {
        id: `m${i}`,
        title: `Ricordo ${i + 1}`,
        cities: ["Roma"],
        startDay: `2025-${month}-01`,
        endDay: `2025-${month}-03`,
      };
    }),
  );

  await page.goto("/");

  await expect(page.getByRole("link", { name: /Ricordo 12/ })).toBeInViewport();
  await expect(page.getByRole("link", { name: /Ricordo 1\b/ })).not.toBeInViewport();
  const distanceFromBottom = await page.evaluate(
    () => document.documentElement.scrollHeight - window.scrollY - window.innerHeight,
  );
  expect(distanceFromBottom).toBeLessThanOrEqual(1);

  await page.getByRole("link", { name: /Ricordo 12/ }).click();
  await page.getByRole("link", { name: "Torna alla galleria" }).click();
  await expect(page.getByRole("link", { name: /Ricordo 12/ })).toBeInViewport();
  await expect(page.getByRole("link", { name: /Ricordo 1\b/ })).not.toBeInViewport();
});
