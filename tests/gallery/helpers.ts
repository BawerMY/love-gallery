import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach } from "vitest";

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
