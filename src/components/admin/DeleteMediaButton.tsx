"use client";

import { useState } from "react";
import { deleteMediaAction } from "@/app/admin/actions";
import { t } from "@/strings";

/** Deletes one Media item and its files, but only after the Curator confirms. */
export function DeleteMediaButton({ memoryId, mediaId }: { memoryId: string; mediaId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="secondary" onClick={() => setConfirming(true)}>
        {t.media.deletePhoto}
      </button>
    );
  }

  return (
    <form
      className="delete-confirm"
      action={deleteMediaAction.bind(null, memoryId, mediaId)}
      role="alertdialog"
      aria-label={t.media.deletePhoto}
    >
      <p>{t.media.deleteConfirm}</p>
      <button type="submit" className="danger">
        {t.admin.deleteYes}
      </button>
      <button type="button" className="secondary" onClick={() => setConfirming(false)}>
        {t.admin.deleteNo}
      </button>
    </form>
  );
}
