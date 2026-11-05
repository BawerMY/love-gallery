"use client";

import { useState, useTransition } from "react";
import { chooseMainOccasionAction, type FormState } from "@/app/admin/actions";
import type { Memory, Occasion } from "@/gallery";
import { DEFAULT_THEME } from "@/gallery/themes";
import { t } from "@/strings";
import { errorText, field, formStack, quietText } from "../ui";

type Props = {
  memory: Memory;
  /** The Memory's Occasions, in badge order (see `occasionsOfMemory`). */
  occasions: Occasion[];
};

/**
 * The "Occasione principale" selector of a Memory's Admin page: "Automatica"
 * first, then each non-Neutro Occasion in badge order (a Neutro one has no
 * Theme to give). Saved as soon as it changes. Shown only when there's a real
 * choice: two or more non-Neutro Occasions.
 */
export function MainOccasionSelect({ memory, occasions }: Props) {
  const options = occasions.filter((occasion) => occasion.theme !== DEFAULT_THEME);
  const [value, setValue] = useState(memory.mainOccasionId ?? "");
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  if (options.length < 2) return null;
  // A choice that no longer applies (taken off the Memory, or now Neutro) counts as automatic, as in `themeOfMemory`.
  const selected = options.some((occasion) => occasion.id === value) ? value : "";

  function change(next: string) {
    setValue(next);
    setState({});
    startTransition(async () => setState(await chooseMainOccasionAction(memory.id, next)));
  }

  return (
    <div className={`${formStack} mt-4`}>
      <label htmlFor="main-occasion">
        {t.occasions.mainOccasionLabel} <small className="text-cocoa-soft">({t.occasions.mainOccasionHint})</small>
      </label>
      <select
        className={field}
        id="main-occasion"
        value={selected}
        disabled={pending}
        onChange={(event) => change(event.target.value)}
      >
        <option value="">{t.occasions.mainOccasionAutomatic}</option>
        {options.map((occasion) => (
          <option key={occasion.id} value={occasion.id}>
            {occasion.name}
          </option>
        ))}
      </select>
      {state.error ? (
        <p role="alert" className={errorText}>
          {state.error}
        </p>
      ) : null}
      {state.saved && !pending ? (
        <p role="status" className={quietText}>
          {t.occasions.mainOccasionSaved}
        </p>
      ) : null}
    </div>
  );
}
