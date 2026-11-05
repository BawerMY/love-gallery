import { THEMES } from "@/gallery";
import { t } from "@/strings";
import { Motif } from "../themes/Motif";
import { rail } from "./rail";

/**
 * The space between two Timeline entries: a honey heart on the rail's dashed
 * line, pulsing gently (still under reduced motion), with the days apart
 * handwritten beside it.
 */
export function TimelineGap({ days }: { days: number }) {
  return (
    <div className={`${rail} items-center py-3`}>
      <span className="mx-auto grid size-7 place-items-center rounded-full bg-cream" aria-hidden="true">
        <span className="inline-flex motion-safe:animate-heart-pulse">
          <Motif kind="heart" size={15} colors={THEMES.neutro.motifColors} />
        </span>
      </span>
      <span className="font-hand text-[1.35rem] leading-none text-amber">{t.timeline.daysApart(days)}</span>
    </div>
  );
}
