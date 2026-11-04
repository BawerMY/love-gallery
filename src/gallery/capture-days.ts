import { isDay, type Day } from "./days";
import type { MediaItem, Memory } from "./types";

/**
 * Where the couple's Memories are assumed to happen when a capture time
 * doesn't say where it was taken: a UTC time is shown as the time in Italy.
 */
export const HOME_TIME_ZONE = "Europe/Rome";

const CAPTURE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

/**
 * A capture time in the one form stored in `database.json`: the wall-clock
 * time where the item was taken plus that place's UTC offset, e.g.
 * `2025-03-14T18:30:05+01:00`. Its date part is the capture day, and it
 * parses to the right moment wherever the server runs.
 *
 * - With an offset (what phones write for photos, and iPhones for videos) it
 *   is kept as it is.
 * - A UTC time (a video's `creation_time`) becomes the time in Italy.
 * - A wall-clock time with no offset keeps its day and time, and is taken to
 *   be the time in Italy.
 *
 * Undefined when `raw` isn't a capture time.
 */
export function normalizeCaptureTime(raw: string | undefined): string | undefined {
  const match = CAPTURE_TIME.exec(raw?.trim() ?? "");
  if (!match) return undefined;
  const [, date, time, zone] = match;
  if (!isDay(date)) return undefined;
  if (zone === "Z") return homeWallClock(Date.parse(`${date}T${time}Z`));
  if (zone) return `${date}T${time}${zone.slice(0, 3)}:${zone.slice(-2)}`;

  // A wall-clock time in Italy: find the offset Italy had at that time.
  const asIfUtc = Date.parse(`${date}T${time}Z`);
  const offset = homeOffsetMinutes(asIfUtc - homeOffsetMinutes(asIfUtc) * 60_000);
  return `${date}T${time}${formatOffset(offset)}`;
}

/** The moment a capture time happened, in milliseconds; undefined when there is none. */
export function captureInstant(item: Pick<MediaItem, "capturedAt">): number | undefined {
  const time = normalizeCaptureTime(item.capturedAt);
  return time === undefined ? undefined : Date.parse(time);
}

/**
 * The day a Media item was captured, where it was captured (see
 * `normalizeCaptureTime`). Undefined when it has no capture time.
 */
export function captureDay(item: Pick<MediaItem, "capturedAt">): Day | undefined {
  return normalizeCaptureTime(item.capturedAt)?.slice(0, 10) as Day | undefined;
}

/** Oldest capture first; items with no capture time keep their order at the end. */
export function byCaptureTime<T extends Pick<MediaItem, "capturedAt">>(items: readonly T[]): T[] {
  const time = (item: T) => captureInstant(item) ?? Number.MAX_SAFE_INTEGER;
  return [...items].sort((a, b) => time(a) - time(b));
}

/**
 * A Date range from the earliest to the latest capture day of the Media.
 * Undefined when no item has a capture time.
 */
export function suggestDateRange(media: readonly MediaItem[]): { startDay: Day; endDay: Day } | undefined {
  const days = media.map(captureDay).filter((day): day is Day => !!day).sort();
  if (!days.length) return undefined;
  return { startDay: days[0], endDay: days[days.length - 1] };
}

/** Whether the item was captured on a day outside the Memory's Date range. Undated items never are. */
export function isOutsideDateRange(memory: Pick<Memory, "startDay" | "endDay">, item: MediaItem): boolean {
  const day = captureDay(item);
  return !!day && (day < memory.startDay || day > memory.endDay);
}

const homeClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: HOME_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** The wall clock in Italy at `instant`, with its parts. */
function homeParts(instant: number) {
  const parts = Object.fromEntries(homeClock.formatToParts(instant).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

/** Italy's UTC offset at `instant`, in minutes (60 in winter, 120 in summer). */
function homeOffsetMinutes(instant: number): number {
  const { date, time } = homeParts(instant);
  return Math.round((Date.parse(`${date}T${time}Z`) - Math.floor(instant / 1000) * 1000) / 60_000);
}

function homeWallClock(instant: number): string {
  const { date, time } = homeParts(instant);
  return `${date}T${time}${formatOffset(homeOffsetMinutes(instant))}`;
}

function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}
