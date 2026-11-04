import { OccasionBadges } from "@/components/occasions/OccasionBadges";
import type { Memory, Occasion } from "@/gallery";
import { formatCities, formatDateRange, t } from "@/strings";

/**
 * The top of the Memory page: title, Cities, Date range and note.
 * Its Occasion badges sit below the Date range.
 */
export function MemoryHeader({ memory, occasions }: { memory: Memory; occasions: Occasion[] }) {
  return (
    <header className="memory-header">
      <h1>{memory.title ?? t.timeline.untitled}</h1>
      <p className="cities">{formatCities(memory.cities)}</p>
      <p className="date-range">{formatDateRange(memory.startDay, memory.endDay)}</p>
      <OccasionBadges occasions={occasions} />
      {memory.note ? <p className="note">{memory.note}</p> : null}
    </header>
  );
}
