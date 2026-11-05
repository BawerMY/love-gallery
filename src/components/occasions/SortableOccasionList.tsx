"use client";

import { useRef, useState, useTransition, type KeyboardEvent, type PointerEvent } from "react";
import { removeOccasionFromMemoryAction, setOccasionOrderAction, type FormState } from "@/app/admin/actions";
import type { Occasion } from "@/gallery";
import { THEMES } from "@/gallery/themes";
import { t } from "@/strings";
import { Motif } from "../themes/Motif";
import { errorText, list, occasionItem, occasionSummary, quietText, secondaryButton } from "../ui";

type Props = {
  memoryId: string;
  /** The Memory's Occasions, in badge order (see `occasionsOfMemory`). */
  occasions: Occasion[];
};

type Drag = {
  pointerId: number;
  id: string;
  /** The order when the drag began. */
  start: string[];
  /** Where each place in the list was on screen when the drag began, top to bottom. */
  slots: { top: number; bottom: number }[];
};

/**
 * A Memory's Occasions in badge order, each with a ⠿ handle to drag it to a
 * new place, with touch or mouse alike (Pointer Events, as in the Layout
 * editor), or to move it with the up and down arrow keys; and a button to
 * take it off this Memory. Dropping saves the new order straight away.
 */
export function SortableOccasionList({ memoryId, occasions }: Props) {
  const ids = occasions.map((occasion) => occasion.id);
  const key = ids.join();
  // The order shown: the saved one, until the Curator moves something. A new saved order (an Occasion added or removed) replaces it.
  const [order, setOrder] = useState(ids);
  const [shownKey, setShownKey] = useState(key);
  if (shownKey !== key) {
    setShownKey(key);
    setOrder(ids);
  }
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);
  const drag = useRef<Drag | null>(null);

  const byId = new Map(occasions.map((occasion) => [occasion.id, occasion]));
  const shown = order.flatMap((id) => byId.get(id) ?? []);

  function save(next: string[]) {
    if (next.join() === key) return;
    setState({});
    startTransition(async () => {
      const result = await setOccasionOrderAction(memoryId, next);
      setState(result);
      if (result.error) setOrder(ids);
    });
  }

  function onPointerDown(event: PointerEvent<HTMLElement>, id: string) {
    if (event.button !== 0 || !listRef.current) return;
    event.preventDefault();
    const slots = [...listRef.current.children].map((item) => {
      const box = item.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom };
    });
    drag.current = { pointerId: event.pointerId, id, start: order, slots };
    // Listened for on the window: moving the item in the list may cost the handle its pointer capture.
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
  }

  function onPointerMove(event: globalThis.PointerEvent) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    setOrder(moved(current.start, current.id, slotAt(current.slots, event.clientY)));
  }

  function onPointerEnd(event: globalThis.PointerEvent) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerEnd);
    window.removeEventListener("pointercancel", onPointerEnd);
    const next = event.type === "pointercancel" ? current.start : moved(current.start, current.id, slotAt(current.slots, event.clientY));
    setOrder(next);
    save(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>, id: string) {
    const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = moved(order, id, order.indexOf(id) + step);
    setOrder(next);
    save(next);
  }

  return (
    <>
      {shown.length > 1 ? <p className="mb-2 text-sm text-cocoa-soft">{t.occasions.orderHint}</p> : null}
      <ul ref={listRef} className={list}>
        {shown.map((occasion) => (
          <li key={occasion.id} className={occasionItem} data-theme={occasion.theme}>
            <div className={occasionSummary}>
              <button
                type="button"
                className="size-9 cursor-grab touch-none rounded-full border-0 bg-transparent p-0 text-lg leading-none text-cocoa-soft active:cursor-grabbing"
                aria-label={t.occasions.move(occasion.name)}
                onPointerDown={(event) => onPointerDown(event, occasion.id)}
                onKeyDown={(event) => onKeyDown(event, occasion.id)}
              >
                ⠿
              </button>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <Motif theme={THEMES[occasion.theme]} size={12} />
                <strong>{occasion.name}</strong>
              </span>
              <form action={removeOccasionFromMemoryAction.bind(null, memoryId, occasion.id)}>
                <button type="submit" className={secondaryButton} aria-label={t.occasions.removeLabel(occasion.name)}>
                  {t.occasions.remove}
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      <p role="status" className={`mt-2 text-sm ${state.error ? errorText : quietText}`}>
        {state.error ?? (state.saved && !pending ? t.occasions.orderSaved : "")}
      </p>
    </>
  );
}

/** The place in the list under the pointer, from where the places were when the drag began. */
function slotAt(slots: Drag["slots"], y: number): number {
  const index = slots.findIndex((slot) => y < slot.bottom);
  return index < 0 ? slots.length - 1 : index;
}

/** The order with `id` moved to `index`, kept inside the list. */
function moved(order: string[], id: string, index: number): string[] {
  const rest = order.filter((other) => other !== id);
  const to = Math.min(Math.max(index, 0), rest.length);
  return [...rest.slice(0, to), id, ...rest.slice(to)];
}
