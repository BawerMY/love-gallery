import Link from "next/link";
import { OccasionBadges } from "@/components/occasions/OccasionBadges";
import type { Memory, Occasion } from "@/gallery";
import { formatCities, formatDateRange, t } from "@/strings";
import { TimelineCardCover } from "./TimelineCardCover";

/**
 * One Memory on the Timeline: its cover, title, Cities and Date range.
 * Tapping it opens the Memory page. Its Occasion badges sit below the Date range.
 */
export function TimelineCard({ memory, occasions }: { memory: Memory; occasions: Occasion[] }) {
  return (
    <Link href={`/memories/${memory.id}`} className="timeline-card">
      <TimelineCardCover memory={memory} />
      <div className="timeline-card-body">
        <h2>{memory.title ?? t.timeline.untitled}</h2>
        <p className="cities">{formatCities(memory.cities)}</p>
        <p className="date-range">{formatDateRange(memory.startDay, memory.endDay)}</p>
        <OccasionBadges occasions={occasions} />
      </div>
    </Link>
  );
}
