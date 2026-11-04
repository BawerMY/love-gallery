import { rm } from "node:fs/promises";

/** Removes the temporary data folder the app ran against. */
export default async function globalTeardown() {
  const dir = process.env.E2E_DATA_DIR;
  if (dir) await rm(dir, { recursive: true, force: true });
}
