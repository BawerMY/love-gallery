import path from "node:path";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import type { Locator, Page } from "@playwright/test";
import { dataDir, expect, seedMemories, test } from "./fixtures";

const PHOTO = path.join(import.meta.dirname, "..", "tests", "fixtures", "gps-rotated.jpg");

async function centre(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = (await locator.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Drags with the mouse, in small steps like a hand would. */
async function mouseDrag(page: Page, handle: Locator, dx: number, dy: number) {
  const start = await centre(handle);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + dx, start.y + dy, { steps: 8 });
  await page.mouse.up();
}

/** Drags with a finger: real touch events, which the browser turns into touch pointer events. */
async function touchDrag(page: Page, handle: Locator, dx: number, dy: number) {
  const start = await centre(handle);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
  for (let step = 1; step <= 8; step++) {
    const point = { x: start.x + (dx * step) / 8, y: start.y + (dy * step) / 8 };
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

async function savedCells() {
  const db = JSON.parse(await readFile(path.join(dataDir, "database.json"), "utf8"));
  return db.memories[0].media.map((item: { cell: unknown }) => item.cell);
}

const FIXTURES = path.join(import.meta.dirname, "..", "tests", "fixtures");

type SeedItem = { id: string; kind: "photo" | "video"; status: "processing" | "ready"; column: number; row: number };

/** Writes the "milano" Memory with these 1×1 Media items, and the files of the ready ones. */
async function seedMedia(items: SeedItem[]) {
  const dir = path.join(dataDir, "media", "milano");
  await mkdir(dir, { recursive: true });
  for (const item of items) {
    if (item.status !== "ready") continue;
    await copyFile(path.join(FIXTURES, "playback-poster.webp"), path.join(dir, `${item.id}-thumb.webp`));
    await copyFile(path.join(FIXTURES, item.kind === "video" ? "playback.mp4" : "playback-poster.webp"), path.join(dir, `${item.id}.media`));
  }
  const media = items.map(({ id, kind, status, column, row }) => ({
    id,
    kind,
    status,
    width: status === "ready" ? 96 : 0,
    height: status === "ready" ? 64 : 0,
    cell: { column, row, width: 1, height: 1 },
    files: { display: `${id}.media`, thumbnail: `${id}-thumb.webp` },
  }));
  await writeFile(
    path.join(dataDir, "database.json"),
    JSON.stringify({
      version: 1,
      memories: [
        { id: "milano", title: "Milano", cities: ["Milano"], startDay: "2025-03-14", endDay: "2025-03-14", oneOffOccasions: [], media },
      ],
      yearlyOccasions: [],
    }),
  );
}

test("unsaved Layout changes survive a video becoming ready and new Media arriving", async ({ pageWithSession: page }) => {
  await seedMedia([
    { id: "photo", kind: "photo", status: "ready", column: 0, row: 0 },
    { id: "video", kind: "video", status: "processing", column: 1, row: 0 },
  ]);
  await page.goto("/admin/memories/milano");
  const editor = page.getByRole("region", { name: "Disposizione" });
  await expect(editor.getByText("In preparazione")).toBeVisible();
  const pitch = (await editor.getByRole("group", { name: /^Foto 1,/ }).boundingBox())!.width + 4;

  // Foto 1 goes down a row, not saved yet.
  await mouseDrag(page, editor.getByRole("button", { name: "Sposta foto 1" }), 0, pitch);
  await expect(editor.getByRole("group", { name: "Foto 1, 1×1, colonna 1, riga 2" })).toBeVisible();

  // Meanwhile the video becomes ready, and a new photo arrives where the core
  // puts it: right below the saved Layout, the very cell Foto 1 was moved to.
  await seedMedia([
    { id: "photo", kind: "photo", status: "ready", column: 0, row: 0 },
    { id: "video", kind: "video", status: "ready", column: 1, row: 0 },
    { id: "new", kind: "photo", status: "ready", column: 0, row: 1 },
  ]);
  await expect(editor.getByRole("group", { name: /^Foto 3,/ })).toBeVisible({ timeout: 10_000 });
  await expect(editor.getByText("In preparazione")).toHaveCount(0);

  // The move is still there and unsaved; the new photo went below it instead.
  await expect(editor.getByRole("group", { name: "Foto 1, 1×1, colonna 1, riga 2" })).toBeVisible();
  await expect(editor.getByRole("group", { name: "Foto 3, 1×1, colonna 1, riga 3" })).toBeVisible();
  await expect(editor.getByText("Modifiche non salvate.")).toBeVisible();

  await editor.getByRole("button", { name: "Salva disposizione" }).click();
  await expect(editor.getByText("Disposizione salvata.")).toBeVisible();
  expect(await savedCells()).toEqual([
    { column: 0, row: 1, width: 1, height: 1 },
    { column: 1, row: 0, width: 1, height: 1 },
    { column: 0, row: 2, width: 1, height: 1 },
  ]);
});

test("the Curator moves a photo by touch, resizes one with the mouse, saves, and the Memory page shows that Layout", async ({
  pageWithSession: page,
}) => {
  await seedMemories([
    { id: "milano", title: "Milano", cities: ["Milano"], startDay: "2025-03-14", endDay: "2025-03-14" },
  ]);
  await page.goto("/admin/memories/milano");
  await page.getByLabel("Aggiungi foto").setInputFiles([PHOTO, PHOTO]);
  await expect(page.getByRole("img", { name: "Foto 2" })).toBeVisible();

  const editor = page.getByRole("region", { name: "Disposizione" });
  const pitch = (await editor.getByRole("group", { name: /^Foto 1,/ }).boundingBox())!.width + 4;

  // Foto 2 goes down a row with a finger, leaving the cell beside Foto 1 empty…
  await touchDrag(page, editor.getByRole("button", { name: "Sposta foto 2" }), 0, pitch);
  await expect(editor.getByRole("group", { name: "Foto 2, 1×1, colonna 2, riga 2" })).toBeVisible();
  // …so Foto 1 can grow into it with the mouse. Growing again would overlap Foto 2 and is refused.
  await mouseDrag(page, editor.getByRole("button", { name: "Ridimensiona foto 1" }), pitch, 0);
  await expect(editor.getByRole("group", { name: "Foto 1, 2×1, colonna 1, riga 1" })).toBeVisible();
  await mouseDrag(page, editor.getByRole("button", { name: "Ridimensiona foto 1" }), 0, pitch);
  await expect(editor.getByRole("group", { name: "Foto 1, 2×1, colonna 1, riga 1" })).toBeVisible();

  await editor.getByRole("button", { name: "Salva disposizione" }).click();
  await expect(editor.getByText("Disposizione salvata.")).toBeVisible();
  expect(await savedCells()).toEqual([
    { column: 0, row: 0, width: 2, height: 1 },
    { column: 1, row: 1, width: 1, height: 1 },
  ]);

  // Foto 2 becomes the cover of the Timeline card.
  await editor.getByRole("button", { name: "Usa foto 2 come copertina" }).click();
  await expect(editor.getByRole("button", { name: "Usa foto 2 come copertina" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.goto("/memories/milano");
  const first = (await page.getByRole("img", { name: "Foto 1" }).boundingBox())!;
  const second = (await page.getByRole("img", { name: "Foto 2" }).boundingBox())!;
  // Foto 1 spans two square columns; Foto 2 sits in the second column of the row below.
  expect(first.width).toBeGreaterThan(first.height * 1.9);
  expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  expect(Math.abs(second.x - (first.x + first.width / 2 + 2))).toBeLessThan(3);

  const db = JSON.parse(await readFile(path.join(dataDir, "database.json"), "utf8"));
  const secondDisplay = db.memories[0].media[1].files.display;
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Milano/ }).locator("img")).toHaveAttribute(
    "src",
    new RegExp(secondDisplay),
  );
});
