"use client";

import { deleteMemoryAction } from "@/app/admin/actions";
import { t } from "@/strings";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

/** Deletes a Memory and its files, but only after the Curator confirms. */
export function DeleteMemoryButton({ memoryId }: { memoryId: string }) {
  return (
    <ConfirmDeleteButton
      label={t.admin.deleteMemory}
      question={t.admin.deleteConfirm}
      action={deleteMemoryAction.bind(null, memoryId)}
    />
  );
}
