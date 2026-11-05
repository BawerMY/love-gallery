import type { Day } from "@/gallery";
import { t } from "@/strings";

/**
 * The month and year on the Timeline's left rail, handwritten, beside the
 * first Memory of a month. Shows the month short ("mar", "2025") and reads
 * it whole ("marzo 2025").
 */
export function TimelineMonthMarker({ day }: { day: Day }) {
  const month = t.occasions.monthNames[Number(day.slice(5, 7)) - 1];
  const year = day.slice(0, 4);
  return (
    <p className="m-0 inline-flex flex-col items-center rounded-[10px] bg-cream p-1 font-hand leading-none">
      <span aria-hidden="true" className="text-[1.45rem] text-cocoa sm:text-[1.8rem]">
        {month.slice(0, 3)}
      </span>
      <span aria-hidden="true" className="text-[1.05rem] text-amber sm:text-[1.25rem]">
        {year}
      </span>
      <span className="sr-only">{t.timeline.monthMarker(month, year)}</span>
    </p>
  );
}
