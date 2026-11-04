"use client";

import { useState } from "react";
import { deleteYearlyOccasionAction } from "@/app/admin/actions";
import type { YearlyOccasion } from "@/gallery";
import { t } from "@/strings";
import { ConfirmDeleteButton } from "../admin/ConfirmDeleteButton";
import styles from "./occasions.module.css";
import { YearlyOccasionForm } from "./YearlyOccasionForm";

/** One Yearly occasion on the Admin page, with its edit form and a confirmed delete. */
export function YearlyOccasionItem({ occasion }: { occasion: YearlyOccasion }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");

  return (
    <li className={styles.item}>
      <div className={styles.summary}>
        <span>
          <strong>{occasion.name}</strong>
          <small>
            {t.occasions.dayMonth(occasion.month, occasion.day)}
            {occasion.firstYear ? ` · ${t.occasions.sinceYear(occasion.firstYear)}` : null}
          </small>
        </span>
        {mode === "view" ? (
          <button
            type="button"
            className="secondary"
            aria-label={t.occasions.editYearly(occasion.name)}
            onClick={() => setMode("edit")}
          >
            {t.occasions.edit}
          </button>
        ) : null}
        {mode !== "edit" ? (
          <ConfirmDeleteButton
            label={t.occasions.delete}
            name={t.occasions.deleteLabel(occasion.name)}
            question={t.occasions.deleteConfirm(occasion.name)}
            action={deleteYearlyOccasionAction.bind(null, occasion.id)}
            onConfirmingChange={(confirming) => setMode(confirming ? "delete" : "view")}
          />
        ) : null}
      </div>

      {mode === "edit" ? (
        <YearlyOccasionForm occasion={occasion} onDone={() => setMode("view")} />
      ) : null}
    </li>
  );
}
