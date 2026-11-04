import { NextResponse } from "next/server";
import { clientAddress, enterGalleryPassword, getGallery, passwordThrottle, sessionCookie } from "@/gallery";
import { PASSWORD_PATH, safeNextPath } from "@/routes";

/**
 * The password screen's form posts here. After a few wrong passwords from
 * the same client it has to wait before trying again, and while it waits
 * the password isn't even checked.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const next = safeNextPath(String(form.get("next") ?? ""));
  const client = clientAddress(request.headers);

  const waiting = passwordThrottle.waitMs(client);
  if (waiting > 0) return backToPasswordScreen(next, { attesa: String(Math.ceil(waiting / 1000)) });

  const token = await enterGalleryPassword(getGallery().config, password);
  if (!token) {
    passwordThrottle.recordFailure(client);
    const wait = passwordThrottle.waitMs(client);
    return backToPasswordScreen(next, wait > 0 ? { attesa: String(Math.ceil(wait / 1000)) } : { errore: "1" });
  }

  passwordThrottle.recordSuccess(client);
  const response = seeOther(next);
  response.cookies.set(sessionCookie(token));
  return response;
}

function backToPasswordScreen(next: string, reason: Record<string, string>) {
  const params = new URLSearchParams(reason);
  if (next !== "/") params.set("next", next);
  return seeOther(`${PASSWORD_PATH}?${params}`);
}

/** A relative 303 redirect, so it works whatever host nginx forwards. */
function seeOther(location: string) {
  return new NextResponse(null, { status: 303, headers: { Location: location } });
}
