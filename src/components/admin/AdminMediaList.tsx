import { isOutsideDateRange, readingOrder, type Memory } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";
import { DeleteMediaButton } from "./DeleteMediaButton";

/**
 * The Media of a Memory on its Admin page, in Layout reading order, each
 * with a gentle warning when captured outside the Date range and a delete
 * button.
 */
export function AdminMediaList({ memory }: { memory: Memory }) {
  if (!memory.media.length) return <p className="empty">{t.media.noMedia}</p>;

  return (
    <ul className="admin-media-list">
      {readingOrder(memory.media).map((item, index) => (
        <li key={item.id}>
          {/* A plain <img>: Media comes from the session-protected Media route, not next/image. */}
          <img
            src={mediaPath(memory.id, item.files.thumbnail)}
            alt={t.media.photoAlt(index + 1)}
            loading="lazy"
            decoding="async"
          />
          {isOutsideDateRange(memory, item) ? <p className="warning">{t.media.outsideDateRange}</p> : null}
          <DeleteMediaButton memoryId={memory.id} mediaId={item.id} />
        </li>
      ))}
    </ul>
  );
}
