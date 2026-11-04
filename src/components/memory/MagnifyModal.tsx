"use client";

import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { MediaItem } from "@/gallery";
import { mediaPath } from "@/routes";
import { t } from "@/strings";
import { useVideoPlayback } from "./playback";
import { SoundOffIcon, SoundOnIcon } from "./VideoTile";

type Props = { memoryId: string; item: MediaItem; position: number; onClose: () => void };

/** How far down, in CSS pixels, a swipe must travel to close the modal. */
const SWIPE_CLOSE = 80;

/**
 * One Media item magnified over the page. Grid videos are held paused while
 * it's open. A video carries on from the grid video's moment with its mute
 * state, and hands its position back to the grid video on closing.
 * Closes with ✕, a tap on the backdrop, Esc or a swipe down.
 */
export function MagnifyModal({ memoryId, item, position, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const { pauseAll, resumeAll, seekTo, positionOf } = useVideoPlayback();
  const isVideo = item.kind === "video";
  const [start] = useState(() => (isVideo ? (positionOf(item.id) ?? 0) : 0));
  const pressedBackdrop = useRef(false);
  const swipe = useRef<{ pointerId: number; y: number; dy: number } | null>(null);

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    pauseAll();
    return () => element.close();
  }, [pauseAll]);

  const close = () => {
    if (isVideo && video.current) seekTo(item.id, video.current.currentTime);
    resumeAll();
    onClose();
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

  const label = isVideo ? t.magnify.videoLabel(position) : t.magnify.photoLabel(position);
  return (
    <dialog
      ref={dialog}
      className="magnify"
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
        className="magnify-stage"
        onClick={(event) => {
          if (event.target === event.currentTarget && pressedBackdrop.current) close();
        }}
      >
        {isVideo ? (
          <MagnifiedVideo ref={video} memoryId={memoryId} item={item} position={position} start={start} />
        ) : (
          <img
            className="magnify-media"
            src={mediaPath(memoryId, item.files.display)}
            alt={t.media.photoAlt(position)}
            width={item.width}
            height={item.height}
            draggable={false}
          />
        )}
      </div>
      <button type="button" className="magnify-close" aria-label={t.magnify.close} title={t.magnify.close} onClick={close}>
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

  const soundLabel = unmuted ? t.media.mute(position) : t.media.unmute(position);
  return (
    <div className="magnify-video">
      <video
        ref={ref}
        className="magnify-media"
        src={mediaPath(memoryId, item.files.display)}
        poster={mediaPath(memoryId, item.files.thumbnail)}
        aria-label={t.media.videoAlt(position)}
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
      <div className="magnify-controls">
        <input
          type="range"
          className="magnify-progress"
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
          className="magnify-sound"
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
