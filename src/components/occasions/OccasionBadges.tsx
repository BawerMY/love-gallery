import type { Occasion } from "@/gallery";
import { t } from "@/strings";

/**
 * A Memory's Occasions as badges, in the order given (by day, see
 * `occasionsOfMemory`). Yearly and One-off occasions look the same, but each
 * badge carries its kind in `data-kind`. Shows nothing when there are none.
 */
export function OccasionBadges({ occasions }: { occasions: Occasion[] }) {
  if (!occasions.length) return null;

  return (
    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t.occasions.badgesLabel}>
      {occasions.map((occasion) => (
        <li
          key={`${occasion.kind}:${occasion.id}:${occasion.day}`}
          className="rounded-full bg-butter px-2.5 py-0.5 text-sm font-bold text-amber"
          data-kind={occasion.kind}
        >
          {t.occasions.badge(occasion.name, occasion.number)}
        </li>
      ))}
    </ul>
  );
}
