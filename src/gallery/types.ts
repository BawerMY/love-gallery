/**
 * The shape of `database.json` (see spec "Data shape" and ADR-0002).
 */

import type { Day } from "./days";
import type { ThemeKey } from "./themes";

export type { Day };

/**
 * One entry of the gallery's list of Occasions. Its name is unique, ignoring
 * upper and lower case and surrounding spaces.
 */
export type Occasion = {
  id: string;
  name: string;
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
  /** The ids of the Memory's Occasions, in badge order. */
  occasionIds: string[];
  /**
   * The id of the Occasion the Curator chose as Main occasion, if any; missing
   * means "not chosen" (see `themeOfMemory`). It is removed when its Occasion
   * is taken off the Memory, deleted from the list or turned Neutro.
   */
  mainOccasionId?: string;
  media: MediaItem[];
};

export const DATABASE_VERSION = 2;

export type Database = {
  version: typeof DATABASE_VERSION;
  memories: Memory[];
  /** The list of Occasions, in the order they were created. */
  occasions: Occasion[];
};
