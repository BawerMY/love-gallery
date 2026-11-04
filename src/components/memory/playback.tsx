"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Page-wide video playback state for the Memory page.
 *
 * - At most one video is unmuted; unmuting one mutes the rest.
 * - Grid videos can all be held paused (the magnify modal does this while
 *   open) and resume afterwards, each only if it's on screen.
 * - Each grid video registers its element, so others can read or set its position.
 */
export type VideoPlayback = {
  /** The Media id of the one video playing with sound, if any. */
  unmutedId: string | null;
  /** Unmutes this video and mutes every other one; `null` mutes them all. */
  setUnmuted: (mediaId: string | null) => void;
  /** True while every grid video is held paused. */
  pausedAll: boolean;
  pauseAll: () => void;
  /** Lets grid videos play again; those on screen resume where they are. */
  resumeAll: () => void;
  /** A grid video's current position in seconds, or undefined if it isn't on the page. */
  positionOf: (mediaId: string) => number | undefined;
  /** Moves a grid video to this position in seconds. */
  seekTo: (mediaId: string, seconds: number) => void;
  /** Used by `VideoTile`: makes its element known; returns the unregister function. */
  register: (mediaId: string, video: HTMLVideoElement) => () => void;
};

const PlaybackContext = createContext<VideoPlayback | null>(null);

export function VideoPlaybackProvider({ children }: { children: ReactNode }) {
  const [unmutedId, setUnmuted] = useState<string | null>(null);
  const [pausedAll, setPausedAll] = useState(false);
  const videos = useRef(new Map<string, HTMLVideoElement>());

  const register = useCallback((mediaId: string, video: HTMLVideoElement) => {
    videos.current.set(mediaId, video);
    return () => {
      if (videos.current.get(mediaId) === video) videos.current.delete(mediaId);
    };
  }, []);
  const positionOf = useCallback((mediaId: string) => videos.current.get(mediaId)?.currentTime, []);
  const seekTo = useCallback((mediaId: string, seconds: number) => {
    const video = videos.current.get(mediaId);
    if (video) video.currentTime = seconds;
  }, []);
  const pauseAll = useCallback(() => setPausedAll(true), []);
  const resumeAll = useCallback(() => setPausedAll(false), []);

  const value = useMemo(
    () => ({ unmutedId, setUnmuted, pausedAll, pauseAll, resumeAll, positionOf, seekTo, register }),
    [unmutedId, pausedAll, pauseAll, resumeAll, positionOf, seekTo, register],
  );
  return <PlaybackContext value={value}>{children}</PlaybackContext>;
}

/** The page's video playback state. Must be used inside `VideoPlaybackProvider`. */
export function useVideoPlayback(): VideoPlayback {
  const playback = useContext(PlaybackContext);
  if (!playback) throw new Error("useVideoPlayback must be used inside VideoPlaybackProvider");
  return playback;
}
