import { occasionsOfMemory, type Memory, type Occasion } from "@/gallery";
import { t } from "@/strings";
import { adminHeading, emptyText, quietText } from "../ui";
import { OccasionPicker } from "./OccasionPicker";
import { SortableOccasionList } from "./SortableOccasionList";

type Props = {
  memory: Memory;
  /** The list of Occasions, alphabetically (see `listOccasions`). */
  occasions: Occasion[];
};

/**
 * The section of a Memory's Admin page with its Occasions, in badge order,
 * to reorder by drag and drop, each with a button to take it off this Memory
 * only, and a picker of the Occasions it doesn't have yet.
 */
export function MemoryOccasionsSection({ memory, occasions }: Props) {
  const own = occasionsOfMemory(memory, occasions);
  const available = occasions.filter((occasion) => !memory.occasionIds.includes(occasion.id));

  return (
    <section aria-labelledby="memory-occasions-heading">
      <h2 id="memory-occasions-heading" className={adminHeading}>
        {t.occasions.memoryHeading}
      </h2>
      {own.length ? (
        <SortableOccasionList memoryId={memory.id} occasions={own} />
      ) : (
        <p className={emptyText}>{t.occasions.memoryNone}</p>
      )}
      {available.length ? (
        <OccasionPicker memoryId={memory.id} available={available} />
      ) : (
        <p className={`${quietText} mt-3`}>{occasions.length ? t.occasions.pickNoneLeft : t.occasions.pickListEmpty}</p>
      )}
    </section>
  );
}
