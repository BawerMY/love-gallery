"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/strings";
import { Wordmark } from "./Wordmark";

/**
 * The fixed "Giulia ♥ Bawer" bar at the top of every gallery page (the
 * Timeline and Memory pages). Tapping it goes to the newest Memory: on the
 * Timeline it scrolls to the bottom, smoothly unless reduced motion is set;
 * elsewhere it opens the Timeline, which opens at the bottom anyway.
 * Leaves an equal gap in the page so nothing starts hidden under it.
 */
export function TopBar() {
  const pathname = usePathname();

  const onClick = (event: React.MouseEvent) => {
    if (pathname !== "/") return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reduce ? "instant" : "smooth" });
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-11 items-center justify-center border-b border-honey/25 bg-cream/90 backdrop-blur-sm">
        <Link href="/" onClick={onClick} aria-label={t.common.topBar} className="px-3 py-1 text-cocoa no-underline">
          <Wordmark className="m-0 text-[1.6rem]" />
        </Link>
      </header>
      <div aria-hidden="true" className="h-11" />
    </>
  );
}
