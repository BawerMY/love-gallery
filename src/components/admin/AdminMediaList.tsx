import { isOutsideDateRange, readingOrder, type MediaItem, type Memory } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";
import { DeleteMediaButton } from "./DeleteMediaButton";
import { RefreshWhileProcessing } from "./RefreshWhileProcessing";

/**
 * The Media of a Memory on its Admin page, in Layout reading order, each
 * with a gentle warning when captured outside the Date range and a delete
 * button. Videos still converting show as processing (the page refreshes
 * until they are done); a failed conversion shows as failed.
 */
export function AdminMediaList({ memory }: { memory: Memory }) {
  if (!memory.media.length) return <p className="empty">{t.media.noMedia}</p>;

  return (
    <>
      <ul className="admin-media-list">
        {readingOrder(memory.media).map((item, index) => (
          <li key={item.id}>
            <Preview memoryId={memory.id} item={item} position={index + 1} />
            {isOutsideDateRange(memory, item) ? <p className="warning">{t.media.outsideDateRange}</p> : null}
            <DeleteMediaButton memoryId={memory.id} mediaId={item.id} kind={item.kind} />
          </li>
        ))}
      </ul>
      {memory.media.some((item) => item.status === "processing") ? <RefreshWhileProcessing /> : null}
    </>
  );
}

function Preview({ memoryId, item, position }: { memoryId: string; item: MediaItem; position: number }) {
  if (item.status !== "ready") {
    return (
      <div role="status" className={`admin-media-status ${item.status}`}>
        {item.status === "processing" ? t.media.itemProcessing : t.media.itemFailed}
      </div>
    );
  }
  return (
    // A plain <img>: Media comes from the session-protected Media route, not next/image.
    <img
      src={mediaPath(memoryId, item.files.thumbnail)}
      alt={item.kind === "video" ? t.media.videoAlt(position) : t.media.photoAlt(position)}
      loading="lazy"
      decoding="async"
    />
  );
}
