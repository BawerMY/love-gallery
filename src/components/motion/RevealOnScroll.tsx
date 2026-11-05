"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** How much of an element must be on screen before it's revealed. */
const THRESHOLD = 0.12;

/**
 * Fades and slides up each `[data-reveal]` element inside it the first time
 * it scrolls into view. Elements already on screen when the page opens are
 * shown at once, so nothing flickers. Under `prefers-reduced-motion` it does
 * nothing and everything stays shown. The styles live in `globals.css`.
 */
export function RevealOnScroll({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = ref.current!;
    const show = (element: Element) => {
      (element as HTMLElement).dataset.shown = "";
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { threshold: THRESHOLD },
    );
    for (const element of root.querySelectorAll("[data-reveal]")) {
      const box = element.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) show(element);
      else observer.observe(element);
    }
    root.dataset.revealReady = "";
    return () => {
      observer.disconnect();
      delete root.dataset.revealReady;
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
