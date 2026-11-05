import { OccasionBadges } from "@/components/occasions/OccasionBadges";
import type { Memory, Occasion } from "@/gallery";
import { formatCities, formatDateRange, t } from "@/strings";

/**
 * The top of the Memory page: title, Cities, Date range and note.
 * Its Occasion badges sit below the Date range.
 */
export function MemoryHeader({ memory, occasions }: { memory: Memory; occasions: Occasion[] }) {
  return (
    <header className="mb-6">
      <h1 className="mb-1 text-3xl font-semibold">{memory.title ?? t.timeline.untitled}</h1>
      <p className="font-bold text-amber">{formatCities(memory.cities)}</p>
      <p className="text-cocoa-soft">{formatDateRange(memory.startDay, memory.endDay)}</p>
      <OccasionBadges occasions={occasions} />
      {memory.note ? <p className="mt-3 font-hand text-2xl whitespace-pre-line">{memory.note}</p> : null}
    </header>
  );
}
