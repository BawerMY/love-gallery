import { isOutsideDateRange, readingOrder, type MediaItem, type Memory } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";
import { MEDIA_KINDS } from "../media-kinds";
import { emptyText } from "../ui";
import { DeleteMediaButton } from "./DeleteMediaButton";
import { RefreshWhileProcessing } from "./RefreshWhileProcessing";

/**
 * The Media of a Memory on its Admin page, in Layout reading order, each
 * with a gentle warning when captured outside the Date range and a delete
 * button. Videos still converting show as processing (the page refreshes
 * until they are done); a failed conversion shows as failed.
 */
export function AdminMediaList({ memory }: { memory: Memory }) {
  if (!memory.media.length) return <p className={emptyText}>{t.media.noMedia}</p>;

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
        {readingOrder(memory.media).map((item, index) => (
          <li key={item.id} className="flex flex-col gap-1.5">
            <Preview memoryId={memory.id} item={item} position={index + 1} />
            {isOutsideDateRange(memory, item) ? <p className="text-sm text-amber">{t.media.outsideDateRange}</p> : null}
            <DeleteMediaButton memoryId={memory.id} mediaId={item.id} kind={item.kind} />
          </li>
        ))}
      </ul>
      {memory.media.some((item) => item.status === "processing") ? <RefreshWhileProcessing /> : null}
    </>
  );
}

/** The square box of a Media preview, ready or not. */
const previewBox = "aspect-square rounded-lg bg-butter";

function Preview({ memoryId, item, position }: { memoryId: string; item: MediaItem; position: number }) {
  if (item.status !== "ready") {
    return (
      <div role="status" className={`${previewBox} flex items-center justify-center p-2 text-center text-sm ${item.status === "failed" ? "text-danger" : "text-cocoa-soft"}`}>
        {item.status === "processing" ? t.media.itemProcessing : t.media.itemFailed}
      </div>
    );
  }
  return (
    // A plain <img>: Media comes from the session-protected Media route, not next/image.
    <img
      src={mediaPath(memoryId, item.files.thumbnail)}
      alt={MEDIA_KINDS[item.kind].alt(position)}
      className={`${previewBox} w-full object-cover`}
      loading="lazy"
      decoding="async"
    />
  );
}
