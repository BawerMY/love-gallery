import type { Day, MediaItem, Memory } from "./types";

/**
 * The day a Media item was captured, where it was captured: capture times
 * are stored as the camera's wall-clock time, so the day is their date part.
 */
export function captureDay(item: Pick<MediaItem, "capturedAt">): Day | undefined {
  return item.capturedAt?.slice(0, 10);
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
