/**
 * The shape of `database.json` (see spec "Data shape" and ADR-0002).
 * Later tickets fill in the Memory, Media item and Yearly occasion fields.
 */

import type { Day } from "./days";
import type { ThemeKey } from "./themes";

export type { Day };

export type OneOffOccasion = {
  id: string;
  name: string;
  day: Day;
  /** Neutro when missing from `database.json` (see `openStorage`). */
  theme: ThemeKey;
};

export type MediaCell = {
  column: number;
  row: number;
  width: number;
  height: number;
};

export type MediaItem = {
  id: string;
  kind: "photo" | "video";
  status: "processing" | "ready" | "failed";
  /**
   * When the photo or video was taken, if known: the wall-clock time where it
   * was taken plus that place's UTC offset, e.g. `2025-03-14T18:30:05+01:00`
   * (see `normalizeCaptureTime`).
   */
  capturedAt?: string;
  width: number;
  height: number;
  cell: MediaCell;
  /** Names of the processed files inside the Memory's folder in `media/`. */
  files: MediaFiles;
};

/**
 * The processed files of a Media item. A name never changes meaning: new
 * content always gets a new name, so the files can be cached forever.
 */
export type MediaFiles = {
  /** What the Memory page shows: a WebP for a photo, an H.264 MP4 for a video. */
  display: string;
  /** A small WebP for 1×1 tiles and previews; for a video, its poster frame. */
  thumbnail: string;
};

export type Memory = {
  id: string;
  title?: string;
  note?: string;
  cities: string[];
  startDay: Day;
  endDay: Day;
  coverMediaId?: string;
  oneOffOccasions: OneOffOccasion[];
  /**
   * The Occasion the Curator chose as Main occasion, if any; missing means
   * "not chosen" (see `themeOfMemory`). It may no longer apply, e.g. after a
   * Date range edit: it is then ignored, not removed.
   */
  mainOccasion?: MainOccasionRef;
  media: MediaItem[];
};

/** Points at an Occasion: a Yearly occasion by its id, a One-off occasion by its id within the Memory. */
export type MainOccasionRef = { kind: "yearly" | "one-off"; id: string };

export type YearlyOccasion = {
  id: string;
  name: string;
  month: number;
  day: number;
  firstYear?: number;
  /** Neutro when missing from `database.json` (see `openStorage`). */
  theme: ThemeKey;
};

export const DATABASE_VERSION = 1;

export type Database = {
  version: typeof DATABASE_VERSION;
  memories: Memory[];
  yearlyOccasions: YearlyOccasion[];
};
