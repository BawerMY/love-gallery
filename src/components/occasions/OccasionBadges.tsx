import type { Occasion } from "@/gallery";
import { t } from "@/strings";
import styles from "./occasions.module.css";

/**
 * A Memory's Occasions as badges, in the order given (by day, see
 * `occasionsOfMemory`). Yearly and One-off occasions look the same, but each
 * badge carries its kind in `data-kind`. Shows nothing when there are none.
 */
export function OccasionBadges({ occasions }: { occasions: Occasion[] }) {
  if (!occasions.length) return null;

  return (
    <ul className={styles.badges} aria-label={t.occasions.badgesLabel}>
      {occasions.map((occasion) => (
        <li
          key={`${occasion.kind}:${occasion.id}:${occasion.day}`}
          className={styles.badge}
          data-kind={occasion.kind}
        >
          {t.occasions.badge(occasion.name, occasion.number)}
        </li>
      ))}
    </ul>
  );
}
