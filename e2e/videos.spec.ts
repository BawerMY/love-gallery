import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { dataDir, expect, test } from "./fixtures";

const FIXTURES = path.join(import.meta.dirname, "..", "tests", "fixtures");

const MEMORY = { id: "milano", title: "Milano", cities: ["Milano"], startDay: "2025-03-14", endDay: "2025-03-16", occasionIds: [] };

async function seedMedia(media: unknown[]) {
  await writeFile(
    path.join(dataDir, "database.json"),
    JSON.stringify({ version: 2, memories: [{ ...MEMORY, media }], occasions: [] }),
  );
}

function video(status: "processing" | "ready") {
  return {
    id: "v1",
    kind: "video",
    status,
    width: status === "ready" ? 96 : 0,
    height: status === "ready" ? 64 : 0,
    cell: { column: 0, row: 0, width: 1, height: 1 },
    files: { display: "v1.mp4", thumbnail: "v1-poster.webp" },
  };
}

test("the Curator uploads a video, which plays on the Memory page with its poster once converted", async ({
  pageWithSession: page,
}) => {
  await seedMedia([]);
  await page.goto("/admin/memories/milano");

  await page.getByLabel("Aggiungi foto e video").setInputFiles([path.join(FIXTURES, "sample.mov")]);
  const poster = page.getByRole("img", { name: "Video 1" });
  await expect(poster).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("In elaborazione")).toHaveCount(0);

  await page.goto("/memories/milano");
  const player = page.locator("video");
  await expect(player).toHaveCount(1);
  await expect(player).toHaveAttribute("aria-label", "Video 1");
  const posterSrc = (await player.getAttribute("poster"))!;
  const src = (await player.getAttribute("src"))!;
  expect((await page.request.get(posterSrc)).headers()["content-type"]).toBe("image/webp");
  const served = await page.request.get(src, { headers: { Range: "bytes=0-99" } });
  expect(served.status()).toBe(206);
  expect(served.headers()["content-type"]).toBe("video/mp4");

  // The Timeline card shows the poster.
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Milano/ }).locator("img")).toHaveAttribute("src", posterSrc);
});

test("a video still processing shows only on the Admin page, which refreshes until it is ready", async ({
  pageWithSession: page,
}) => {
  await seedMedia([video("processing")]);

  await page.goto("/memories/milano");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);

  await page.goto("/admin/memories/milano");
  await expect(page.getByText("In elaborazione")).toBeVisible();

  // The background conversion finishes; the page notices without a reload.
  await seedMedia([video("ready")]);
  await expect(page.getByText("In elaborazione")).toHaveCount(0, { timeout: 10_000 });
  await expect(page.getByRole("img", { name: "Video 1" })).toBeVisible();
});

test("a video that can't be converted shows as failed and can be deleted", async ({ pageWithSession: page }) => {
  await seedMedia([]);
  await page.goto("/admin/memories/milano");

  await page.getByLabel("Aggiungi foto e video").setInputFiles([path.join(FIXTURES, "corrupt.mov")]);
  await expect(page.getByText("Conversione non riuscita")).toBeVisible({ timeout: 20_000 });

  await page.goto("/memories/milano");
  await expect(page.locator("video")).toHaveCount(0);

  await page.goto("/admin/memories/milano");
  await page.getByRole("button", { name: "Elimina video" }).click();
  await page.getByRole("button", { name: "Sì, elimina" }).click();
  await expect(page.getByText("Conversione non riuscita")).toHaveCount(0);
  expect(await readdir(path.join(dataDir, "media", "milano"))).toEqual([]);
  expect(await readdir(path.join(dataDir, "processing"))).toEqual([]);
});
