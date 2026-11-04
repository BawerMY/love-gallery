import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach } from "vitest";
import type { Storage, Upload } from "@/gallery";

/** The tiny sample media files in `tests/fixtures/`. */
export const FIXTURES = path.join(import.meta.dirname, "..", "fixtures");

/** Puts a copy of a sample file where an upload would land, as the Curator's phone named it. */
export async function upload(storage: Storage, fixture: string, fileName = fixture): Promise<Upload> {
  const dir = path.join(storage.dataDir, "incoming");
  await mkdir(dir, { recursive: true });
  const target = path.join(dir, `${Math.random().toString(36).slice(2)}-${fileName}`);
  await copyFile(path.join(FIXTURES, fixture), target);
  return { path: target, fileName };
}

const created: string[] = [];

/**
 * Creates an empty temporary data folder (what `DATA_DIR` points at) that is
 * removed after the current test.
 */
export async function makeDataDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "love-gallery-test-"));
  created.push(dir);
  return dir;
}

/** Reads and parses `database.json` straight from disk. */
export async function readDatabaseFile(dataDir: string): Promise<unknown> {
  return JSON.parse(await readFile(path.join(dataDir, "database.json"), "utf8"));
}

afterEach(async () => {
  while (created.length) {
    await rm(created.pop()!, { recursive: true, force: true });
  }
});
