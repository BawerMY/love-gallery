import Link from "next/link";
import type { Memory } from "@/gallery";
import { emptyText, list, listCard } from "../ui";
import { formatCities, formatDateRange, t } from "@/strings";

/** Every Memory on the Admin page, newest first, each opening its edit page. */
export function AdminMemoryList({ memories }: { memories: Memory[] }) {
  if (!memories.length) return <p className={emptyText}>{t.admin.noMemories}</p>;

  return (
    <ul className={list}>
      {[...memories].reverse().map((memory) => (
        <li key={memory.id}>
          <Link href={`/admin/memories/${memory.id}`} className={`${listCard} flex flex-col no-underline`}>
            <strong>{memory.title ?? t.timeline.untitled}</strong>
            <span className="text-sm text-cocoa-soft">{formatCities(memory.cities)}</span>
            <span className="text-sm text-cocoa-soft">{formatDateRange(memory.startDay, memory.endDay)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
