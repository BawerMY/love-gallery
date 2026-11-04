import type { YearlyOccasion } from "@/gallery";
import { t } from "@/strings";
import styles from "./occasions.module.css";
import { YearlyOccasionForm } from "./YearlyOccasionForm";
import { YearlyOccasionItem } from "./YearlyOccasionItem";

/** The Admin page section listing every Yearly occasion, with a form to add one. */
export function YearlyOccasionsSection({ occasions }: { occasions: YearlyOccasion[] }) {
  return (
    <section aria-labelledby="yearly-occasions-heading">
      <h2 id="yearly-occasions-heading">{t.occasions.yearlyHeading}</h2>
      {occasions.length ? (
        <ul className={styles.list}>
          {occasions.map((occasion) => (
            <YearlyOccasionItem key={occasion.id} occasion={occasion} />
          ))}
        </ul>
      ) : (
        <p className="empty">{t.occasions.noYearly}</p>
      )}
      <h3>{t.occasions.newYearly}</h3>
      <YearlyOccasionForm />
    </section>
  );
}
