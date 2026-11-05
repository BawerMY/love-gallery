"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { MediaItem } from "@/gallery";
import { MagnifyModal } from "./MagnifyModal";

/** How long a touch must be held still to magnify. */
const PRESS_MS = 400;
/** How far, in CSS pixels, a touch may drift before it stops counting as a press. */
const PRESS_SLOP = 10;

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
 * A grid tile that magnifies on a long press (touch or pen held still for
 * about 400 ms) or on a mouse click. A quick tap, a touch that moves, and the
 * tile's own buttons do nothing here, so scrolling never opens anything.
 */
export function Magnifiable({ item, position, children }: Target & { children: ReactNode }) {
  const open = useContext(MagnifyContext);
  if (!open) throw new Error("Magnifiable must be used inside MagnifyProvider");
  const tile = useRef<HTMLDivElement>(null);
  const press = useLongPress(() => open({ item, position, tile: tile.current! }));
  return (
    // No text selection, drag or iOS callout; touch-action stays default so the page still scrolls.
    <div
      ref={tile}
      className="size-full cursor-zoom-in select-none [-webkit-touch-callout:none] [&_:is(img,video)]:[-webkit-user-drag:none]"
      {...press}
    >
      {children}
    </div>
  );
}

/** A pointer on a control inside the tile (the unmute button) is left alone. */
const onControl = (target: EventTarget) => target instanceof Element && !!target.closest("button, a, input");

function useLongPress(onPress: () => void) {
  const press = useRef<{ pointerId: number; x: number; y: number; timer: number } | null>(null);
  const lastPointer = useRef<string | null>(null);

  const cancel = () => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
  };
  useEffect(() => cancel, []);

  return {
    onPointerDown(event: PointerEvent) {
      lastPointer.current = event.pointerType;
      cancel();
      if (event.pointerType === "mouse" || !event.isPrimary || onControl(event.target)) return;
      const timer = window.setTimeout(() => {
        press.current = null;
        onPress();
      }, PRESS_MS);
      press.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, timer };
    },
    onPointerMove(event: PointerEvent) {
      const start = press.current;
      if (start?.pointerId !== event.pointerId) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > PRESS_SLOP) cancel();
    },
    // The browser taking the touch over for a scroll sends pointercancel.
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onClick(event: MouseEvent) {
      if (lastPointer.current === "mouse" && !onControl(event.target)) onPress();
    },
    // No image or video menu on a long press.
    onContextMenu(event: MouseEvent) {
      event.preventDefault();
    },
    onDragStart(event: DragEvent) {
      event.preventDefault();
    },
  };
}
