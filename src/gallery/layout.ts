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
