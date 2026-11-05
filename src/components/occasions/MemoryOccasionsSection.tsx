import { occasionsNotOnMemory, occasionsOfMemory, type Memory, type Occasion } from "@/gallery";
import { t } from "@/strings";
import { adminHeading, emptyText, quietText } from "../ui";
import { OccasionForm } from "./OccasionForm";
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
 * only; a picker of the Occasions it doesn't have yet; and a form to create
 * a new one on the spot.
 */
export function MemoryOccasionsSection({ memory, occasions }: Props) {
  const memoryOccasions = occasionsOfMemory(memory, occasions);
  const available = occasionsNotOnMemory(memory, occasions);

  return (
    <section aria-labelledby="memory-occasions-heading">
      <h2 id="memory-occasions-heading" className={adminHeading}>
        {t.occasions.memoryHeading}
      </h2>
      {memoryOccasions.length ? (
        <SortableOccasionList memoryId={memory.id} occasions={memoryOccasions} />
      ) : (
        <p className={emptyText}>{t.occasions.memoryNone}</p>
      )}
      {available.length ? (
        <OccasionPicker memoryId={memory.id} available={available} />
      ) : (
        <p className={`${quietText} mt-3`}>{occasions.length ? t.occasions.pickNoneLeft : t.occasions.pickListEmpty}</p>
      )}
      <OccasionForm memoryId={memory.id} />
    </section>
  );
}
