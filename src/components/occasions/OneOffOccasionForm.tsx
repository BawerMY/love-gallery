"use client";

import { useActionState, useId, useState } from "react";
import { addOneOffOccasionAction, type FormState } from "@/app/admin/actions";
import type { Memory } from "@/gallery";
import { DEFAULT_THEME, type ThemeKey } from "@/gallery/themes";
import { t } from "@/strings";
import { ThemeSelect } from "../themes/ThemeSelect";
import { button, errorText, field, formStack, quietText } from "../ui";

/** The name, day and Theme of a new One-off occasion. The day picker stays inside the Date range. */
export function OneOffOccasionForm({ memory }: { memory: Memory }) {
  const id = useId();
  const [name, setName] = useState("");
  const [day, setDay] = useState<string>(memory.startDay);
  const [theme, setTheme] = useState<ThemeKey>(DEFAULT_THEME);
  const [edited, setEdited] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      const result = await addOneOffOccasionAction(memory.id, previous, form);
      if (result.saved) {
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
      aria-label={t.occasions.newOneOff}
      action={(form) => {
        setEdited(false);
        return formAction(form);
      }}
    >
      <label htmlFor={`${id}-name`}>{t.occasions.nameLabel}</label>
      <input id={`${id}-name`} className={field} name="name" required value={name} onChange={change(setName)} />

      <label htmlFor={`${id}-day`}>{t.occasions.oneOffDayLabel}</label>
      <input
        id={`${id}-day`}
        className={field}
        name="day"
        type="date"
        required
        min={memory.startDay}
        max={memory.endDay}
        value={day}
        onChange={change(setDay)}
      />

      <ThemeSelect id={`${id}-theme`} value={theme} onChange={change((value) => setTheme(value as ThemeKey))} />

      {state.error ? (
        <p role="alert" className={errorText}>
          {state.error}
        </p>
      ) : null}
      {state.saved && !edited && !pending ? (
        <p role="status" className={quietText}>
          {t.occasions.saved}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={button} disabled={pending}>
          {pending ? t.occasions.saving : t.occasions.add}
        </button>
      </div>
    </form>
  );
}
