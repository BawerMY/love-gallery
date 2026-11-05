"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { MediaItem } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";
import { useVideoPlayback } from "./playback";

type Props = { memoryId: string; item: MediaItem; position: number };

/** How far ahead of the screen a video starts loading its poster and file. */
const LOAD_AHEAD = "100% 0px";
/** How much of a video must be on screen for it to play. */
const VISIBLE_RATIO = 0.5;

/**
 * A video filling its tile. Nothing is fetched until it nears the screen;
 * then it plays muted and looping while at least half of it is visible, and
 * pauses (keeping its position) when it leaves. A video that leaves the
 * screen comes back muted. The button at the bottom right unmutes it, which
 * mutes every other video on the page.
 */
export function VideoTile({ memoryId, item, position }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const near = useIntersecting(ref, { rootMargin: LOAD_AHEAD }, true);
  const visible = useIntersecting(ref, { threshold: VISIBLE_RATIO });
  const { unmutedId, setUnmuted, pausedAll, register } = useVideoPlayback();
  const unmuted = unmutedId === item.id;

  useEffect(() => register(item.id, ref.current!), [register, item.id]);

  useEffect(() => {
    const video = ref.current!;
    if (near && visible && !pausedAll) video.play().catch(() => {});
    else video.pause();
  }, [near, visible, pausedAll]);

  // Leaving the screen silences it, so it comes back muted. Not while the
  // magnify modal is open: the modal owns the mute state then, and its video
  // may be this one, unmuted while this tile is mostly off screen.
  useEffect(() => {
    if (!visible && unmuted && !pausedAll) setUnmuted(null);
  }, [visible, unmuted, pausedAll, setUnmuted]);

  useEffect(() => {
    ref.current!.muted = !unmuted;
  }, [unmuted]);

  const label = unmuted ? t.media.mute(position) : t.media.unmute(position);
  return (
    <>
      <video
        ref={ref}
        className="block size-full object-cover"
        src={near ? mediaPath(memoryId, item.files.display) : undefined}
        poster={near ? mediaPath(memoryId, item.files.thumbnail) : undefined}
        aria-label={t.media.videoAlt(position)}
        width={item.width}
        height={item.height}
        preload={near ? "metadata" : "none"}
        playsInline
        muted
        loop
      />
      <button
        type="button"
        className="absolute right-1.5 bottom-1.5 grid size-8 cursor-pointer place-items-center rounded-full bg-black/50 text-white"
        aria-label={label}
        title={label}
        onClick={() => setUnmuted(unmuted ? null : item.id)}
      >
        {unmuted ? <SoundOnIcon /> : <SoundOffIcon />}
      </button>
    </>
  );
}

/** Whether the element intersects the screen under these options; `once` keeps it true after the first time. */
function useIntersecting(
  ref: RefObject<HTMLElement | null>,
  options: IntersectionObserverInit,
  once = false,
) {
  const [intersecting, setIntersecting] = useState(false);
  const { rootMargin, threshold } = options;
  useEffect(() => {
    const element = ref.current!;
    const observer = new IntersectionObserver(([entry]) => {
      const on = entry.isIntersecting && entry.intersectionRatio >= (typeof threshold === "number" ? threshold : 0);
      setIntersecting(on);
      if (on && once) observer.disconnect();
    }, { rootMargin, threshold });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold, once]);
  return intersecting;
}

export function SoundOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor" />
      <path d="m22 9-6 6M16 9l6 6" />
    </svg>
  );
}

export function SoundOnIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
    </svg>
  );
}
