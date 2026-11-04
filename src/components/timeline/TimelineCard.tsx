import Link from "next/link";
import type { Memory } from "@/gallery";
import { formatCities, formatDateRange, t } from "@/strings";
import { TimelineCardCover } from "./TimelineCardCover";

/**
 * One Memory on the Timeline: its cover, title, Cities and Date range.
 * Tapping it opens the Memory page. Occasion badges go below the Date range.
 */
export function TimelineCard({ memory }: { memory: Memory }) {
  return (
    <Link href={`/memories/${memory.id}`} className="timeline-card">
      <TimelineCardCover memory={memory} />
      <div className="timeline-card-body">
        <h2>{memory.title ?? t.timeline.untitled}</h2>
        <p className="cities">{formatCities(memory.cities)}</p>
        <p className="date-range">{formatDateRange(memory.startDay, memory.endDay)}</p>
      </div>
    </Link>
  );
}
