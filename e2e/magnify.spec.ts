import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Locator, Page } from "@playwright/test";
import { dataDir, expect, test } from "./fixtures";

const FIXTURES = path.join(import.meta.dirname, "..", "tests", "fixtures");

/** Seeds a Memory with a ready photo in the first cell and a ready 8-second video in the second. */
async function seedPhotoAndVideo() {
  const dir = path.join(dataDir, "media", "milano");
  await mkdir(dir, { recursive: true });
  await copyFile(path.join(FIXTURES, "playback-poster.webp"), path.join(dir, "foto.webp"));
  await copyFile(path.join(FIXTURES, "playback.mp4"), path.join(dir, "clip.mp4"));
  await copyFile(path.join(FIXTURES, "playback-poster.webp"), path.join(dir, "clip-poster.webp"));
  const media = [
    {
      id: "foto",
      kind: "photo",
      status: "ready",
      width: 96,
      height: 64,
      cell: { column: 0, row: 0, width: 1, height: 1 },
      files: { display: "foto.webp", thumbnail: "foto.webp" },
    },
    {
      id: "clip",
      kind: "video",
      status: "ready",
      width: 96,
      height: 64,
      cell: { column: 1, row: 0, width: 1, height: 1 },
      files: { display: "clip.mp4", thumbnail: "clip-poster.webp" },
    },
  ];
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

/** Drives a raw touch through the DevTools protocol: down at `from`, through `moves`, held for `holdMs`, then up. */
async function touch(
  page: Page,
  from: { x: number; y: number },
  { moves = [], holdMs = 0 }: { moves?: { x: number; y: number }[]; holdMs?: number } = {},
) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [from] });
  let last = from;
  for (const point of moves) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
    last = point;
    await page.waitForTimeout(16);
  }
  if (holdMs) await page.waitForTimeout(holdMs);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
  return last;
}

async function centreOf(locator: Locator) {
  const box = (await locator.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

const longPress = async (page: Page, locator: Locator) => touch(page, await centreOf(locator), { holdMs: 700 });

const state = (video: Locator) =>
  video.evaluate((v: HTMLVideoElement) => ({ paused: v.paused, muted: v.muted, time: v.currentTime }));

test("a quick tap opens nothing; a long press or a mouse click magnifies; Esc, the backdrop and ✕ close it", async ({
  pageWithSession: page,
}) => {
  await seedPhotoAndVideo();
  await page.goto("/memories/milano");
  const photo = page.getByRole("img", { name: "Foto 1", exact: true });
  const modal = page.getByRole("dialog");

  await photo.tap();
  await page.waitForTimeout(800);
  await expect(modal).toHaveCount(0);

  // A touch that moves is not a press, even if held.
  const start = await centreOf(photo);
  await touch(page, start, { moves: [{ x: start.x, y: start.y + 30 }], holdMs: 700 });
  await expect(modal).toHaveCount(0);

  await longPress(page, photo);
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("img", { name: "Foto 1", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);

  await longPress(page, photo);
  await expect(modal).toBeVisible();
  const viewport = page.viewportSize()!;
  await page.touchscreen.tap(10, viewport.height - 10);
  await expect(modal).toHaveCount(0);

  await photo.click();
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: "Chiudi" }).click();
  await expect(modal).toHaveCount(0);

  // A long press doesn't select text or start a drag.
  expect(await page.evaluate(() => getSelection()?.toString() ?? "")).toBe("");
});

test("a magnified video goes on from the grid's moment with its mute state, seeks by its progress bar and hands back its position", async ({
  pageWithSession: page,
}) => {
  await seedPhotoAndVideo();
  await page.goto("/memories/milano");
  const grid = page.getByLabel("Video 2", { exact: true }).first();
  await expect.poll(async () => (await state(grid)).time, { timeout: 10_000 }).toBeGreaterThan(1.5);
  await page.getByRole("button", { name: "Attiva l'audio del video 2" }).click();

  const before = (await state(grid)).time;
  await longPress(page, grid);
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  const big = modal.getByLabel("Video 2", { exact: true });
  await expect.poll(async () => (await state(big)).paused).toBe(false);
  const opened = await state(big);
  expect(opened.muted).toBe(false);
  expect(Math.abs(opened.time - before)).toBeLessThan(1.5);
  expect((await state(grid)).paused).toBe(true);

  // Drag the progress bar to three quarters of the 8-second video.
  const bar = modal.getByRole("slider", { name: "Avanzamento del video" });
  const box = (await bar.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.1, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, y, { steps: 5 });
  await page.mouse.move(box.x + box.width * 0.75, y, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await state(big)).time).toBeGreaterThan(5.5);
  const seeked = (await state(big)).time;
  expect(seeked).toBeLessThan(7.5);

  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect.poll(async () => (await state(grid)).paused).toBe(false);
  const back = await state(grid);
  expect(back.time).toBeGreaterThanOrEqual(seeked - 0.5);
  expect(back.muted).toBe(false);
});

test("unmuting a magnified video holds even when its grid tile is mostly off screen", async ({ pageWithSession: page }) => {
  await seedPhotoAndVideo();
  await page.goto("/memories/milano");
  // Room to scroll, so the grid video can sit with only a sliver of its
  // bottom showing below the top bar.
  await page.addStyleTag({ content: "body { padding-bottom: 200vh; }" });
  const grid = page.getByLabel("Video 2", { exact: true }).first();
  await expect.poll(async () => (await state(grid)).paused, { timeout: 10_000 }).toBe(false);
  const box = (await grid.boundingBox())!;
  const bar = (await page.getByRole("banner").boundingBox())!;
  await page.evaluate((y) => window.scrollBy(0, y), box.y + box.height - 12 - (bar.y + bar.height));
  await expect.poll(async () => (await state(grid)).paused).toBe(true);

  const visible = (await grid.boundingBox())!;
  await page.mouse.click(visible.x + visible.width / 2, visible.y + visible.height - 5);
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: "Attiva l'audio del video 2" }).click();

  const big = modal.getByLabel("Video 2", { exact: true });
  await page.waitForTimeout(500);
  expect((await state(big)).muted).toBe(false);
  await expect(modal.getByRole("button", { name: "Disattiva l'audio del video 2" })).toBeVisible();
});

test("a swipe down closes the modal", async ({ pageWithSession: page }) => {
  await seedPhotoAndVideo();
  await page.goto("/memories/milano");
  await longPress(page, page.getByRole("img", { name: "Foto 1", exact: true }));
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();

  const { x, y } = await centreOf(modal.getByRole("img", { name: "Foto 1", exact: true }));
  await touch(page, { x, y }, { moves: [1, 2, 3, 4, 5, 6].map((step) => ({ x, y: y + step * 30 })) });
  await expect(modal).toHaveCount(0);
});
