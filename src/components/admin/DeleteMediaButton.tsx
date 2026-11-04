"use client";

import { deleteMediaAction } from "@/app/admin/actions";
import type { MediaItem } from "@/gallery";
import { MEDIA_KINDS } from "../media-kinds";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

type Props = { memoryId: string; mediaId: string; kind: MediaItem["kind"] };

/** Deletes one Media item and its files, but only after the Curator confirms. */
export function DeleteMediaButton({ memoryId, mediaId, kind }: Props) {
  return (
    <ConfirmDeleteButton
      label={MEDIA_KINDS[kind].deleteLabel}
      question={MEDIA_KINDS[kind].deleteQuestion}
      action={deleteMediaAction.bind(null, memoryId, mediaId)}
      variant="secondary"
    />
  );
}
