import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_THEME } from "./themes";
import { DATABASE_VERSION, type Database } from "./types";

/**
 * Reads and writes `database.json` inside a data folder (ADR-0002).
 *
 * - Every write runs one at a time behind a per-folder lock in this process.
 * - Each write goes to a temporary file that is then renamed over
 *   `database.json`, so a crash never leaves it half written.
 * - Nothing is cached: every read goes to disk, so the file can be inspected
 *   or edited by hand (and by tests).
 * - A file written before a field existed still loads: missing fields get
 *   their defaults when read (see `parse`), with no migration step.
 */
export type Storage = {
  readonly dataDir: string;
  /** Folder holding the processed Media files. */
  readonly mediaDir: string;
  /** Creates `database.json` (and `media/`) if missing. */
  ensure(): Promise<void>;
  read(): Promise<Database>;
  /**
   * Runs `change` on the current database inside the write lock, then saves
   * that same database. `change` makes its changes by mutating the database
   * it is given; whatever it returns is handed back to the caller and never
   * saved, so returning a database is a type error. If it throws, nothing is
   * saved and the error is passed on.
   */
  update<T = void>(change: (db: Database) => NotDatabase<T> | Promise<NotDatabase<T>>): Promise<T>;
};

/** Anything but a Database: what a `storage.update` change may hand back. */
type NotDatabase<T> = T extends Database ? never : T;

const DATABASE_FILE = "database.json";

/** One lock per data folder, shared by every Storage opened on it. */
const locks = new Map<string, Promise<unknown>>();

function withLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail = run.catch(() => undefined);
  locks.set(key, tail);
  void tail.then(() => {
    if (locks.get(key) === tail) locks.delete(key);
  });
  return run;
}

/**
 * Parses `database.json`, filling in what a file from before a change lacks:
 * an Occasion with no Theme is Neutro.
 */
function parse(text: string): Database {
  const db = JSON.parse(text) as Database;
  for (const occasion of db.yearlyOccasions) occasion.theme ??= DEFAULT_THEME;
  for (const memory of db.memories) {
    for (const occasion of memory.oneOffOccasions) occasion.theme ??= DEFAULT_THEME;
  }
  return db;
}

function emptyDatabase(): Database {
  return { version: DATABASE_VERSION, memories: [], yearlyOccasions: [] };
}

export function openStorage(dataDir: string): Storage {
  const root = path.resolve(dataDir);
  const file = path.join(root, DATABASE_FILE);
  const mediaDir = path.join(root, "media");

  async function save(db: Database): Promise<void> {
    const temp = path.join(root, `.${DATABASE_FILE}.${randomUUID()}.tmp`);
    try {
      await writeFile(temp, JSON.stringify(db, null, 2) + "\n", "utf8");
      await rename(temp, file);
    } catch (error) {
      await rm(temp, { force: true });
      throw error;
    }
  }

  async function load(): Promise<Database> {
    try {
      return parse(await readFile(file, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const db = emptyDatabase();
    await mkdir(root, { recursive: true });
    await mkdir(mediaDir, { recursive: true });
    await save(db);
    return db;
  }

  return {
    dataDir: root,
    mediaDir,
    async ensure() {
      await withLock(root, load);
    },
    async read() {
      try {
        return parse(await readFile(file, "utf8"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        return withLock(root, load);
      }
    },
    update(change) {
      return withLock(root, async () => {
        const db = await load();
        const returned = await change(db);
        await save(db);
        return returned;
      });
    },
  };
}
