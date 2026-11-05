"use client";

import { useActionState, useId } from "react";
import { addOccasionToMemoryAction, type FormState } from "@/app/admin/actions";
import type { Occasion } from "@/gallery";
import { t } from "@/strings";
import { button, errorText, field } from "../ui";

type Props = {
  memoryId: string;
  /** The Occasions in the list the Memory doesn't have yet, alphabetically. */
  available: Occasion[];
};

/** Picks an Occasion from the list and adds it to the end of a Memory's Occasions. */
export function OccasionPicker({ memoryId, available }: Props) {
  const id = useId();
  const [state, formAction, pending] = useActionState(
    (previous: FormState, form: FormData) => addOccasionToMemoryAction(memoryId, previous, form),
    {},
  );

  return (
    <form className="mt-3 flex flex-col gap-2" action={formAction}>
      <label htmlFor={`${id}-occasion`}>{t.occasions.pickLabel}</label>
      <div className="flex gap-2">
        {/* Keyed by what's left, so the choice resets once the picked Occasion is added. */}
        <select
          key={available.map((occasion) => occasion.id).join()}
          className={`${field} flex-1`}
          id={`${id}-occasion`}
          name="occasionId"
          required
          defaultValue=""
        >
          <option value="" disabled>
            {t.occasions.pickPlaceholder}
          </option>
          {available.map((occasion) => (
            <option key={occasion.id} value={occasion.id}>
              {occasion.name}
            </option>
          ))}
        </select>
        <button type="submit" className={button} disabled={pending}>
          {pending ? t.occasions.saving : t.occasions.add}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className={errorText}>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
