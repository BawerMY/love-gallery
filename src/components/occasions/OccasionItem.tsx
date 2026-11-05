"use client";

import { useState } from "react";
import { deleteOccasionAction } from "@/app/admin/actions";
import type { Occasion } from "@/gallery";
import { THEMES } from "@/gallery/themes";
import { t } from "@/strings";
import { ConfirmDeleteButton } from "../admin/ConfirmDeleteButton";
import { Motif } from "../themes/Motif";
import { occasionItem, occasionSummary, secondaryButton } from "../ui";
import { OccasionForm } from "./OccasionForm";

type Props = {
  occasion: Occasion;
  /** How many Memories have it: what the delete confirmation names. */
  uses: number;
};

/** One Occasion in the Admin page's list, with its edit form and a delete that says how many Memories use it. */
export function OccasionItem({ occasion, uses }: Props) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const theme = THEMES[occasion.theme];

  return (
    <li className={occasionItem} data-theme={occasion.theme}>
      <div className={occasionSummary}>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong>{occasion.name}</strong>
          <small className="inline-flex items-center gap-1 text-cocoa-soft">
            <Motif theme={theme} size={11} />
            {t.themes[occasion.theme]}
          </small>
        </span>
        {mode === "view" ? (
          <button
            type="button"
            className={secondaryButton}
            aria-label={t.occasions.editOccasion(occasion.name)}
            onClick={() => setMode("edit")}
          >
            {t.occasions.edit}
          </button>
        ) : null}
        {mode !== "edit" ? (
          <ConfirmDeleteButton
            label={t.occasions.delete}
            name={t.occasions.deleteLabel(occasion.name)}
            question={t.occasions.deleteConfirm(occasion.name, uses)}
            action={deleteOccasionAction.bind(null, occasion.id)}
            onConfirmingChange={(confirming) => setMode(confirming ? "delete" : "view")}
          />
        ) : null}
      </div>

      {mode === "edit" ? <OccasionForm occasion={occasion} onDone={() => setMode("view")} /> : null}
    </li>
  );
}
