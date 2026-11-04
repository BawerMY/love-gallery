import { coverOf, readingOrder, type Memory } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";
import { LayoutEditor, type EditorItem } from "./LayoutEditor";

/**
 * The section of a Memory's Admin page where the Curator arranges its Media
 * on the Layout grid and chooses its cover.
 */
export function LayoutSection({ memory }: { memory: Memory }) {
  const cover = coverOf(memory);
  const items: EditorItem[] = readingOrder(memory.media).map((item, index) => ({
    id: item.id,
    position: index + 1,
    cell: item.cell,
    thumbnail: item.status === "ready" ? mediaPath(memory.id, item.files.thumbnail) : undefined,
  }));

  return (
    <section aria-labelledby="layout-heading">
      <h2 id="layout-heading">{t.layout.heading}</h2>
      {items.length ? (
        <LayoutEditor
          // Never keyed on the Media: the editor keeps its unsaved changes while
          // the page refreshes and merges in new, changed or deleted items.
          key={memory.id}
          memoryId={memory.id}
          items={items}
          coverId={cover?.id}
          coverChosen={memory.coverMediaId !== undefined && cover?.id === memory.coverMediaId}
        />
      ) : (
        <p className="empty">{t.layout.noMedia}</p>
      )}
    </section>
  );
}
