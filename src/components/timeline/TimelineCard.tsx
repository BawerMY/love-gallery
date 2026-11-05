import Link from "next/link";
import { OccasionBadges } from "@/components/occasions/OccasionBadges";
import { THEMES, type Memory, type Occasion, type ThemeKey } from "@/gallery";
import { formatCities, formatDateRange, t } from "@/strings";
import { TimelineCardCover } from "./TimelineCardCover";

/**
 * One Memory on the Timeline, as a wide journal entry: the cover across the
 * top, then the Date range, title, Cities, note and Occasion badges.
 * Tapping it opens the Memory page. It wears the Memory's Theme (see
 * `themeOfMemory`) as a thick left stripe and a soft tint, and carries it in
 * `data-theme`. It fades in the first time it's seen (see `Reveal`).
 */
export function TimelineCard({ memory, occasions, theme }: { memory: Memory; occasions: Occasion[]; theme: ThemeKey }) {
  const look = THEMES[theme];
  return (
    <Link
      href={`/memories/${memory.id}`}
      className="relative block overflow-hidden rounded-card pl-2 text-cocoa no-underline shadow-soft"
      style={{ backgroundColor: look.tint }}
      data-theme={theme}
      data-reveal
    >
      <span className="absolute inset-y-0 left-0 w-2" style={{ backgroundImage: look.stripe }} aria-hidden="true" />
      <TimelineCardCover memory={memory} />
      <div className="flex flex-col gap-1 px-4 pt-3 pb-4">
        <p className="m-0 text-[0.72rem] font-extrabold tracking-[0.14em] text-amber uppercase">
          {formatDateRange(memory.startDay, memory.endDay)}
        </p>
        <h2 className="m-0 text-[1.6rem] leading-tight font-semibold italic">{memory.title ?? t.timeline.untitled}</h2>
        <p className="m-0 font-bold text-cocoa-soft">{formatCities(memory.cities)}</p>
        {memory.note ? (
          <p className="m-0 line-clamp-2 font-hand text-[1.3rem] leading-snug text-cocoa-soft">{memory.note}</p>
        ) : null}
        <OccasionBadges occasions={occasions} />
      </div>
    </Link>
  );
}
