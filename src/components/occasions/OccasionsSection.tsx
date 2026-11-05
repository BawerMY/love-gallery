import { countOccasionUses, type Memory, type Occasion } from "@/gallery";
import { t } from "@/strings";
import { adminHeading, adminSubheading, emptyText, list } from "../ui";
import { OccasionForm } from "./OccasionForm";
import { OccasionItem } from "./OccasionItem";

type Props = {
  /** The list of Occasions, alphabetically (see `listOccasions`). */
  occasions: Occasion[];
  /** Every Memory, to tell how many use each Occasion. */
  memories: Memory[];
};

/** The Admin page's "Occasioni" section: the list of Occasions, with a form to add one. */
export function OccasionsSection({ occasions, memories }: Props) {
  return (
    <section aria-labelledby="occasions-heading">
      <h2 id="occasions-heading" className={adminHeading}>
        {t.occasions.heading}
      </h2>
      {occasions.length ? (
        <ul className={list}>
          {occasions.map((occasion) => (
            <OccasionItem key={occasion.id} occasion={occasion} memoryCount={countOccasionUses(memories, occasion.id)} />
          ))}
        </ul>
      ) : (
        <p className={emptyText}>{t.occasions.none}</p>
      )}
      <h3 className={adminSubheading}>{t.occasions.newOccasion}</h3>
      <OccasionForm />
    </section>
  );
}
