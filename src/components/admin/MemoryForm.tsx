"use client";

import { useActionState, useState } from "react";
import type { MemoryFormState } from "@/app/admin/actions";
import type { Memory } from "@/gallery";
import { t } from "@/strings";
import { CityList } from "./CityList";

type Props = {
  /** The Memory being edited, or nothing when creating one. */
  memory?: Memory;
  action: (state: MemoryFormState, form: FormData) => Promise<MemoryFormState>;
  citySuggestions: string[];
  /** Show "saved" straight away, e.g. right after creating the Memory. */
  saved?: boolean;
  /** A Date range suggested from the Media's capture days, offered when it differs. */
  suggestedRange?: { startDay: string; endDay: string };
};

/** The title, Cities, Date range and note of a Memory, for creating or editing it. */
export function MemoryForm({ memory, action, citySuggestions, saved = false, suggestedRange }: Props) {
  const [state, formAction, pending] = useActionState(action, { saved });
  const [title, setTitle] = useState(memory?.title ?? "");
  const [cities, setCities] = useState(memory?.cities ?? [""]);
  const [startDay, setStartDay] = useState(memory?.startDay ?? "");
  const [endDay, setEndDay] = useState(memory?.endDay ?? "");
  const [note, setNote] = useState(memory?.note ?? "");
  const [edited, setEdited] = useState(false);

  function change<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setEdited(true);
    };
  }

  function changeStartDay(value: string) {
    change(setStartDay)(value);
    if (!endDay || endDay < value) setEndDay(value);
  }

  return (
    <form
      className="memory-form"
      action={(form) => {
        setEdited(false);
        return formAction(form);
      }}
    >
      <label htmlFor="memory-title">
        {t.admin.titleLabel} <small>({t.admin.titleHint})</small>
      </label>
      <input
        id="memory-title"
        name="title"
        value={title}
        onChange={(event) => change(setTitle)(event.target.value)}
      />

      <CityList cities={cities} onChange={change(setCities)} suggestions={citySuggestions} />

      <div className="date-fields">
        <div>
          <label htmlFor="memory-start">{t.admin.startDayLabel}</label>
          <input
            id="memory-start"
            name="startDay"
            type="date"
            required
            value={startDay}
            onChange={(event) => changeStartDay(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="memory-end">{t.admin.endDayLabel}</label>
          <input
            id="memory-end"
            name="endDay"
            type="date"
            required
            min={startDay || undefined}
            value={endDay}
            onChange={(event) => change(setEndDay)(event.target.value)}
          />
        </div>
      </div>

      {suggestedRange &&
      (suggestedRange.startDay !== startDay || suggestedRange.endDay !== endDay) ? (
        <p className="date-suggestion">
          <span>{t.media.suggestedDateRange(suggestedRange.startDay, suggestedRange.endDay)}</span>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              change(setStartDay)(suggestedRange.startDay);
              setEndDay(suggestedRange.endDay);
            }}
          >
            {t.media.useSuggestedDateRange}
          </button>
        </p>
      ) : null}

      <label htmlFor="memory-note">
        {t.admin.noteLabel} <small>({t.admin.titleHint})</small>
      </label>
      <textarea
        id="memory-note"
        name="note"
        rows={4}
        value={note}
        onChange={(event) => change(setNote)(event.target.value)}
      />

      {state.error ? (
        <p role="alert" className="error">
          {state.error}
        </p>
      ) : null}
      {state.saved && !edited && !pending ? (
        <p role="status" className="saved">
          {t.admin.saved}
        </p>
      ) : null}

      <button type="submit" disabled={pending}>
        {pending ? t.admin.saving : t.admin.save}
      </button>
    </form>
  );
}
