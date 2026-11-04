import type { Memory } from "@/gallery";
import { formatCities, formatDateRange, t } from "@/strings";

/**
 * The top of the Memory page: title, Cities, Date range and note.
 * Occasion badges go below the Date range.
 */
export function MemoryHeader({ memory }: { memory: Memory }) {
  return (
    <header className="memory-header">
      <h1>{memory.title ?? t.timeline.untitled}</h1>
      <p className="cities">{formatCities(memory.cities)}</p>
      <p className="date-range">{formatDateRange(memory.startDay, memory.endDay)}</p>
      {memory.note ? <p className="note">{memory.note}</p> : null}
    </header>
  );
}
