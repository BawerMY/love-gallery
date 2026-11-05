import type { Page } from "@playwright/test";
import { enterGalleryPassword, expect, seedMemories, test } from "./fixtures";

const topBar = (page: Page) => page.getByRole("link", { name: /Giulia.*Bawer/ });

function distanceFromBottom(page: Page) {
  return page.evaluate(() => document.documentElement.scrollHeight - window.scrollY - window.innerHeight);
}

async function seedTwelveMemories() {
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
}

test("tapping the top bar on the Timeline scrolls back to the newest Memory", async ({
  pageWithSession: page,
}) => {
  await seedTwelveMemories();
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Ricordo 12/ })).toBeInViewport();

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.getByRole("link", { name: /Ricordo 12/ })).not.toBeInViewport();

  await topBar(page).click();
  await expect.poll(() => distanceFromBottom(page)).toBeLessThanOrEqual(1);
  await expect(page.getByRole("link", { name: /Ricordo 12/ })).toBeInViewport();
  await expect(page).toHaveURL(/\/$/);
});

test("tapping the top bar on a Memory page lands on the Timeline at the bottom", async ({
  pageWithSession: page,
}) => {
  await seedTwelveMemories();
  await page.goto("/memories/m0");
  await expect(page.getByRole("heading", { name: "Ricordo 1" })).toBeVisible();

  await topBar(page).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: /Ricordo 12/ })).toBeInViewport();
  await expect.poll(() => distanceFromBottom(page)).toBeLessThanOrEqual(1);
});

test("the top bar never covers the first thing on a page", async ({ pageWithSession: page }) => {
  await seedTwelveMemories();
  await page.goto("/memories/m0");
  const bar = await page.getByRole("banner").boundingBox();
  const back = await page.getByRole("link", { name: "Torna alla galleria" }).boundingBox();
  expect(back!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height);
});

test("the top bar is absent on the password screen and the Admin page", async ({ page }) => {
  await page.goto("/accesso");
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(topBar(page)).toHaveCount(0);

  await enterGalleryPassword(page, "/admin");
  await expect(page.getByRole("link", { name: "Nuovo ricordo" })).toBeVisible();
  await expect(topBar(page)).toHaveCount(0);
});
