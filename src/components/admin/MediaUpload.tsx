"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MediaCell } from "@/gallery/types";
import { uploadPath } from "@/routes";
import { t } from "@/strings";
import { errorText } from "../ui";

type Progress = { phase: "idle" } | { phase: "uploading"; percent: number } | { phase: "processing" };

/** Where an upload's items go: the tapped cell, skipping the cells the unsaved Layout takes. */
export type UploadTarget = { column: number; row: number; taken: MediaCell[] };

/** The file types the file picker offers. */
export const MEDIA_ACCEPT = "image/*,.heic,.heif,video/*,.mov,.mp4,.m4v";

/**
 * Uploads several photos and videos at once to a Memory, into the cell the
 * Curator tapped, keeping track of the progress while they are sent and of
 * the "processing" state while the server converts the photos. Videos are
 * converted in the background afterwards; their tiles show their state.
 * Uses XMLHttpRequest because fetch can't report upload progress.
 */
export function useMediaUpload(memoryId: string) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress>({ phase: "idle" });
  const [error, setError] = useState<string>();

  function upload(files: FileList, target: UploadTarget) {
    if (!files.length) return;
    const form = new FormData();
    for (const file of files) form.append("files", file, file.name);

    setError(undefined);
    setProgress({ phase: "uploading", percent: 0 });
    const request = new XMLHttpRequest();
    request.open("POST", uploadPath(memoryId, target));
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      setProgress(percent < 100 ? { phase: "uploading", percent } : { phase: "processing" });
    };
    request.upload.onload = () => setProgress({ phase: "processing" });
    request.onload = () => {
      setProgress({ phase: "idle" });
      if (request.status >= 200 && request.status < 300) {
        router.refresh();
      } else {
        setError((request.response as { error?: string } | null)?.error ?? t.media.uploadFailed);
      }
    };
    request.onerror = () => {
      setProgress({ phase: "idle" });
      setError(t.media.uploadFailed);
    };
    request.send(form);
  }

  return { upload, progress, error, busy: progress.phase !== "idle" };
}

const progressRow = "flex items-center gap-2 text-sm text-cocoa-soft";

/** How an upload is going, or why it failed. */
export function UploadStatus({ progress, error }: { progress: Progress; error?: string }) {
  return (
    <>
      {progress.phase === "uploading" ? (
        <div role="status" className={progressRow}>
          <progress max={100} value={progress.percent} />
          <span>{t.media.uploading(progress.percent)}</span>
        </div>
      ) : null}
      {progress.phase === "processing" ? (
        <div role="status" className={progressRow}>
          <progress />
          <span>{t.media.processing}</span>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className={errorText}>
          {error}
        </p>
      ) : null}
    </>
  );
}
