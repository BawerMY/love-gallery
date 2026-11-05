import { t } from "@/strings";

const HEART_PATH =
  "M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.6.7-1.4 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z";

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
