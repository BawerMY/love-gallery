"use client";

import { useRef, useState, useTransition } from "react";
import { removeOccasionFromMemoryAction, setOccasionOrderAction, type FormState } from "@/app/admin/actions";
import type { Occasion } from "@/gallery";
import { THEMES } from "@/gallery/themes";
import { t } from "@/strings";
import { Motif } from "../themes/Motif";
import { errorText, list, occasionItem, occasionSummary, quietText, secondaryButton } from "../ui";
import { useOrderGesture } from "./useOrderGesture";

type Props = {
  memoryId: string;
  /** The Memory's Occasions, in badge order (see `occasionsOfMemory`). */
  occasions: Occasion[];
};

/**
 * A Memory's Occasions in badge order, each with a ⠿ handle to drag it to a
 * new place, with touch or mouse alike, or to move it with the up and down
 * arrow keys (see `useOrderGesture`); and a button to take it off this
 * Memory. Dropping saves the new order straight away.
 */
export function SortableOccasionList({ memoryId, occasions }: Props) {
  const ids = occasions.map((occasion) => occasion.id);
  const key = ids.join();
  // The order shown: the saved one, until the Curator moves something. A new saved order (an Occasion added or removed) replaces it.
  const [order, setOrder] = useState(ids);
  const [orderKey, setOrderKey] = useState(key);
  if (orderKey !== key) {
    setOrderKey(key);
    setOrder(ids);
  }
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);

  const byId = new Map(occasions.map((occasion) => [occasion.id, occasion]));
  const ordered = order.flatMap((id) => byId.get(id) ?? []);

  function save(next: string[]) {
    setOrder(next);
    if (next.join() === key) return;
    setState({});
    startTransition(async () => {
      const result = await setOccasionOrderAction(memoryId, next);
      setState(result);
      if (result.error) setOrder(ids);
    });
  }

  const handle = useOrderGesture({ listRef, order, preview: setOrder, drop: save });

  return (
    <>
      {ordered.length > 1 ? <p className="mb-2 text-sm text-cocoa-soft">{t.occasions.orderHint}</p> : null}
      <ul ref={listRef} className={list}>
        {ordered.map((occasion) => (
          <li key={occasion.id} className={occasionItem} data-theme={occasion.theme}>
            <div className={occasionSummary}>
              <button
                type="button"
                className="size-9 cursor-grab touch-none rounded-full border-0 bg-transparent p-0 text-lg leading-none text-cocoa-soft active:cursor-grabbing"
                aria-label={t.occasions.move(occasion.name)}
                {...handle(occasion.id)}
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
