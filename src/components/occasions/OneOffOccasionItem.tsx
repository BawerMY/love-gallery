"use client";

import { useState } from "react";
import { deleteOneOffOccasionAction } from "@/app/admin/actions";
import type { OneOffOccasion } from "@/gallery";
import { formatDateRange, t } from "@/strings";
import styles from "./occasions.module.css";

/** One One-off occasion on a Memory's Admin page, with a confirmed delete. */
export function OneOffOccasionItem({ memoryId, occasion }: { memoryId: string; occasion: OneOffOccasion }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <li className={styles.item}>
      <div className={styles.summary}>
        <span>
          <strong>{occasion.name}</strong>
          <small>{formatDateRange(occasion.day, occasion.day)}</small>
        </span>
        {confirming ? null : (
          <button
            type="button"
            className="danger"
            aria-label={t.occasions.deleteLabel(occasion.name)}
            onClick={() => setConfirming(true)}
          >
            {t.occasions.delete}
          </button>
        )}
      </div>

      {confirming ? (
        <form
          className={styles.confirm}
          action={deleteOneOffOccasionAction.bind(null, memoryId, occasion.id)}
          role="alertdialog"
          aria-label={t.occasions.deleteLabel(occasion.name)}
        >
          <p>{t.occasions.oneOffDeleteConfirm(occasion.name)}</p>
          <button type="submit" className="danger">
            {t.occasions.deleteYes}
          </button>
          <button type="button" className="secondary" onClick={() => setConfirming(false)}>
            {t.occasions.cancel}
          </button>
        </form>
      ) : null}
    </li>
  );
}
