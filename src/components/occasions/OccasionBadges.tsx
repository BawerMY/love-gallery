import { THEMES, type Occasion } from "@/gallery";
import { t } from "@/strings";
import { Motif } from "../themes/Motif";

/**
 * A Memory's Occasions as badges, in the order given (by day, see
 * `occasionsOfMemory`). Each badge wears its own Occasion's Theme: its
 * colours and a tiny motif. Yearly and One-off occasions look the same; each
 * badge carries its kind in `data-kind` and its Theme in `data-theme`.
 * Shows nothing when there are none.
 */
export function OccasionBadges({ occasions }: { occasions: Occasion[] }) {
  if (!occasions.length) return null;

  return (
    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t.occasions.badgesLabel}>
      {occasions.map((occasion) => {
        const theme = THEMES[occasion.theme];
        return (
          <li
            key={`${occasion.kind}:${occasion.id}:${occasion.day}`}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold"
            style={{ backgroundColor: theme.badge.background, color: theme.badge.text }}
            data-kind={occasion.kind}
            data-theme={occasion.theme}
          >
            {/* A single-colour motif takes the badge's text colour, so it always stands out. */}
            <Motif
              kind={theme.motif}
              size={11}
              colors={theme.motif === "confetti" ? theme.motifColors : [theme.badge.text]}
            />
            {t.occasions.badge(occasion.name, occasion.number)}
          </li>
        );
      })}
    </ul>
  );
}
