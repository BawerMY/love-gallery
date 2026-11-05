"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/admin/actions";
import { t } from "@/strings";
import { button, errorText, formStack, secondaryButton, field } from "../ui";
import { CityList } from "./CityList";
import type { DetailsDraft } from "./MemoryDraft";

/** One of the side-by-side start and end day fields. */
const dateColumn = "flex min-w-0 flex-1 flex-col gap-2";

type FieldsProps = {
  value: DetailsDraft;
  onChange: (value: DetailsDraft) => void;
  citySuggestions: string[];
  /** A Date range suggested from the Media's capture days, offered when it differs. */
  suggestedRange?: { startDay: string; endDay: string };
};

/** The title, Cities, Date range and note of a Memory, as fields sent as `title`, `city`, `startDay`, `endDay` and `note`. */
export function MemoryFields({ value, onChange, citySuggestions, suggestedRange }: FieldsProps) {
  const { title, cities, startDay, endDay, note } = value;
  const set = (change: Partial<DetailsDraft>) => onChange({ ...value, ...change });

  return (
    <>
      <label htmlFor="memory-title">
        {t.admin.titleLabel} <small className="text-cocoa-soft">({t.admin.titleHint})</small>
      </label>
      <input className={field} id="memory-title" name="title" value={title} onChange={(event) => set({ title: event.target.value })} />

      <CityList cities={cities} onChange={(next) => set({ cities: next })} suggestions={citySuggestions} />

      <div className="flex gap-3">
        <div className={dateColumn}>
          <label htmlFor="memory-start">{t.admin.startDayLabel}</label>
          <input
            className={field}
            id="memory-start"
            name="startDay"
            type="date"
            required
            value={startDay}
            onChange={(event) => {
              const day = event.target.value;
              set({ startDay: day, endDay: !endDay || endDay < day ? day : endDay });
            }}
          />
        </div>
        <div className={dateColumn}>
          <label htmlFor="memory-end">{t.admin.endDayLabel}</label>
          <input
            className={field}
            id="memory-end"
            name="endDay"
            type="date"
            required
            min={startDay || undefined}
            value={endDay}
            onChange={(event) => set({ endDay: event.target.value })}
          />
        </div>
      </div>

      {suggestedRange && (suggestedRange.startDay !== startDay || suggestedRange.endDay !== endDay) ? (
        <p className="flex flex-wrap items-center gap-2 text-cocoa-soft">
          <span>{t.media.suggestedDateRange(suggestedRange.startDay, suggestedRange.endDay)}</span>
          <button type="button" className={secondaryButton} onClick={() => set(suggestedRange)}>
            {t.media.useSuggestedDateRange}
          </button>
        </p>
      ) : null}

      <label htmlFor="memory-note">
        {t.admin.noteLabel} <small className="text-cocoa-soft">({t.admin.titleHint})</small>
      </label>
      <textarea className={field} id="memory-note" name="note" rows={4} value={note} onChange={(event) => set({ note: event.target.value })} />
    </>
  );
}

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  citySuggestions: string[];
};

/** The form of the new-Memory page: its details, and a button that creates it. */
export function MemoryForm({ action, citySuggestions }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [details, setDetails] = useState<DetailsDraft>({ title: "", cities: [""], startDay: "", endDay: "", note: "" });

  return (
    <form className={formStack} action={formAction}>
      <MemoryFields value={details} onChange={setDetails} citySuggestions={citySuggestions} />
      {state.error ? (
        <p role="alert" className={errorText}>
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={`${button} mt-2`} disabled={pending}>
        {pending ? t.admin.saving : t.admin.save}
      </button>
    </form>
  );
}
