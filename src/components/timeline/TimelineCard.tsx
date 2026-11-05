import Link from "next/link";
import { OccasionBadges } from "@/components/occasions/OccasionBadges";
import type { Memory, Occasion, ThemeKey } from "@/gallery";
import { formatCities, formatDateRange, t } from "@/strings";
import { TimelineCardCover } from "./TimelineCardCover";

/**
 * One Memory on the Timeline: its cover, title, Cities and Date range.
 * Tapping it opens the Memory page. Its Occasion badges sit below the Date range.
 * It carries the Memory's Theme (see `themeOfMemory`) in `data-theme`.
 */
export function TimelineCard({ memory, occasions, theme }: { memory: Memory; occasions: Occasion[]; theme: ThemeKey }) {
  return (
    <Link
      href={`/memories/${memory.id}`}
      className="block overflow-hidden rounded-card bg-white no-underline shadow-soft"
      data-theme={theme}
    >
      <TimelineCardCover memory={memory} />
      <div className="px-4 pt-3 pb-4">
        <h2 className="mb-1 text-xl font-semibold italic">{memory.title ?? t.timeline.untitled}</h2>
        <p className="font-bold text-amber">{formatCities(memory.cities)}</p>
        <p className="text-cocoa-soft">{formatDateRange(memory.startDay, memory.endDay)}</p>
        <OccasionBadges occasions={occasions} />
      </div>
    </Link>
  );
}
