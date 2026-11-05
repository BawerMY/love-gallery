"use client";

import { deleteOneOffOccasionAction } from "@/app/admin/actions";
import type { OneOffOccasion } from "@/gallery";
import { formatDateRange, t } from "@/strings";
import { ConfirmDeleteButton } from "../admin/ConfirmDeleteButton";
import { occasionItem, occasionSummary } from "../ui";

/** One One-off occasion on a Memory's Admin page, with a confirmed delete. */
export function OneOffOccasionItem({ memoryId, occasion }: { memoryId: string; occasion: OneOffOccasion }) {
  return (
    <li className={occasionItem}>
      <div className={occasionSummary}>
        <span className="flex min-w-0 flex-1 flex-col">
          <strong>{occasion.name}</strong>
          <small className="text-cocoa-soft">{formatDateRange(occasion.day, occasion.day)}</small>
        </span>
        <ConfirmDeleteButton
          label={t.occasions.delete}
          name={t.occasions.deleteLabel(occasion.name)}
          question={t.occasions.oneOffDeleteConfirm(occasion.name)}
          action={deleteOneOffOccasionAction.bind(null, memoryId, occasion.id)}
        />
      </div>
    </li>
  );
}
