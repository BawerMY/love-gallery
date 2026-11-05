"use client";

import { useRef, useState } from "react";
import { THEMES } from "@/gallery/themes";
import { t } from "@/strings";
import { useMemoryDraft } from "../admin/MemoryDraft";
import { Motif } from "../themes/Motif";
import { list, occasionItem, occasionSummary, secondaryButton } from "../ui";
import { useOrderGesture } from "./useOrderGesture";

/**
 * The draft's Occasions in badge order, each with a ⠿ handle to drag it to a
 * new place, with touch or mouse alike, or to move it with the up and down
 * arrow keys (see `useOrderGesture`); and a button to take it off this
 * Memory. Dropping changes the draft, saved with the rest of the page.
 */
export function SortableOccasionList() {
  const { occasions, setOccasions } = useMemoryDraft();
  const ids = occasions.map((occasion) => occasion.id);
  // The order shown while dragging; the draft's once dropped.
  const [preview, setPreview] = useState<string[] | null>(null);
  const order = preview ?? ids;
  const listRef = useRef<HTMLUListElement>(null);

  const byId = new Map(occasions.map((occasion) => [occasion.id, occasion]));
  const ordered = order.flatMap((id) => byId.get(id) ?? []);

  function drop(next: string[]) {
    setPreview(null);
    if (next.join() !== ids.join()) setOccasions(next.flatMap((id) => byId.get(id) ?? []));
  }

  const handle = useOrderGesture({ listRef, order, preview: setPreview, drop });

  return (
    <>
      {ordered.length > 1 ? <p className="m-0 text-sm text-cocoa-soft">{t.occasions.orderHint}</p> : null}
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
              <button
                type="button"
                className={secondaryButton}
                aria-label={t.occasions.removeLabel(occasion.name)}
                onClick={() => setOccasions(occasions.filter((other) => other.id !== occasion.id))}
              >
                {t.occasions.remove}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
