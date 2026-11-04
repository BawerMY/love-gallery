import { t } from "@/strings";

/** The line between two Timeline cards, with the days apart written on it. */
export function TimelineGap({ days }: { days: number }) {
  return (
    <div className="timeline-gap">
      <span>{t.timeline.daysApart(days)}</span>
    </div>
  );
}
