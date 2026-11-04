import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Locator } from "@playwright/test";
import { dataDir, expect, test } from "./fixtures";

const FIXTURES = path.join(import.meta.dirname, "..", "tests", "fixtures");

/** Seeds a Memory whose ready videos (an 8-second sample) sit at these Layout rows and columns. */
async function seedVideos(cells: { id: string; column: number; row: number }[]) {
  const dir = path.join(dataDir, "media", "milano");
  await mkdir(dir, { recursive: true });
  for (const { id } of cells) {
    await copyFile(path.join(FIXTURES, "playback.mp4"), path.join(dir, `${id}.mp4`));
    await copyFile(path.join(FIXTURES, "playback-poster.webp"), path.join(dir, `${id}-poster.webp`));
  }
  const media = cells.map(({ id, column, row }) => ({
    id,
    kind: "video",
    status: "ready",
    width: 96,
    height: 64,
    cell: { column, row, width: 1, height: 1 },
    files: { display: `${id}.mp4`, thumbnail: `${id}-poster.webp` },
  }));
  await writeFile(
    path.join(dataDir, "database.json"),
    JSON.stringify({
      version: 1,
      memories: [
        { id: "milano", title: "Milano", cities: ["Milano"], startDay: "2025-03-14", endDay: "2025-03-16", oneOffOccasions: [], media },
      ],
      yearlyOccasions: [],
    }),
  );
}

const state = (video: Locator) =>
  video.evaluate((v: HTMLVideoElement) => ({ paused: v.paused, muted: v.muted, time: v.currentTime }));

test("a video plays while in view, pauses off screen and resumes muted from where it stopped", async ({
  pageWithSession: page,
}) => {
  // The second video is far down the page, so the first can be scrolled away.
  await seedVideos([
    { id: "near", column: 0, row: 0 },
    { id: "far", column: 0, row: 30 },
  ]);
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));

  await page.goto("/memories/milano");
  const video = page.getByLabel("Video 1", { exact: true });
  await expect.poll(async () => (await state(video)).time, { timeout: 10_000 }).toBeGreaterThan(0.5);
  expect((await state(video)).paused).toBe(false);
  expect((await state(video)).muted).toBe(true);

  // The far video hasn't started loading: neither its file nor its poster was asked for.
  expect(requested.filter((url) => url.includes("/far"))).toEqual([]);

  // Unmuted, then scrolled away: it pauses, keeping its position.
  await page.getByRole("button", { name: "Attiva l'audio del video 1" }).click();
  expect((await state(video)).muted).toBe(false);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(async () => (await state(video)).paused).toBe(true);
  const stoppedAt = (await state(video)).time;
  expect(stoppedAt).toBeGreaterThan(0.5);
  await page.waitForTimeout(500);
  expect((await state(video)).time).toBe(stoppedAt);

  // Now near the screen, the far video loads.
  await expect.poll(() => requested.some((url) => url.includes("/far.mp4"))).toBe(true);

  // Back on screen: it plays on from the same moment, muted.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => (await state(video)).paused).toBe(false);
  const back = await state(video);
  expect(back.time).toBeGreaterThanOrEqual(stoppedAt);
  expect(back.muted).toBe(true);
  await expect(page.getByRole("button", { name: "Attiva l'audio del video 1" })).toBeVisible();
});

test("unmuting one video mutes the one that was playing with sound", async ({ pageWithSession: page }) => {
  await seedVideos([
    { id: "a", column: 0, row: 0 },
    { id: "b", column: 1, row: 0 },
  ]);
  await page.goto("/memories/milano");
  const a = page.getByLabel("Video 1", { exact: true });
  const b = page.getByLabel("Video 2", { exact: true });

  await page.getByRole("button", { name: "Attiva l'audio del video 1" }).click();
  expect((await state(a)).muted).toBe(false);

  await page.getByRole("button", { name: "Attiva l'audio del video 2" }).click();
  await expect.poll(async () => (await state(a)).muted).toBe(true);
  expect((await state(b)).muted).toBe(false);
  await expect(page.getByRole("button", { name: "Attiva l'audio del video 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Disattiva l'audio del video 2" })).toBeVisible();

  // Muting it again leaves every video silent.
  await page.getByRole("button", { name: "Disattiva l'audio del video 2" }).click();
  await expect.poll(async () => (await state(b)).muted).toBe(true);
  expect((await state(a)).muted).toBe(true);
});
