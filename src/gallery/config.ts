import { openStorage, type Storage } from "./storage";
import type { SessionConfig } from "./session";

export type GalleryConfig = SessionConfig & {
  /** The data folder holding `database.json` and `media/`. */
  dataDir: string;
};

/** Reads the gallery settings from the environment, failing loudly if any is missing. */
export function readConfig(env: NodeJS.ProcessEnv = process.env): GalleryConfig {
  const missing = ["DATA_DIR", "GALLERY_PASSWORD", "SESSION_SECRET"].filter((name) => !env[name]);
  if (missing.length) {
    throw new Error(`Missing environment variable(s): ${missing.join(", ")}`);
  }
  return {
    dataDir: env.DATA_DIR!,
    galleryPassword: env.GALLERY_PASSWORD!,
    sessionSecret: env.SESSION_SECRET!,
  };
}

export type Gallery = {
  config: GalleryConfig;
  storage: Storage;
};

let current: { key: string; gallery: Gallery } | undefined;

/**
 * The gallery the running app works on, built from the environment. This is
 * what route handlers, server actions and pages pass to the core functions.
 */
export function getGallery(): Gallery {
  const config = readConfig();
  const key = JSON.stringify(config);
  if (current?.key !== key) {
    current = { key, gallery: { config, storage: openStorage(config.dataDir) } };
  }
  return current.gallery;
}
