import { removeOccasionFromMemoryAction } from "@/app/admin/actions";
import { occasionsOfMemory, THEMES, type Memory, type Occasion } from "@/gallery";
import { t } from "@/strings";
import { Motif } from "../themes/Motif";
import { adminHeading, emptyText, list, occasionItem, occasionSummary, quietText, secondaryButton } from "../ui";
import { NewMemoryOccasionForm } from "./NewMemoryOccasionForm";
import { OccasionPicker } from "./OccasionPicker";

type Props = {
  memory: Memory;
  /** The list of Occasions, alphabetically (see `listOccasions`). */
  occasions: Occasion[];
};

/**
 * The section of a Memory's Admin page with its Occasions, in badge order,
 * each with a button to take it off this Memory only, and a picker of the
 * Occasions it doesn't have yet, and a form to create a new one on the spot.
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
        <ul className={list}>
          {own.map((occasion) => (
            <li key={occasion.id} className={occasionItem} data-theme={occasion.theme}>
              <div className={occasionSummary}>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <Motif theme={THEMES[occasion.theme]} size={12} />
                  <strong>{occasion.name}</strong>
                </span>
                <form action={removeOccasionFromMemoryAction.bind(null, memory.id, occasion.id)}>
                  <button type="submit" className={secondaryButton} aria-label={t.occasions.removeLabel(occasion.name)}>
                    {t.occasions.remove}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={emptyText}>{t.occasions.memoryNone}</p>
      )}
      {available.length ? (
        <OccasionPicker memoryId={memory.id} available={available} />
      ) : (
        <p className={`${quietText} mt-3`}>{occasions.length ? t.occasions.pickNoneLeft : t.occasions.pickListEmpty}</p>
      )}
      <NewMemoryOccasionForm memoryId={memory.id} />
    </section>
  );
}
