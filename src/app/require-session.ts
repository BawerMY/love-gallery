import { cookies } from "next/headers";
import { checkSession, getGallery, SESSION_COOKIE } from "@/gallery";
import { t } from "@/strings";

/**
 * Throws unless the request carries a valid session. Every server action
 * calls this first: the proxy guards pages, but an action must check too.
 */
export async function requireSession(): Promise<void> {
  if (!(await hasSession())) throw new Error(t.common.unauthorized);
}

/** Whether the request carries a valid session. Route handlers answer 401 when it doesn't. */
export async function hasSession(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return checkSession(getGallery().config, token);
}

/** The 401 a route handler sends without a session. */
export function unauthorized(): Response {
  return Response.json({ error: t.common.unauthorized }, { status: 401 });
}
