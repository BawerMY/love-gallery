"use client";

import { useActionState, useId, useState } from "react";
import { createOccasionAction, updateOccasionAction, type FormState } from "@/app/admin/actions";
import type { Occasion } from "@/gallery";
import { DEFAULT_THEME, type ThemeKey } from "@/gallery/themes";
import { t } from "@/strings";
import { ThemeSelect } from "../themes/ThemeSelect";
import { button, errorText, field, formStack, quietText, secondaryButton } from "../ui";

type Props = {
  /** The Occasion being edited, or nothing when adding one to the list. */
  occasion?: Occasion;
  /** Called after an edit is saved, or when the Curator cancels it. */
  onDone?: () => void;
};

/** The name and Theme of an Occasion in the list. */
export function OccasionForm({ occasion, onDone }: Props) {
  const id = useId();
  const [name, setName] = useState(occasion?.name ?? "");
  const [theme, setTheme] = useState<ThemeKey>(occasion?.theme ?? DEFAULT_THEME);
  const [edited, setEdited] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      const result = occasion
        ? await updateOccasionAction(occasion.id, previous, form)
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
      className={formStack}
      aria-label={occasion ? t.occasions.editOccasion(occasion.name) : t.occasions.newOccasion}
      action={(form) => {
        setEdited(false);
        return formAction(form);
      }}
    >
      <label htmlFor={`${id}-name`}>{t.occasions.nameLabel}</label>
      <input id={`${id}-name`} className={field} name="name" required value={name} onChange={change(setName)} />

      <ThemeSelect id={`${id}-theme`} value={theme} onChange={change((value) => setTheme(value as ThemeKey))} />

      {state.error ? (
        <p role="alert" className={errorText}>
          {state.error}
        </p>
      ) : null}
      {state.saved && !edited && !pending && !occasion ? (
        <p role="status" className={quietText}>
          {t.occasions.saved}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={button} disabled={pending}>
          {pending ? t.occasions.saving : occasion ? t.occasions.save : t.occasions.add}
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
