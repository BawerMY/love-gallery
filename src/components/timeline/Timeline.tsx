import { daysApart, occasionsOfMemory, themeOfMemory, type Memory, type YearlyOccasion } from "@/gallery";
import { ScrollToBottom } from "./ScrollToBottom";
import { TimelineCard } from "./TimelineCard";
import { TimelineGap } from "./TimelineGap";

/**
 * Every Memory as a vertical chain of cards, oldest at the top, linked by
 * lines that say how many days apart the couple were. Opens at the bottom.
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
      <ol className="mx-auto max-w-[520px] pb-6">
        {memories.map((memory, index) => (
          <li key={memory.id}>
            {index > 0 ? <TimelineGap days={daysApart(memories[index - 1], memory)} /> : null}
            <TimelineCard
              memory={memory}
              occasions={occasionsOfMemory(memory, yearlyOccasions)}
              theme={themeOfMemory(memory, yearlyOccasions).theme}
            />
          </li>
        ))}
      </ol>
      <ScrollToBottom />
    </>
  );
}
