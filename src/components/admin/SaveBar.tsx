"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { t } from "@/strings";
import { button, errorText, quietText } from "../ui";
import { useMemoryDraft } from "./MemoryDraft";

/**
 * The bar fixed to the bottom of a Memory's Admin page, with its one Save:
 * whether there are unsaved changes, saving, saved, or why saving was refused.
 */
export function SaveBar() {
  const { dirty, pending, status, save } = useMemoryDraft();
  const message = pending
    ? t.admin.saving
    : status.error
      ? undefined
      : dirty
        ? t.admin.unsavedChanges
        : status.saved
          ? t.admin.saved
          : t.admin.noChanges;

  return (
    <section
      aria-label={t.admin.saveBar}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-cocoa/10 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(59_42_47/0.25)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3">
        {status.error && !pending ? (
          <p role="alert" className={`${errorText} min-w-0 text-sm`}>
            {status.error}
          </p>
        ) : (
          <p role="status" className={`${dirty ? "m-0 font-semibold text-amber" : quietText} min-w-0 text-sm`}>
            {message}
          </p>
        )}
        <button type="button" className={`${button} px-6`} onClick={save} disabled={pending || !dirty}>
          {t.admin.save}
        </button>
      </div>
    </section>
  );
}

/** A link away from a Memory's Admin page that asks first when there are unsaved changes. */
export function LeaveLink(props: ComponentProps<typeof Link>) {
  const { dirty } = useMemoryDraft();
  return (
    <Link
      {...props}
      onClick={(event) => {
        if (dirty && !window.confirm(t.admin.leaveUnsaved)) event.preventDefault();
      }}
    />
  );
}
