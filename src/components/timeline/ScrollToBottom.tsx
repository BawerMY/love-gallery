"use client";

import { useLayoutEffect } from "react";

/**
 * Scrolls the page to the bottom when it opens, so the newest Memory is the
 * first thing seen, like a chat. Runs again on the next frame in case the
 * router restores the scroll position after this component mounts.
 */
export function ScrollToBottom() {
  useLayoutEffect(() => {
    const toBottom = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    toBottom();
    const frame = requestAnimationFrame(toBottom);
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}
