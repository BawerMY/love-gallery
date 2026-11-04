import { cookies } from "next/headers";
import { checkSession, getGallery, SESSION_COOKIE } from "@/gallery";
import { t } from "@/strings";

/**
 * Throws unless the request carries a valid session. Every server action
 * calls this first: the proxy guards pages, but an action must check too.
 */
export async function requireSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await checkSession(getGallery().config, token))) {
    throw new Error(t.common.unauthorized);
  }
}
