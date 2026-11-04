import { t } from "../strings";
import { GalleryError } from "./errors";
import type { Storage } from "./storage";
import type { MediaCell } from "./types";

/**
 * The Layout: a grid 3 columns wide of square cells, where each Media item
 * covers a rectangle (column, row, width, height).
 */
export const LAYOUT_COLUMNS = 3;

/** The first row below every item of the Layout (0 for an empty Layout). */
export function layoutBottom(cells: readonly MediaCell[]): number {
  return cells.reduce((bottom, cell) => Math.max(bottom, cell.row + cell.height), 0);
}

/**
 * Where `count` new items go: 1×1 tiles in new rows below the bottom of the
 * Layout, filled left to right.
 */
export function cellsBelowLayout(cells: readonly MediaCell[], count: number): MediaCell[] {
  const firstRow = layoutBottom(cells);
  return Array.from({ length: count }, (_, i) => ({
    column: i % LAYOUT_COLUMNS,
    row: firstRow + Math.floor(i / LAYOUT_COLUMNS),
    width: 1,
    height: 1,
  }));
}

/** The items in reading order: rows top to bottom, then columns left to right. */
export function readingOrder<T extends { cell: MediaCell }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.cell.row - b.cell.row || a.cell.column - b.cell.column);
}

/**
 * What is wrong with a whole Layout, as an Italian message for the Curator,
 * or undefined when it is valid: every cell inside the 3 columns on whole
 * cells, and no two cells overlapping. Pure, so the editor can check a change
 * before sending it.
 */
export function layoutProblem(cells: readonly MediaCell[]): string | undefined {
  if (!cells.every(isInBounds)) return t.layout.outOfBounds;
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (overlaps(cells[i], cells[j])) return t.layout.overlap;
    }
  }
  return undefined;
}

function isInBounds(cell: MediaCell): boolean {
  const { column, row, width, height } = cell;
  return (
    [column, row, width, height].every(Number.isInteger) &&
    column >= 0 &&
    row >= 0 &&
    width >= 1 &&
    height >= 1 &&
    column + width <= LAYOUT_COLUMNS
  );
}

function overlaps(a: MediaCell, b: MediaCell): boolean {
  return (
    a.column < b.column + b.width &&
    b.column < a.column + a.width &&
    a.row < b.row + b.height &&
    b.row < a.row + a.height
  );
}

/**
 * Applies a Layout change: new cells for some or all of a Memory's Media, by
 * Media id. The resulting Layout (Media in processing included) is checked as
 * a whole; if any cell is out of bounds or overlaps another, nothing is saved.
 */
export async function saveLayout(
  storage: Storage,
  memoryId: string,
  cells: Readonly<Record<string, MediaCell>>,
): Promise<void> {
  await storage.update((db) => {
    const memory = db.memories.find((candidate) => candidate.id === memoryId);
    if (!memory) throw new GalleryError(t.memories.notFound);
    if (Object.keys(cells).some((id) => !memory.media.some((item) => item.id === id))) {
      throw new GalleryError(t.layout.unknownMedia);
    }
    const next = memory.media.map((item) => {
      const cell = cells[item.id] ?? item.cell;
      return { ...item, cell: { column: cell.column, row: cell.row, width: cell.width, height: cell.height } };
    });
    const problem = layoutProblem(next.map((item) => item.cell));
    if (problem) throw new GalleryError(problem);
    memory.media = next;
  });
}
