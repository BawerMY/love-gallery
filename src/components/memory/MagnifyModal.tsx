"use client";

import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { MediaItem } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";
import { MEDIA_KINDS } from "../media-kinds";
import { useVideoPlayback } from "./playback";
import { SoundOffIcon, SoundOnIcon } from "./VideoTile";

type Props = {
  memoryId: string;
  item: MediaItem;
  position: number;
  /** The grid tile the item grows out of on opening and shrinks back into on closing. */
  tile: HTMLElement;
  onClose: () => void;
};

/** The round ✕ and sound buttons over the dark backdrop. */
const roundButton = "grid size-10 cursor-pointer place-items-center rounded-full bg-white/15 p-0 text-white";

/** How far down, in CSS pixels, a swipe must travel to close the modal. */
const SWIPE_CLOSE = 80;

/** How long the item takes to grow out of its tile, or shrink back into it. */
const MORPH_MS = 300;
const MORPH_EASING = "cubic-bezier(0.2, 0.7, 0.2, 1)";

/**
 * The two ends of the grow: `media` drawn over `tile` and cropped to it, as the
 * tile's cover fit shows it, then `media` where it sits in the modal.
 */
function morphFrames(media: HTMLElement, tile: HTMLElement): Keyframe[] {
  const from = tile.getBoundingClientRect();
  const to = media.getBoundingClientRect();
  const scale = Math.max(from.width / to.width, from.height / to.height);
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  // The crop is drawn before the scale, so it's measured in the modal's size.
  const cropX = Math.max(0, (to.width - from.width / scale) / 2);
  const cropY = Math.max(0, (to.height - from.height / scale) / 2);
  const radius = parseFloat(getComputedStyle(media).borderTopLeftRadius) || 0;
  return [
    {
      transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
      clipPath: `inset(${cropY}px ${cropX}px round ${radius / scale}px)`,
    },
    { transform: "none", clipPath: `inset(0px 0px round ${radius}px)` },
  ];
}

/**
 * Grows the magnified item out of its tile ("in") or shrinks it back ("out"),
 * fading the backdrop and the buttons with it. Resolves once it's done, at
 * once when the Partner prefers reduced motion.
 */
function morph(dialog: HTMLDialogElement, tile: HTMLElement, direction: "in" | "out"): Promise<void> {
  const media = dialog.querySelector<HTMLElement>("[data-magnified]");
  if (!media || matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  // Closing mid-grow shrinks from wherever the item has got to.
  for (const running of dialog.getAnimations({ subtree: true })) running.finish();

  const frames = morphFrames(media, tile);
  const fade = [{ opacity: 0 }, { opacity: 1 }];
  const options: KeyframeAnimationOptions = {
    duration: MORPH_MS,
    easing: MORPH_EASING,
    direction: direction === "in" ? "normal" : "reverse",
    // Shrunk back, the item stays on its tile until the modal goes.
    fill: direction === "in" ? "backwards" : "forwards",
  };
  dialog.animate(fade, { ...options, pseudoElement: "::backdrop" });
  for (const chrome of dialog.querySelectorAll("[data-magnify-chrome]")) chrome.animate(fade, options);
  return media
    .animate(frames, options)
    .finished.then(() => {})
    .catch(() => {});
}
/**
 * One Media item magnified over the page. Grid videos are held paused while
 * it's open. A video carries on from the grid video's moment with its mute
 * state, and hands its position back to the grid video on closing.
 * Closes with ✕, a tap on the backdrop, Esc or a swipe down. The item grows
 * out of its grid tile on opening and shrinks back into it on closing; the
 * tile stays empty in between.
 */
export function MagnifyModal({ memoryId, item, position, tile, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const { pauseAll, resumeAll, seekTo, positionOf } = useVideoPlayback();
  const isVideo = item.kind === "video";
  const [start] = useState(() => (isVideo ? (positionOf(item.id) ?? 0) : 0));
  const pressedBackdrop = useRef(false);
  const swipe = useRef<{ pointerId: number; y: number; dy: number } | null>(null);
  const closing = useRef(false);

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    tile.style.visibility = "hidden";
    pauseAll();
    morph(element, tile, "in");
    return () => {
      element.close();
      tile.style.visibility = "";
    };
  }, [pauseAll, tile]);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (isVideo && video.current) seekTo(item.id, video.current.currentTime);
    morph(dialog.current!, tile, "out").then(() => {
      tile.style.visibility = "";
      resumeAll();
      onClose();
    });
  };

  const moveStage = (dy: number) => {
    stage.current!.style.transform = dy ? `translateY(${dy}px)` : "";
    stage.current!.style.opacity = dy ? String(Math.max(0.3, 1 - dy / 400)) : "";
  };

  const swipeHandlers = {
    onPointerDown(event: PointerEvent) {
      pressedBackdrop.current = event.target === stage.current;
      if (event.pointerType === "mouse" || !event.isPrimary) return;
      if (event.target instanceof Element && event.target.closest("button, input")) return;
      swipe.current = { pointerId: event.pointerId, y: event.clientY, dy: 0 };
    },
    onPointerMove(event: PointerEvent) {
      const current = swipe.current;
      if (current?.pointerId !== event.pointerId) return;
      current.dy = Math.max(0, event.clientY - current.y);
      moveStage(current.dy);
    },
    onPointerUp(event: PointerEvent) {
      const current = swipe.current;
      if (current?.pointerId !== event.pointerId) return;
      swipe.current = null;
      if (current.dy > SWIPE_CLOSE) close();
      else moveStage(0);
    },
    onPointerCancel() {
      swipe.current = null;
      moveStage(0);
    },
  };

  const label = MEDIA_KINDS[item.kind].magnifiedLabel(position);
  return (
    <dialog
      ref={dialog}
      // Fills the screen over a dark backdrop, and takes every touch for the swipe down.
      className="fixed inset-0 m-0 size-full max-h-none max-w-none touch-none overflow-hidden overscroll-contain border-0 bg-transparent p-0 text-white select-none [-webkit-touch-callout:none] backdrop:bg-cocoa/95"
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onContextMenu={(event) => event.preventDefault()}
      {...swipeHandlers}
    >
      <div
        ref={stage}
        className="grid size-full place-items-center px-3 pt-14 pb-6"
        onClick={(event) => {
          if (event.target === event.currentTarget && pressedBackdrop.current) close();
        }}
      >
        {isVideo ? (
          <MagnifiedVideo ref={video} memoryId={memoryId} item={item} position={position} start={start} />
        ) : (
          <img
            data-magnified
            className="block h-auto max-h-[calc(100dvh_-_80px)] w-auto max-w-full rounded-tile object-contain [-webkit-user-drag:none]"
            src={mediaPath(memoryId, MEDIA_KINDS[item.kind].still(item.files))}
            alt={MEDIA_KINDS[item.kind].alt(position)}
            width={item.width}
            height={item.height}
            draggable={false}
          />
        )}
      </div>
      <button
        type="button"
        data-magnify-chrome
        className={`${roundButton} absolute top-2.5 right-2.5`} aria-label={t.magnify.close} title={t.magnify.close} onClick={close}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </dialog>
  );
}

