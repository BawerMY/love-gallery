"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** How often the Admin page checks on Media still processing in the background. */
const INTERVAL_MS = 2000;

/**
 * Rendered while some Media of the page is still processing: refreshes the
 * page's server data every couple of seconds, and stops once it is no
 * longer rendered (nothing left processing).
 */
export function RefreshWhileProcessing() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
