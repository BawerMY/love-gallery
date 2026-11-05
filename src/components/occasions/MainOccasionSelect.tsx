"use client";

import { useState, useTransition } from "react";
import { chooseMainOccasionAction, type FormState } from "@/app/admin/actions";
import type { Memory, Occasion } from "@/gallery";
import { DEFAULT_THEME } from "@/gallery/themes";
import { encodeMainOccasion } from "@/gallery/types";
import { t } from "@/strings";
import { errorText, field, formStack, quietText } from "../ui";

type Props = {
  memory: Memory;
  /** The Memory's Occasions, by day (see `occasionsOfMemory`). */
  occasions: Occasion[];
};

/**
 * The "Occasione principale" selector of a Memory's Admin page: "Automatica"
 * first, then each Occasion once, by day. Saved as soon as it changes.
 * Shown only when two or more Occasions apply. A Neutro Occasion is listed
 * but can't be chosen: it has no Theme to give (see `chooseMainOccasion`).
 */
export function MainOccasionSelect({ memory, occasions }: Props) {
  // A Yearly occasion can fall more than once in a long Date range: list it once.
  const options = [...new Map(occasions.map((occasion) => [encodeMainOccasion(occasion), occasion])).values()];
  const [value, setValue] = useState(memory.mainOccasion ? encodeMainOccasion(memory.mainOccasion) : "");
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  if (options.length < 2) return null;
  const isNeutro = (occasion: Occasion) => occasion.theme === DEFAULT_THEME;
  // A choice that no longer applies (its Occasion was deleted, or is now Neutro) counts as automatic, as in `themeOfMemory`.
  const shown = options.some((occasion) => !isNeutro(occasion) && encodeMainOccasion(occasion) === value) ? value : "";

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
        value={shown}
        disabled={pending}
        onChange={(event) => change(event.target.value)}
      >
        <option value="">{t.occasions.mainOccasionAutomatic}</option>
        {options.map((occasion) => (
          <option key={encodeMainOccasion(occasion)} value={encodeMainOccasion(occasion)} disabled={isNeutro(occasion)}>
            {isNeutro(occasion) ? t.occasions.mainOccasionNeutro(occasion.name) : occasion.name}
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
