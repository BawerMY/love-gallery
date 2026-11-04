"use client";

import { useState } from "react";
import { deleteMediaAction } from "@/app/admin/actions";
import type { MediaItem } from "@/gallery";
import { t } from "@/strings";

type Props = { memoryId: string; mediaId: string; kind: MediaItem["kind"] };

/** Deletes one Media item and its files, but only after the Curator confirms. */
export function DeleteMediaButton({ memoryId, mediaId, kind }: Props) {
  const [confirming, setConfirming] = useState(false);
  const label = kind === "video" ? t.media.deleteVideo : t.media.deletePhoto;

  if (!confirming) {
    return (
      <button type="button" className="secondary" onClick={() => setConfirming(true)}>
        {label}
      </button>
    );
  }

  return (
    <form
      className="delete-confirm"
      action={deleteMediaAction.bind(null, memoryId, mediaId)}
      role="alertdialog"
      aria-label={label}
    >
      <p>{kind === "video" ? t.media.deleteVideoConfirm : t.media.deleteConfirm}</p>
      <button type="submit" className="danger">
        {t.admin.deleteYes}
      </button>
      <button type="button" className="secondary" onClick={() => setConfirming(false)}>
        {t.admin.deleteNo}
      </button>
    </form>
  );
}
