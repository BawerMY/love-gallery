import { describe, expect, it } from "vitest";
import { cellsBelowLayout, layoutBottom, readingOrder } from "@/gallery";

describe("Layout", () => {
  it("places new items as 1×1 tiles in new rows, left to right, below the bottom", () => {
    const existing = [
      { column: 0, row: 0, width: 2, height: 2 },
      { column: 2, row: 1, width: 1, height: 3 },
    ];
    expect(layoutBottom(existing)).toBe(4);
    expect(cellsBelowLayout(existing, 4)).toEqual([
      { column: 0, row: 4, width: 1, height: 1 },
      { column: 1, row: 4, width: 1, height: 1 },
      { column: 2, row: 4, width: 1, height: 1 },
      { column: 0, row: 5, width: 1, height: 1 },
    ]);
  });

  it("starts an empty Layout at the top row", () => {
    expect(layoutBottom([])).toBe(0);
    expect(cellsBelowLayout([], 2)).toEqual([
      { column: 0, row: 0, width: 1, height: 1 },
      { column: 1, row: 0, width: 1, height: 1 },
    ]);
  });

  it("starts a new row even when the last row has empty cells", () => {
    expect(cellsBelowLayout([{ column: 0, row: 0, width: 1, height: 1 }], 1)).toEqual([
      { column: 0, row: 1, width: 1, height: 1 },
    ]);
  });

  it("reads items rows top to bottom, then columns left to right", () => {
    const items = [
      { id: "c", cell: { column: 0, row: 1, width: 1, height: 1 } },
      { id: "b", cell: { column: 2, row: 0, width: 1, height: 1 } },
      { id: "a", cell: { column: 0, row: 0, width: 2, height: 1 } },
    ];
    expect(readingOrder(items).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});
