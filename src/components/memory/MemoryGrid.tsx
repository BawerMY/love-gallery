import type { CSSProperties } from "react";
import { readingOrder, type Memory } from "@/gallery";
import { MediaTile } from "./MediaTile";

/**
 * A Memory's Media in its Layout: a 3-column grid of square cells where each
 * item covers the cells of its Layout cell. Empty cells stay empty.
 * Items are rendered in reading order, so screen readers follow the Layout.
 */
export function MemoryGrid({ memory }: { memory: Memory }) {
  const items = readingOrder(memory.media.filter((item) => item.status === "ready"));
  if (!items.length) return null;

  return (
    <div className="memory-grid">
      <ol className="memory-grid-cells">
        {items.map((item, index) => (
          <li key={item.id} className="memory-grid-cell" style={cellStyle(item.cell)}>
            <MediaTile memoryId={memory.id} item={item} position={index + 1} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function cellStyle(cell: Memory["media"][number]["cell"]): CSSProperties {
  return {
    gridColumn: `${cell.column + 1} / span ${cell.width}`,
    gridRow: `${cell.row + 1} / span ${cell.height}`,
  };
}
