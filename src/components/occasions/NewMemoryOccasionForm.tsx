"use client";

import { useActionState, useId, useState } from "react";
import { createOccasionOnMemoryAction, type FormState } from "@/app/admin/actions";
import { DEFAULT_THEME, type ThemeKey } from "@/gallery/themes";
import { t } from "@/strings";
import { ThemeSelect } from "../themes/ThemeSelect";
import { button, errorText, field, formStack } from "../ui";

type Props = {
  memoryId: string;
};

/**
 * Creates a new Occasion (name and Theme, Neutro by default) from a Memory's
 * Admin page, adding it to the list and to the end of that Memory's Occasions.
 */
export function NewMemoryOccasionForm({ memoryId }: Props) {
  const id = useId();
  const [name, setName] = useState("");
  const [theme, setTheme] = useState<ThemeKey>(DEFAULT_THEME);

  const [state, formAction, pending] = useActionState(async (previous: FormState, form: FormData) => {
    const result = await createOccasionOnMemoryAction(memoryId, previous, form);
    if (result.saved) {
      setName("");
      setTheme(DEFAULT_THEME);
    }
    return result;
  }, {});

  return (
    <form className={`${formStack} mt-4`} aria-label={t.occasions.newOccasion} action={formAction}>
      <h3 className="font-semibold">{t.occasions.newOccasion}</h3>
      <label htmlFor={`${id}-name`}>{t.occasions.nameLabel}</label>
      <input
        id={`${id}-name`}
        className={field}
        name="name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <ThemeSelect id={`${id}-theme`} value={theme} onChange={(event) => setTheme(event.target.value as ThemeKey)} />

      {state.error ? (
        <p role="alert" className={errorText}>
          {state.error}
        </p>
      ) : null}

      <div>
        <button type="submit" className={button} disabled={pending}>
          {pending ? t.occasions.saving : t.occasions.createOnMemory}
        </button>
      </div>
    </form>
  );
}
