import { coverOf, type Memory } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";

/**
 * Where a Timeline card shows the Memory's cover (see `coverOf`). A Memory
 * with no ready Media shows a placeholder of the same shape.
 */
export function TimelineCardCover({ memory }: { memory: Memory }) {
  const cover = coverOf(memory);
  if (!cover) {
    return (
      <div className="timeline-card-cover placeholder" aria-hidden="true">
        <span>{t.timeline.coverPlaceholder}</span>
      </div>
    );
  }
  return (
    <div className="timeline-card-cover">
      {/* A plain <img>: Media comes from the session-protected Media route, not next/image. */}
      <img
        src={mediaPath(memory.id, cover.files.display)}
        alt=""
        width={cover.width}
        height={cover.height}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
