"use client";

import { useState } from "react";
import { deleteMemoryAction } from "@/app/admin/actions";
import { t } from "@/strings";

/** Deletes a Memory and its files, but only after the Curator confirms. */
export function DeleteMemoryButton({ memoryId }: { memoryId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="danger" onClick={() => setConfirming(true)}>
        {t.admin.deleteMemory}
      </button>
    );
  }

  return (
    <form className="delete-confirm" action={deleteMemoryAction.bind(null, memoryId)} role="alertdialog" aria-label={t.admin.deleteMemory}>
      <p>{t.admin.deleteConfirm}</p>
      <button type="submit" className="danger">
        {t.admin.deleteYes}
      </button>
      <button type="button" className="secondary" onClick={() => setConfirming(false)}>
        {t.admin.deleteNo}
      </button>
    </form>
  );
}
