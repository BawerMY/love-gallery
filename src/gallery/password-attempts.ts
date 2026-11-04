/**
 * Slows down guessing the Gallery password: each client may get it wrong a
 * few times, then has to wait before trying again, twice as long after each
 * further wrong password. Kept in memory: a restart forgets it, which is
 * fine for a gallery with one password and two people.
 */

/** Wrong passwords allowed before a client has to wait. */
const FREE_FAILURES = 4;
const FIRST_WAIT_MS = 30 * 1000;
const MAX_WAIT_MS = 15 * 60 * 1000;
/** Wrong passwords this long ago no longer count. */
const FORGET_AFTER_MS = 24 * 60 * 60 * 1000;

export type PasswordThrottle = {
  /** How long the client must still wait before its next attempt (0 when it may try now). */
  waitMs(client: string, now?: number): number;
  recordFailure(client: string, now?: number): void;
  /** The right password: the client's wrong ones are forgotten. */
  recordSuccess(client: string): void;
};

export function createPasswordThrottle(): PasswordThrottle {
  const failures = new Map<string, { count: number; last: number }>();

  function current(client: string, now: number) {
    const entry = failures.get(client);
    if (entry && now - entry.last >= FORGET_AFTER_MS) {
      failures.delete(client);
      return undefined;
    }
    return entry;
  }

  return {
    waitMs(client, now = Date.now()) {
      const entry = current(client, now);
      if (!entry || entry.count <= FREE_FAILURES) return 0;
      const wait = Math.min(MAX_WAIT_MS, FIRST_WAIT_MS * 2 ** (entry.count - FREE_FAILURES - 1));
      return Math.max(0, entry.last + wait - now);
    },
    recordFailure(client, now = Date.now()) {
      for (const [key, entry] of failures) {
        if (now - entry.last >= FORGET_AFTER_MS) failures.delete(key);
      }
      const entry = current(client, now);
      failures.set(client, { count: (entry?.count ?? 0) + 1, last: now });
    },
    recordSuccess(client) {
      failures.delete(client);
    },
  };
}

/**
 * The throttle of the running app, on `globalThis` because Next.js may load
 * this module more than once and there must be one per process.
 */
const THROTTLE_KEY = Symbol.for("love-gallery.password-throttle");
export const passwordThrottle: PasswordThrottle = ((globalThis as Record<symbol, unknown>)[THROTTLE_KEY] ??=
  createPasswordThrottle()) as PasswordThrottle;

/**
 * Who is entering the password, as nginx reports it: its `X-Real-IP`, else
 * the last address of `X-Forwarded-For` (the one nginx appended; those before
 * it come from the client and can be made up).
 */
export function clientAddress(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean);
  return forwarded?.at(-1) ?? "unknown";
}
