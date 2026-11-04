/**
 * Paths that answer without a session. Everything else needs one: pages are
 * redirected to the password screen, API requests get 401.
 * Add one entry per line.
 */
export const PUBLIC_PATHS = [
  "/accesso",
  "/api/session",
];

/** The password screen, where the Gallery password is entered. */
export const PASSWORD_PATH = "/accesso";

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

/** A same-site path to return to after entering the Gallery password; anything else becomes "/". */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

/** Where the Admin page uploads a Memory's Media. Not behind the proxy: the route checks the session. */
export function uploadPath(memoryId: string): string {
  return `/api/upload/${encodeURIComponent(memoryId)}`;
}

/** The URL of one processed Media file. */
export function mediaPath(memoryId: string, fileName: string): string {
  return `/api/media/${encodeURIComponent(memoryId)}/${encodeURIComponent(fileName)}`;
}
