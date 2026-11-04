import type { Memory } from "@/gallery";
import { t } from "@/strings";

/**
 * Where a Timeline card shows the Memory's cover. Until Media exist this is
 * a placeholder of the same shape.
 */
export function TimelineCardCover({ memory: _memory }: { memory: Memory }) {
  return (
    <div className="timeline-card-cover placeholder" aria-hidden="true">
      <span>{t.timeline.coverPlaceholder}</span>
    </div>
  );
}
