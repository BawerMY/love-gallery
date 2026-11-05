"use client";

import { DEFAULT_THEME } from "@/gallery/themes";
import { t } from "@/strings";
import { useMemoryDraft } from "../admin/MemoryDraft";
import { field, formStack } from "../ui";

/**
 * The "Occasione principale" selector of a Memory's Admin page: "Automatica"
 * first, then each non-Neutro Occasion of the draft in badge order (a Neutro
 * one has no Theme to give). Shown only when there's a real choice: two or
 * more non-Neutro Occasions. Saved with the rest of the page.
 */
export function MainOccasionSelect() {
  const { occasions, mainOccasionId, setMainOccasionId } = useMemoryDraft();
  const options = occasions.filter((occasion) => occasion.theme !== DEFAULT_THEME);
  if (options.length < 2) return null;

  return (
    <div className={`${formStack} mt-2`}>
      <label htmlFor="main-occasion">
        {t.occasions.mainOccasionLabel} <small className="text-cocoa-soft">({t.occasions.mainOccasionHint})</small>
      </label>
      <select className={field} id="main-occasion" value={mainOccasionId} onChange={(event) => setMainOccasionId(event.target.value)}>
        <option value="">{t.occasions.mainOccasionAutomatic}</option>
        {options.map((occasion) => (
          <option key={occasion.id} value={occasion.id}>
            {occasion.name}
          </option>
        ))}
      </select>
    </div>
  );
}
