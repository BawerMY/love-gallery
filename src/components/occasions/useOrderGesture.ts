"use client";

import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

type Drag = {
  pointerId: number;
  id: string;
  /** The order when the drag began. */
  start: string[];
  /** Where each place in the list was on screen when the drag began, top to bottom. */
  slots: { top: number; bottom: number }[];
};

/**
 * Turns a drag on an item's handle into a new order of a list, with mouse,
 * touch or pen alike (Pointer Events, as `useCellGesture` does for the
 * Layout), plus the up and down arrow keys for the keyboard. `preview` gets
 * each order while dragging; `drop` gets the final one (the starting order if
 * the drag is cancelled) and each order a key press makes.
 */
export function useOrderGesture({
  listRef,
  order,
  preview,
  drop,
}: {
  /** The list whose children are the items, top to bottom. */
  listRef: RefObject<HTMLElement | null>;
  order: string[];
  preview: (order: string[]) => void;
  drop: (order: string[]) => void;
}) {
  const drag = useRef<Drag | null>(null);
  /** Stops listening on the window; set while a drag is going on. */
  const stopListening = useRef<(() => void) | null>(null);

  // Leaving the page mid-drag must not leave listeners on the window.
  useEffect(() => () => stopListening.current?.(), []);

  function handlers(id: string) {
    return {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        if (event.button !== 0 || !listRef.current) return;
        event.preventDefault();
        stopListening.current?.();
        const slots = [...listRef.current.children].map((item) => {
          const box = item.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom };
        });
        drag.current = { pointerId: event.pointerId, id, start: order, slots };

        function onMove(event: globalThis.PointerEvent) {
          const current = drag.current;
          if (!current || current.pointerId !== event.pointerId) return;
          preview(moveTo(current.start, current.id, slotAt(current.slots, event.clientY)));
        }
        function onEnd(event: globalThis.PointerEvent) {
          const current = drag.current;
          if (!current || current.pointerId !== event.pointerId) return;
          stop();
          drop(event.type === "pointercancel" ? current.start : moveTo(current.start, current.id, slotAt(current.slots, event.clientY)));
        }
        function stop() {
          drag.current = null;
          stopListening.current = null;
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onEnd);
          window.removeEventListener("pointercancel", onEnd);
        }

        // Listened for on the window: moving the item in the list may cost the handle its pointer capture.
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onEnd);
        window.addEventListener("pointercancel", onEnd);
        stopListening.current = stop;
      },
      onKeyDown(event: KeyboardEvent<HTMLElement>) {
        const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
        if (!step) return;
        event.preventDefault();
        drop(moveTo(order, id, order.indexOf(id) + step));
      },
    };
  }

  return handlers;
}

/** The place in the list under the pointer, from where the places were when the drag began. */
function slotAt(slots: Drag["slots"], y: number): number {
  const index = slots.findIndex((slot) => y < slot.bottom);
  return index < 0 ? slots.length - 1 : index;
}

/** The order with `id` moved to `index`, kept inside the list. */
function moveTo(order: string[], id: string, index: number): string[] {
  const rest = order.filter((other) => other !== id);
  const to = Math.min(Math.max(index, 0), rest.length);
  return [...rest.slice(0, to), id, ...rest.slice(to)];
}
