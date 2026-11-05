import type { CSSProperties } from "react";
import { readingOrder, type Memory } from "@/gallery";
import { Reveal } from "../motion/Reveal";
import { Magnifiable, MagnifyProvider } from "./magnify";
import { MediaTile } from "./MediaTile";

/**
 * A Memory's Media in its Layout: a 3-column grid of square cells where each
 * item covers the cells of its Layout cell. Empty cells stay empty.
 * Items are rendered in reading order, so screen readers follow the Layout.
 * A long press or a mouse click on an item magnifies it. Each tile fades in
 * the first time it scrolls into view.
 */
export function MemoryGrid({ memory }: { memory: Memory }) {
  const items = readingOrder(memory.media.filter((item) => item.status === "ready"));
  if (!items.length) return null;

  return (
    <Reveal className="@container [--grid-gap:6px]">
      <MagnifyProvider memoryId={memory.id}>
        <ol
          // Square cells: a row is as tall as a column is wide.
          className="grid auto-rows-[calc((100cqi_-_2_*_var(--grid-gap))_/_3)] grid-cols-3 gap-(--grid-gap)"
        >
          {items.map((item, index) => (
            // Only the tile's frame is styled: a Theme never tints or covers the photo.
            <li
              key={item.id}
              className="relative overflow-hidden rounded-tile bg-butter"
              style={cellStyle(item.cell)}
              data-reveal
            >
              <Magnifiable item={item} position={index + 1}>
                <MediaTile memoryId={memory.id} item={item} position={index + 1} />
              </Magnifiable>
            </li>
          ))}
        </ol>
      </MagnifyProvider>
    </Reveal>
  );
}

function cellStyle(cell: Memory["media"][number]["cell"]): CSSProperties {
  return {
    gridColumn: `${cell.column + 1} / span ${cell.width}`,
    gridRow: `${cell.row + 1} / span ${cell.height}`,
  };
}
