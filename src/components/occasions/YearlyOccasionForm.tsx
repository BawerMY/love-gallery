"use client";

import { useActionState, useId, useState } from "react";
import {
  createYearlyOccasionAction,
  updateYearlyOccasionAction,
  type FormState,
} from "@/app/admin/actions";
import type { YearlyOccasion } from "@/gallery";
import { DEFAULT_THEME, type ThemeKey } from "@/gallery/themes";
import { t } from "@/strings";
import { ThemeSelect } from "../themes/ThemeSelect";
import { button, errorText, field, formStack, quietText, secondaryButton } from "../ui";

/** One of the side-by-side day and month fields. */
const fieldColumn = "flex min-w-0 flex-1 flex-col gap-2";

type Props = {
  /** The Yearly occasion being edited, or nothing when adding one. */
  occasion?: YearlyOccasion;
  /** Called after an edit is saved, or when the Curator cancels it. */
  onDone?: () => void;
};

/** The name, day, month, optional first year and Theme of a Yearly occasion. */
export function YearlyOccasionForm({ occasion, onDone }: Props) {
  const id = useId();
  const [name, setName] = useState(occasion?.name ?? "");
  const [day, setDay] = useState(occasion ? String(occasion.day) : "");
  const [month, setMonth] = useState(occasion ? String(occasion.month) : "1");
  const [firstYear, setFirstYear] = useState(occasion?.firstYear ? String(occasion.firstYear) : "");
  const [theme, setTheme] = useState<ThemeKey>(occasion?.theme ?? DEFAULT_THEME);
  const [edited, setEdited] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (previous: FormState, form: FormData) => {
      const result = occasion
        ? await updateYearlyOccasionAction(occasion.id, previous, form)
        : await createYearlyOccasionAction(previous, form);
      if (result.saved && occasion) onDone?.();
      if (result.saved && !occasion) {
        setName("");
        setDay("");
        setMonth("1");
        setFirstYear("");
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
      aria-label={occasion ? t.occasions.editYearly(occasion.name) : t.occasions.newYearly}
      action={(form) => {
        setEdited(false);
        return formAction(form);
      }}
    >
      <label htmlFor={`${id}-name`}>{t.occasions.nameLabel}</label>
      <input id={`${id}-name`} className={field} name="name" required value={name} onChange={change(setName)} />

      <div className="flex gap-3">
        <div className={fieldColumn}>
          <label htmlFor={`${id}-day`}>{t.occasions.dayLabel}</label>
          <input
            id={`${id}-day`}
            className={field}
            name="day"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            required
            value={day}
            onChange={change(setDay)}
          />
        </div>
        <div className={fieldColumn}>
          <label htmlFor={`${id}-month`}>{t.occasions.monthLabel}</label>
          <select className={field} id={`${id}-month`} name="month" value={month} onChange={change(setMonth)}>
            {t.occasions.monthNames.map((monthName, index) => (
              <option key={monthName} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor={`${id}-first-year`}>
        {t.occasions.firstYearLabel} <small className="text-cocoa-soft">({t.occasions.firstYearHint})</small>
      </label>
      <input
        id={`${id}-first-year`}
        className={field}
        name="firstYear"
        type="number"
        inputMode="numeric"
        min={1}
        max={9999}
        value={firstYear}
        onChange={change(setFirstYear)}
      />

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
