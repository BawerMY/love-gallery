import { t } from "@/strings";

/** The line between two Timeline cards, with the days apart written on it. */
export function TimelineGap({ days }: { days: number }) {
  return (
    <div className="relative flex h-18 items-center justify-center">
      <div className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-honey" aria-hidden="true" />
      <span className="relative bg-cream px-2 py-1 font-hand text-xl text-cocoa-soft">{t.timeline.daysApart(days)}</span>
    </div>
  );
}
