import { NextResponse, type NextRequest } from "next/server";
import { readConfig } from "@/gallery/config";
import { checkSession, SESSION_COOKIE } from "@/gallery/session";
import { isApiPath, isPublicPath, LOGIN_PATH } from "@/routes";
import { t } from "@/strings";

/** Every page and API request needs a valid session, except the public paths. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await checkSession(readConfig(), token)) return NextResponse.next();

  if (isApiPath(pathname)) {
    return NextResponse.json({ error: t.common.unauthorized }, { status: 401 });
  }
  const login = new URL(LOGIN_PATH, request.url);
  if (pathname !== "/" || search) login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Next.js build assets are not secret; everything else goes through the proxy.
  // Uploads are left out too: the proxy would buffer the whole body in memory,
  // so the upload route checks the session itself (see `uploadPath`).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/upload/).*)"],
};
