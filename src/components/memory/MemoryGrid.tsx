import type { CSSProperties } from "react";
import { readingOrder, type Memory } from "@/gallery";
import { Magnifiable, MagnifyProvider } from "./magnify";
import { MediaTile } from "./MediaTile";

/**
 * A Memory's Media in its Layout: a 3-column grid of square cells where each
 * item covers the cells of its Layout cell. Empty cells stay empty.
 * Items are rendered in reading order, so screen readers follow the Layout.
 * A long press or a mouse click on an item magnifies it.
 */
export function MemoryGrid({ memory }: { memory: Memory }) {
  const items = readingOrder(memory.media.filter((item) => item.status === "ready"));
  if (!items.length) return null;

  return (
    <div className="memory-grid">
      <MagnifyProvider memoryId={memory.id}>
        <ol className="memory-grid-cells">
          {items.map((item, index) => (
            <li key={item.id} className="memory-grid-cell" style={cellStyle(item.cell)}>
              <Magnifiable item={item} position={index + 1}>
                <MediaTile memoryId={memory.id} item={item} position={index + 1} />
              </Magnifiable>
            </li>
          ))}
        </ol>
      </MagnifyProvider>
    </div>
  );
}

function cellStyle(cell: Memory["media"][number]["cell"]): CSSProperties {
  return {
    gridColumn: `${cell.column + 1} / span ${cell.width}`,
    gridRow: `${cell.row + 1} / span ${cell.height}`,
  };
}
