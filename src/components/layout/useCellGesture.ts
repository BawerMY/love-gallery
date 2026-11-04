"use client";

import { useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { LAYOUT_COLUMNS } from "@/gallery/layout";
import type { MediaCell } from "@/gallery/types";

export type GestureMode = "move" | "resize";

type Gesture = {
  id: string;
  mode: GestureMode;
  pointerId: number;
  x: number;
  y: number;
  start: MediaCell;
  pitch: number;
};

/**
 * Turns a drag on a tile's handle into Layout cells, with mouse, touch or pen
 * alike (Pointer Events), plus arrow keys for the keyboard. Moving keeps the
 * size; resizing keeps the top-left corner. Every candidate cell is handed to
 * `place`, which decides whether the Layout may take it.
 */
export function useCellGesture({
  gridRef,
  gap,
  cellOf,
  place,
}: {
  gridRef: RefObject<HTMLElement | null>;
  /** The gap between cells, in pixels. */
  gap: number;
  cellOf: (id: string) => MediaCell;
  place: (id: string, cell: MediaCell) => void;
}) {
  const gesture = useRef<Gesture | null>(null);

  function handlers(id: string, mode: GestureMode) {
    return {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        if (event.button !== 0 || !gridRef.current) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        // One cell plus one gap: how far the pointer goes to move by a cell.
        const pitch = (gridRef.current.getBoundingClientRect().width + gap) / LAYOUT_COLUMNS;
        gesture.current = {
          id,
          mode,
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          start: cellOf(id),
          pitch,
        };
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const current = gesture.current;
        if (!current || current.pointerId !== event.pointerId) return;
        const columns = Math.round((event.clientX - current.x) / current.pitch);
        const rows = Math.round((event.clientY - current.y) / current.pitch);
        place(id, shifted(current.start, current.mode, columns, rows));
      },
      onPointerUp: end,
      onPointerCancel: end,
      onKeyDown(event: KeyboardEvent<HTMLElement>) {
        const step = ARROWS[event.key];
        if (!step) return;
        event.preventDefault();
        place(id, shifted(cellOf(id), mode, step[0], step[1]));
      },
    };
  }

  function end(event: PointerEvent<HTMLElement>) {
    if (gesture.current?.pointerId === event.pointerId) gesture.current = null;
  }

  return handlers;
}

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** The cell moved or resized by whole columns and rows, kept inside the grid. */
function shifted(start: MediaCell, mode: GestureMode, columns: number, rows: number): MediaCell {
  if (mode === "move") {
    return {
      ...start,
      column: clamp(start.column + columns, 0, LAYOUT_COLUMNS - start.width),
      row: Math.max(0, start.row + rows),
    };
  }
  return {
    ...start,
    width: clamp(start.width + columns, 1, LAYOUT_COLUMNS - start.column),
    height: Math.max(1, start.height + rows),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
