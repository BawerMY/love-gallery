import { t } from "@/strings";
import { HEART_PATH } from "./themes/Motif";

/** A heart, filled honey unless told otherwise. */
export function Heart({ size = 14, className = "fill-honey" }: { size?: number | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <path d={HEART_PATH} />
    </svg>
  );
}

/**
 * "Giulia ♥ Bawer" in handwriting, the heart drawn in red. Sized by the
 * caller's font size. The ♥ character is kept for screen readers and search.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  const { first, second } = t.common.wordmark;
  return (
    <p className={`inline-flex items-center gap-[0.25em] font-hand leading-none ${className}`}>
      {first}{" "}
      <Heart size="0.75em" className="fill-heart" />
      <span className="sr-only">♥</span> {second}
    </p>
  );
}
