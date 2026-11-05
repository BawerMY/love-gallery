import { isOutsideDateRange, readingOrder, type Memory } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";
import { RefreshWhileProcessing } from "../admin/RefreshWhileProcessing";
import { adminCard, adminHeading } from "../ui";
import { LayoutEditor, type EditorItem } from "./LayoutEditor";

/**
 * The "Galleria" section of a Memory's Admin page: the Layout grid, where
 * the Curator taps an empty cell to add Media there and deletes an item from
 * its tile (both at once), and arranges the items and chooses the cover
 * (saved with the rest of the page). While a video is still converting the
 * page refreshes until it is done.
 */
export function LayoutSection({ memory }: { memory: Memory }) {
  const items: EditorItem[] = readingOrder(memory.media).map((item, index) => ({
    id: item.id,
    kind: item.kind,
    status: item.status,
    position: index + 1,
    cell: item.cell,
    thumbnail: item.status === "ready" ? mediaPath(memory.id, item.files.thumbnail) : undefined,
    outsideDateRange: isOutsideDateRange(memory, item),
  }));

  return (
    <section aria-labelledby="layout-heading" className={adminCard}>
      <h2 id="layout-heading" className={adminHeading}>
        {t.layout.heading}
      </h2>
      <LayoutEditor memoryId={memory.id} items={items} />
      {memory.media.some((item) => item.status === "processing") ? <RefreshWhileProcessing /> : null}
    </section>
  );
}
