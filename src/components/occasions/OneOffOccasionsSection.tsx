import type { Memory } from "@/gallery";
import { t } from "@/strings";
import styles from "./occasions.module.css";
import { OneOffOccasionForm } from "./OneOffOccasionForm";
import { OneOffOccasionItem } from "./OneOffOccasionItem";

/** The section of a Memory's Admin page listing its One-off occasions, with a form to add one. */
export function OneOffOccasionsSection({ memory }: { memory: Memory }) {
  const occasions = [...memory.oneOffOccasions].sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));

  return (
    <section aria-labelledby="one-off-occasions-heading">
      <h2 id="one-off-occasions-heading">{t.occasions.oneOffHeading}</h2>
      {occasions.length ? (
        <ul className={styles.list}>
          {occasions.map((occasion) => (
            <OneOffOccasionItem key={occasion.id} memoryId={memory.id} occasion={occasion} />
          ))}
        </ul>
      ) : (
        <p className="empty">{t.occasions.noOneOff}</p>
      )}
      <h3>{t.occasions.newOneOff}</h3>
      {/* Keyed by the Date range, so the day picker restarts when the range changes. */}
      <OneOffOccasionForm key={`${memory.startDay}:${memory.endDay}`} memory={memory} />
    </section>
  );
}
