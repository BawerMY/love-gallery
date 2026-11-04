import Link from "next/link";
import type { Memory } from "@/gallery";
import { formatCities, formatDateRange, t } from "@/strings";

/** Every Memory on the Admin page, newest first, each opening its edit page. */
export function AdminMemoryList({ memories }: { memories: Memory[] }) {
  if (!memories.length) return <p className="empty">{t.admin.noMemories}</p>;

  return (
    <ul className="admin-memory-list">
      {[...memories].reverse().map((memory) => (
        <li key={memory.id}>
          <Link href={`/admin/memories/${memory.id}`}>
            <strong>{memory.title ?? t.timeline.untitled}</strong>
            <span>{formatCities(memory.cities)}</span>
            <span>{formatDateRange(memory.startDay, memory.endDay)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
