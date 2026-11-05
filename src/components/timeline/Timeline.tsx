import { daysApart, occasionsOfMemory, themeOfMemory, type Memory, type YearlyOccasion } from "@/gallery";
import { Reveal } from "../motion/Reveal";
import { rail, railLine } from "./rail";
import { ScrollToBottom } from "./ScrollToBottom";
import { TimelineCard } from "./TimelineCard";
import { TimelineGap } from "./TimelineGap";
import { TimelineMonthMarker } from "./TimelineMonthMarker";

/**
 * Every Memory as a journal, oldest at the top: a left rail with a month
 * marker wherever the month changes, and the entries linked by a dashed line
 * that says how many days apart the couple were. Opens at the bottom.
 */
export function Timeline({
  memories,
  yearlyOccasions,
}: {
  memories: Memory[];
  yearlyOccasions: YearlyOccasion[];
}) {
  return (
    <>
      <Reveal className="relative mx-auto max-w-[640px] pt-2 pb-6">
        <span className={railLine} aria-hidden="true" />
        <ol className="relative m-0 list-none p-0">
          {memories.map((memory, index) => {
            const previous = memories[index - 1];
            const newMonth = !previous || previous.startDay.slice(0, 7) !== memory.startDay.slice(0, 7);
            return (
              <li key={memory.id}>
                {previous ? <TimelineGap days={daysApart(previous, memory)} /> : null}
                <div className={rail}>
                  <div className="pt-1 text-center">{newMonth ? <TimelineMonthMarker day={memory.startDay} /> : null}</div>
                  <TimelineCard
                    memory={memory}
                    occasions={occasionsOfMemory(memory, yearlyOccasions)}
                    theme={themeOfMemory(memory, yearlyOccasions).theme}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </Reveal>
      <ScrollToBottom />
    </>
  );
}
