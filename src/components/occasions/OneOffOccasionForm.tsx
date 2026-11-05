"use client";

import { useActionState, useId, useState } from "react";
import { addOneOffOccasionAction, type FormState } from "@/app/admin/actions";
import type { Memory } from "@/gallery";
import { t } from "@/strings";
import { button, errorText, field, formStack, quietText } from "../ui";

/** The name and day of a new One-off occasion. The day picker stays inside the Date range. */
export function OneOffOccasionForm({ memory }: { memory: Memory }) {
  const id = useId();
  const [name, setName] = useState("");
  const [day, setDay] = useState<string>(memory.startDay);
  const [edited, setEdited] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      const result = await addOneOffOccasionAction(memory.id, previous, form);
      if (result.saved) setName("");
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
