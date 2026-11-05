"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadPath } from "@/routes";
import { t } from "@/strings";
import { button, errorText } from "../ui";

type Progress = { phase: "idle" } | { phase: "uploading"; percent: number } | { phase: "processing" };

/**
 * Uploads several photos and videos at once to a Memory, showing a progress
 * bar while they are sent and a "processing" state while the server converts
 * the photos. Videos are converted in the background afterwards; the Media
 * list shows their state.
 * Uses XMLHttpRequest because fetch can't report upload progress.
 */
const progressRow = "flex items-center gap-2 text-sm text-cocoa-soft";

export function MediaUpload({ memoryId }: { memoryId: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress>({ phase: "idle" });
  const [error, setError] = useState<string>();

  function upload(files: FileList) {
    if (!files.length) return;
    const form = new FormData();
    for (const file of files) form.append("files", file, file.name);

    setError(undefined);
    setProgress({ phase: "uploading", percent: 0 });
    const request = new XMLHttpRequest();
    request.open("POST", uploadPath(memoryId));
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

  const busy = progress.phase !== "idle";
  return (
    <div className="flex flex-col items-end gap-2">
      <label className={`${button} ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {t.media.addPhotos}
        <input
          type="file"
          multiple
          accept="image/*,.heic,.heif,video/*,.mov,.mp4,.m4v"
          disabled={busy}
          hidden
          onChange={(event) => {
            upload(event.target.files!);
            event.target.value = "";
          }}
        />
      </label>
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
    </div>
  );
}
