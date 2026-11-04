/**
 * Paths that answer without a session. Everything else needs one: pages are
 * redirected to the password screen, API requests get 401.
 * Add one entry per line.
 */
export const PUBLIC_PATHS = [
  "/login",
  "/api/session",
];

export const LOGIN_PATH = "/login";

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

/** A same-site path to return to after logging in; anything else becomes "/". */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
