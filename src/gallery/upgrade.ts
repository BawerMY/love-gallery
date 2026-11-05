import type { Database } from "./types";

/** A parsed `database.json` as this version writes it, from whatever version wrote it. */
export function upgradeDatabase(raw: unknown): Database {
  return raw as Database;
}
