"use client";

import { useActionState, useId, useState } from "react";
import {
  createYearlyOccasionAction,
  updateYearlyOccasionAction,
  type YearlyOccasionFormState,
} from "@/app/admin/actions";
import type { YearlyOccasion } from "@/gallery";
import { t } from "@/strings";
import styles from "./occasions.module.css";

type Props = {
  /** The Yearly occasion being edited, or nothing when adding one. */
  occasion?: YearlyOccasion;
  /** Called after an edit is saved, or when the Curator cancels it. */
  onDone?: () => void;
};

/** The name, day, month and optional first year of a Yearly occasion. */
export function YearlyOccasionForm({ occasion, onDone }: Props) {
  const id = useId();
  const [name, setName] = useState(occasion?.name ?? "");
  const [day, setDay] = useState(occasion ? String(occasion.day) : "");
  const [month, setMonth] = useState(occasion ? String(occasion.month) : "1");
  const [firstYear, setFirstYear] = useState(occasion?.firstYear ? String(occasion.firstYear) : "");
  const [edited, setEdited] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (previous: YearlyOccasionFormState, form: FormData) => {
      const result = occasion
        ? await updateYearlyOccasionAction(occasion.id, previous, form)
        : await createYearlyOccasionAction(previous, form);
      if (result.saved && occasion) onDone?.();
      if (result.saved && !occasion) {
        setName("");
        setDay("");
        setMonth("1");
        setFirstYear("");
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
      className={styles.form}
      aria-label={occasion ? t.occasions.editYearly(occasion.name) : t.occasions.newYearly}
      action={(form) => {
        setEdited(false);
        return formAction(form);
      }}
    >
      <label htmlFor={`${id}-name`}>{t.occasions.nameLabel}</label>
      <input id={`${id}-name`} name="name" required value={name} onChange={change(setName)} />

      <div className={styles.fields}>
        <div>
          <label htmlFor={`${id}-day`}>{t.occasions.dayLabel}</label>
          <input
            id={`${id}-day`}
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
        <div>
          <label htmlFor={`${id}-month`}>{t.occasions.monthLabel}</label>
          <select id={`${id}-month`} name="month" value={month} onChange={change(setMonth)}>
            {t.occasions.monthNames.map((monthName, index) => (
              <option key={monthName} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor={`${id}-first-year`}>
        {t.occasions.firstYearLabel} <small>({t.occasions.firstYearHint})</small>
      </label>
      <input
        id={`${id}-first-year`}
        name="firstYear"
        type="number"
        inputMode="numeric"
        min={1}
        max={9999}
        value={firstYear}
        onChange={change(setFirstYear)}
      />

      {state.error ? (
        <p role="alert" className={styles.error}>
          {state.error}
        </p>
      ) : null}
      {state.saved && !edited && !pending && !occasion ? (
        <p role="status" className={styles.saved}>
          {t.occasions.saved}
        </p>
      ) : null}

      <div className={styles.buttons}>
        <button type="submit" disabled={pending}>
          {pending ? t.occasions.saving : occasion ? t.occasions.save : t.occasions.add}
        </button>
        {occasion ? (
          <button type="button" className="secondary" onClick={onDone}>
            {t.occasions.cancel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
