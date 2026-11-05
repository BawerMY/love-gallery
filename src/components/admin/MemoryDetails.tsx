"use client";

import { t } from "@/strings";
import { MainOccasionSelect } from "../occasions/MainOccasionSelect";
import { adminCard, adminHeading, formStack } from "../ui";
import { useMemoryDraft } from "./MemoryDraft";
import { MemoryFields } from "./MemoryForm";

type Props = {
  citySuggestions: string[];
  /** A Date range suggested from the Media's capture days, offered when it differs. */
  suggestedRange?: { startDay: string; endDay: string };
};

/** The details card of a Memory's Admin page: its title, Cities, Date range and note, and its Main occasion. */
export function MemoryDetails({ citySuggestions, suggestedRange }: Props) {
  const { details, setDetails } = useMemoryDraft();
  return (
    <section aria-labelledby="details-heading" className={adminCard}>
      <h2 id="details-heading" className={adminHeading}>
        {t.admin.detailsHeading}
      </h2>
      <div className={formStack}>
        <MemoryFields value={details} onChange={setDetails} citySuggestions={citySuggestions} suggestedRange={suggestedRange} />
        <MainOccasionSelect />
      </div>
    </section>
  );
}
