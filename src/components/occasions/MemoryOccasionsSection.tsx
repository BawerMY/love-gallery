"use client";

import { useId, useState } from "react";
import type { Occasion } from "@/gallery/types";
import { DEFAULT_THEME, type ThemeKey } from "@/gallery/themes";
import { t } from "@/strings";
import { useMemoryDraft } from "../admin/MemoryDraft";
import { ThemeSelect } from "../themes/ThemeSelect";
import { adminCard, adminHeading, adminSubheading, button, emptyText, field, formStack, quietText } from "../ui";
import { SortableOccasionList } from "./SortableOccasionList";

type Props = {
  /** The list of Occasions, alphabetically (see `listOccasions`). */
  occasions: Occasion[];
};

/**
 * The Occasions card of a Memory's Admin page: the draft's Occasions in
 * badge order, to reorder by drag and drop, each with a button to take it
 * off this Memory only; a picker of the Occasions it doesn't have yet; and a
 * form to create a new one on the spot. All saved with the rest of the page.
 */
export function MemoryOccasionsSection({ occasions }: Props) {
  const draft = useMemoryDraft();
  const available = occasions.filter((occasion) => !draft.occasions.some((chosen) => chosen.id === occasion.id));

  return (
    <section aria-labelledby="memory-occasions-heading" className={adminCard}>
      <h2 id="memory-occasions-heading" className={adminHeading}>
        {t.occasions.memoryHeading}
      </h2>
      {draft.occasions.length ? <SortableOccasionList /> : <p className={emptyText}>{t.occasions.memoryNone}</p>}
      {available.length ? (
        <OccasionPicker available={available} onPick={(occasion) => draft.setOccasions([...draft.occasions, occasion])} />
      ) : (
        <p className={quietText}>{occasions.length ? t.occasions.pickNoneLeft : t.occasions.pickListEmpty}</p>
      )}
      <NewOccasionForm onCreate={draft.addNewOccasion} />
    </section>
  );
}

/** Picks an Occasion from the list for the end of the Memory's Occasions. */
function OccasionPicker({ available, onPick }: { available: Occasion[]; onPick: (occasion: Occasion) => void }) {
  const id = useId();
  const [picked, setPicked] = useState("");

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const occasion = available.find((candidate) => candidate.id === picked);
        if (occasion) onPick(occasion);
        setPicked("");
      }}
    >
      <label htmlFor={`${id}-occasion`}>{t.occasions.pickLabel}</label>
      <div className="flex gap-2">
        <select className={`${field} flex-1`} id={`${id}-occasion`} required value={picked} onChange={(event) => setPicked(event.target.value)}>
          <option value="" disabled>
            {t.occasions.pickPlaceholder}
          </option>
          {available.map((occasion) => (
            <option key={occasion.id} value={occasion.id}>
              {occasion.name}
            </option>
          ))}
        </select>
        <button type="submit" className={button}>
          {t.occasions.add}
        </button>
      </div>
    </form>
  );
}

/** A new Occasion's name and Theme, for the end of the Memory's Occasions; it joins the list when the page is saved. */
function NewOccasionForm({ onCreate }: { onCreate: (occasion: Omit<Occasion, "id">) => void }) {
  const id = useId();
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<ThemeKey>(DEFAULT_THEME);

  return (
    <form
      className={formStack}
      aria-label={t.occasions.newOccasion}
      onSubmit={(event) => {
        event.preventDefault();
        onCreate({ name, theme });
        setName("");
        setTheme(DEFAULT_THEME);
      }}
    >
      <h3 className={adminSubheading}>{t.occasions.newOccasion}</h3>
      <label htmlFor={`${id}-name`}>{t.occasions.nameLabel}</label>
      <input id={`${id}-name`} className={field} name="name" required value={name} onChange={(event) => setName(event.target.value)} />
      <ThemeSelect id={`${id}-theme`} value={theme} onChange={(event) => setTheme(event.target.value as ThemeKey)} />
      <button type="submit" className={`${button} self-start`}>
        {t.occasions.createOnMemory}
      </button>
    </form>
  );
}
