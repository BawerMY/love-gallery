/**
 * The shape of `database.json` (see spec "Data shape" and ADR-0002).
 * Later tickets fill in the Memory, Media item and Yearly occasion fields.
 */

/** A calendar date with no time zone, formatted `YYYY-MM-DD`. */
export type Day = string;

export type OneOffOccasion = {
  id: string;
  name: string;
  day: Day;
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
  /** ISO timestamp of when the photo or video was taken, if known. */
  capturedAt?: string;
  width: number;
  height: number;
  cell: MediaCell;
  /** Names of the processed files inside `media/`. */
  files: Record<string, string>;
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
  media: MediaItem[];
};

export type YearlyOccasion = {
  id: string;
  name: string;
  month: number;
  day: number;
  firstYear?: number;
};

export const DATABASE_VERSION = 1;

export type Database = {
  version: typeof DATABASE_VERSION;
  memories: Memory[];
  yearlyOccasions: YearlyOccasion[];
};
