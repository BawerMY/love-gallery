"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades and slides up, slightly, every element inside marked `data-reveal`
 * the first time it enters the viewport. Does nothing under reduced motion,
 * and without JavaScript everything simply shows (see `globals.css`).
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = "";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );
    root.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    // Only now hide what hasn't been seen yet, so nothing stays hidden if this never runs.
    root.dataset.revealReady = "";
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
