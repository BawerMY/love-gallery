import { daysApart, type Memory } from "@/gallery";
import { ScrollToBottom } from "./ScrollToBottom";
import { TimelineCard } from "./TimelineCard";
import { TimelineGap } from "./TimelineGap";

/**
 * Every Memory as a vertical chain of cards, oldest at the top, linked by
 * lines that say how many days apart the couple were. Opens at the bottom.
 */
export function Timeline({ memories }: { memories: Memory[] }) {
  return (
    <>
      <ol className="timeline-chain">
        {memories.map((memory, index) => (
          <li key={memory.id}>
            {index > 0 ? <TimelineGap days={daysApart(memories[index - 1], memory)} /> : null}
            <TimelineCard memory={memory} />
          </li>
        ))}
      </ol>
      <ScrollToBottom />
    </>
  );
}
