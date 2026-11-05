"use client";

import { useActionState, useId, useState } from "react";
import {
  createOccasionAction,
  createOccasionOnMemoryAction,
  updateOccasionAction,
  type FormState,
} from "@/app/admin/actions";
import type { Occasion } from "@/gallery";
import { DEFAULT_THEME, type ThemeKey } from "@/gallery/themes";
import { t } from "@/strings";
import { ThemeSelect } from "../themes/ThemeSelect";
import { button, errorText, field, formStack, quietText, secondaryButton } from "../ui";

type Props =
  /** Adds a new Occasion to the list, from the Admin page's "Occasioni" section. */
  | { occasion?: undefined; memoryId?: undefined; onDone?: undefined }
  /** Creates a new Occasion from a Memory's Admin page, adding it to the end of that Memory's Occasions too. */
  | { occasion?: undefined; memoryId: string; onDone?: undefined }
  /** Edits an Occasion in the list; `onDone` is called once it's saved, or when the Curator cancels. */
  | { occasion: Occasion; memoryId?: undefined; onDone?: () => void };

/** The name and Theme (Neutro by default) of an Occasion: a new one, or one in the list being edited. */
export function OccasionForm({ occasion, memoryId, onDone }: Props) {
  const id = useId();
  const [name, setName] = useState(occasion?.name ?? "");
  const [theme, setTheme] = useState<ThemeKey>(occasion?.theme ?? DEFAULT_THEME);
  const [edited, setEdited] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      const result = occasion
        ? await updateOccasionAction(occasion.id, previous, form)
        : memoryId
          ? await createOccasionOnMemoryAction(memoryId, previous, form)
          : await createOccasionAction(previous, form);
      if (result.saved && occasion) onDone?.();
      if (result.saved && !occasion) {
        setName("");
        setTheme(DEFAULT_THEME);
      }
      return result;
    },
    {},
  );

  function change(set: (value: string) => void) {
    return (event: { target: { value: string } }) => {
      set(event.target.value);
      setEdited(true);
    };
  }

  return (
    <form
      className={memoryId ? `${formStack} mt-4` : formStack}
      aria-label={occasion ? t.occasions.editOccasion(occasion.name) : t.occasions.newOccasion}
      action={(form) => {
        setEdited(false);
        return formAction(form);
      }}
    >
      {memoryId ? <h3 className="font-semibold">{t.occasions.newOccasion}</h3> : null}
      <label htmlFor={`${id}-name`}>{t.occasions.nameLabel}</label>
      <input id={`${id}-name`} className={field} name="name" required value={name} onChange={change(setName)} />

      <ThemeSelect id={`${id}-theme`} value={theme} onChange={change((value) => setTheme(value as ThemeKey))} />

      {state.error ? (
        <p role="alert" className={errorText}>
          {state.error}
        </p>
      ) : null}
      {/* On a Memory's page the new badge in its list says it's saved. */}
      {state.saved && !edited && !pending && !occasion && !memoryId ? (
        <p role="status" className={quietText}>
          {t.occasions.saved}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={button} disabled={pending}>
          {pending
            ? t.occasions.saving
            : occasion
              ? t.occasions.save
              : memoryId
                ? t.occasions.createOnMemory
                : t.occasions.add}
        </button>
        {occasion ? (
          <button type="button" className={secondaryButton} onClick={onDone}>
            {t.occasions.cancel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
