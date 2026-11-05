"use client";

import { useState } from "react";
import { t } from "@/strings";
import { dangerButton, secondaryButton } from "../ui";

type Props = {
  /** The text of the button that asks to delete. */
  label: string;
  /** The accessible name of that button and of the confirmation, when it must say more than `label`. */
  name?: string;
  /** What the Curator is asked before anything is deleted. */
  question: string;
  /** The server action that deletes, run only once confirmed. */
  action: () => Promise<void>;
  /** The style of the button that asks to delete. */
  variant?: "danger" | "secondary";
  /** Told when the confirmation opens or closes, e.g. to hide other buttons meanwhile. */
  onConfirmingChange?: (confirming: boolean) => void;
};

/**
 * A delete button that asks first: pressing it shows the question in its
 * place, with "Sì, elimina" to delete and "Annulla" to go back.
 */
export function ConfirmDeleteButton({ label, name = label, question, action, variant = "danger", onConfirmingChange }: Props) {
  const [confirming, setConfirming] = useState(false);
  const show = (value: boolean) => {
    setConfirming(value);
    onConfirmingChange?.(value);
  };

  if (!confirming) {
    return (
      <button type="button" className={variant === "danger" ? dangerButton : secondaryButton} aria-label={name === label ? undefined : name} onClick={() => show(true)}>
        {label}
      </button>
    );
  }

  return (
    <form className="flex basis-full flex-wrap gap-2" action={action} role="alertdialog" aria-label={name}>
      <p className="mb-1 basis-full">{question}</p>
      <button type="submit" className={dangerButton}>
        {t.admin.deleteYes}
      </button>
      <button type="button" className={secondaryButton} onClick={() => show(false)}>
        {t.admin.deleteNo}
      </button>
    </form>
  );
}
