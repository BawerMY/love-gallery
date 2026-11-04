import { NextResponse } from "next/server";
import { getGallery, enterGalleryPassword, sessionCookie } from "@/gallery";
import { PASSWORD_PATH, safeNextPath } from "@/routes";

/** The password screen's form posts here. */
export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const next = safeNextPath(String(form.get("next") ?? ""));

  const token = await enterGalleryPassword(getGallery().config, password);
  if (!token) {
    const params = new URLSearchParams({ errore: "1" });
    if (next !== "/") params.set("next", next);
    return seeOther(`${PASSWORD_PATH}?${params}`);
  }

  const response = seeOther(next);
  response.cookies.set(sessionCookie(token));
  return response;
}

/** A relative 303 redirect, so it works whatever host nginx forwards. */
function seeOther(location: string) {
  return new NextResponse(null, { status: 303, headers: { Location: location } });
}
