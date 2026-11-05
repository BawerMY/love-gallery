"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import type { MediaItem } from "@/gallery";
import { MagnifyModal } from "./MagnifyModal";

type Target = { item: MediaItem; position: number };

/** The item to magnify, and the grid tile it grows from and shrinks back into. */
type Opened = Target & { tile: HTMLElement };

const MagnifyContext = createContext<((opened: Opened) => void) | null>(null);

/**
 * Lets the `Magnifiable` items inside it open the magnify modal, one item at a
 * time. Must sit inside `VideoPlaybackProvider`.
 */
export function MagnifyProvider({ memoryId, children }: { memoryId: string; children: ReactNode }) {
  const [target, setTarget] = useState<Opened | null>(null);
  return (
    <MagnifyContext value={setTarget}>
      {children}
      {target && (
        <MagnifyModal
          key={target.item.id}
          memoryId={memoryId}
          item={target.item}
          position={target.position}
          tile={target.tile}
          onClose={() => setTarget(null)}
        />
      )}
    </MagnifyContext>
  );
}

/**
 * A grid tile that magnifies on a tap or a click. A touch that scrolls the
 * page sends no click, so scrolling never opens anything; the tile's own
 * buttons (the unmute button) are left alone.
 */
export function Magnifiable({ item, position, children }: Target & { children: ReactNode }) {
  const open = useContext(MagnifyContext);
  if (!open) throw new Error("Magnifiable must be used inside MagnifyProvider");
  const tile = useRef<HTMLDivElement>(null);
  return (
    // No text selection, drag or iOS callout; touch-action stays default so the page still scrolls.
    <div
      ref={tile}
      className="size-full cursor-zoom-in select-none [-webkit-touch-callout:none] [&_:is(img,video)]:[-webkit-user-drag:none]"
      onClick={(event) => {
        if (!onControl(event.target)) open({ item, position, tile: tile.current! });
      }}
      // No image or video menu on a long press, and no dragging the image away.
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
}

/** A click on a control inside the tile (the unmute button) is left alone. */
const onControl = (target: EventTarget) => target instanceof Element && !!target.closest("button, a, input");