type VideoProps = {
  ref: RefObject<HTMLVideoElement | null>;
  memoryId: string;
  item: MediaItem;
  position: number;
  /** Where to start, in seconds: the grid video's moment. */
  start: number;
};

/** The magnified video: plays on from `start`, shares the page's mute state, and has a draggable progress bar. */
function MagnifiedVideo({ ref, memoryId, item, position, start }: VideoProps) {
  const { unmutedId, setUnmuted } = useVideoPlayback();
  const unmuted = unmutedId === item.id;
  const [time, setTime] = useState(start);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    ref.current!.muted = !unmuted;
  }, [ref, unmuted]);

  const begin = (video: HTMLVideoElement) => {
    video.currentTime = start;
    setDuration(video.duration);
    video.play().catch(() => {
      // Playing with sound wasn't allowed: carry on muted.
      if (video.muted) return;
      setUnmuted(null);
      video.muted = true;
      video.play().catch(() => {});
    });
  };

  const poster = MEDIA_KINDS[item.kind].poster(item.files);
  const soundLabel = unmuted ? t.media.mute(position) : t.media.unmute(position);
  return (
    <div className="flex max-w-full flex-col items-stretch gap-2">
      <video
        ref={ref}
        data-magnified
        className="block h-auto max-h-[calc(100dvh_-_140px)] w-auto max-w-full rounded-tile object-contain [-webkit-user-drag:none]"
        src={mediaPath(memoryId, item.files.display)}
        poster={poster && mediaPath(memoryId, poster)}
        aria-label={MEDIA_KINDS[item.kind].alt(position)}
        width={item.width}
        height={item.height}
        preload="auto"
        playsInline
        muted
        loop
        onLoadedMetadata={(event) => begin(event.currentTarget)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
      />
      <div className="flex items-center gap-2.5" data-magnify-chrome>
        <input
          type="range"
          className="m-0 h-8 min-w-0 flex-1 accent-honey"
          aria-label={t.magnify.progress}
          min={0}
          max={Number.isFinite(duration) ? duration : 0}
          step="any"
          value={time}
          onChange={(event) => {
            const seconds = Number(event.currentTarget.value);
            ref.current!.currentTime = seconds;
            setTime(seconds);
          }}
        />
        <button
          type="button"
          className={roundButton}
          aria-label={soundLabel}
          title={soundLabel}
          onClick={() => setUnmuted(unmuted ? null : item.id)}
        >
          {unmuted ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
      </div>
    </div>
  );
}
