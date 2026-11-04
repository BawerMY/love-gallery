import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * The app under test runs from a production build against a fresh temporary
 * data folder. The folder is created once in the main process and handed to
 * the workers (and to e2e/fixtures.ts) through E2E_DATA_DIR.
 */
process.env.E2E_DATA_DIR ??= mkdtempSync(path.join(tmpdir(), "love-gallery-e2e-"));
process.env.E2E_GALLERY_PASSWORD ??= "password-di-prova";

const PORT = Number(process.env.E2E_PORT ?? 3210);

export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  // One app and one data folder are shared, so tests run one at a time.
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      DATA_DIR: process.env.E2E_DATA_DIR,
      GALLERY_PASSWORD: process.env.E2E_GALLERY_PASSWORD,
      SESSION_SECRET: "segreto-di-prova-lungo-abbastanza-1234",
    },
  },
});
