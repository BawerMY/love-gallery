import { getGallery, serveMedia } from "@/gallery";
import { hasSession, unauthorized } from "../../../../require-session";

/** One processed Media file, only with a session, with Range support. */
export async function GET(request: Request, { params }: { params: Promise<{ memoryId: string; file: string }> }) {
  if (!(await hasSession())) return unauthorized();
  const { memoryId, file } = await params;
  return serveMedia(getGallery().storage, memoryId, file, request.headers.get("range"));
}
