"use client";

import { useState } from "react";
import { deleteYearlyOccasionAction } from "@/app/admin/actions";
import type { YearlyOccasion } from "@/gallery";
import { t } from "@/strings";
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
          <>
            <button
              type="button"
              className="secondary"
              aria-label={t.occasions.editYearly(occasion.name)}
              onClick={() => setMode("edit")}
            >
              {t.occasions.edit}
            </button>
            <button
              type="button"
              className="danger"
              aria-label={t.occasions.deleteLabel(occasion.name)}
              onClick={() => setMode("delete")}
            >
              {t.occasions.delete}
            </button>
          </>
        ) : null}
      </div>

      {mode === "edit" ? (
        <YearlyOccasionForm occasion={occasion} onDone={() => setMode("view")} />
      ) : null}

      {mode === "delete" ? (
        <form
          className={styles.confirm}
          action={deleteYearlyOccasionAction.bind(null, occasion.id)}
          role="alertdialog"
          aria-label={t.occasions.deleteLabel(occasion.name)}
        >
          <p>{t.occasions.deleteConfirm(occasion.name)}</p>
          <button type="submit" className="danger">
            {t.occasions.deleteYes}
          </button>
          <button type="button" className="secondary" onClick={() => setMode("view")}>
            {t.occasions.cancel}
          </button>
        </form>
      ) : null}
    </li>
  );
}
