import { revalidatePath } from "next/cache";
import { addMedia, findMemory, GalleryError, getGallery, receiveUploads } from "@/gallery";
import { t } from "@/strings";
import { hasSession, unauthorized } from "../../../require-session";

/**
 * The Admin page uploads Media here as `multipart/form-data`. The body is
 * streamed to disk, then processed once received in full.
 *
 * This path is left out of the proxy (see `src/proxy.ts`), because the proxy
 * would buffer the whole body in memory; the session is checked here instead.
 * An unknown Memory is refused with 404 before any of the body is read.
 */
export async function POST(request: Request, { params }: { params: Promise<{ memoryId: string }> }) {
  if (!(await hasSession())) return unauthorized();
  const { memoryId } = await params;
  const contentType = request.headers.get("content-type") ?? "";
  if (!request.body || !contentType.startsWith("multipart/form-data")) {
    return Response.json({ error: t.media.noFiles }, { status: 400 });
  }

  const { storage } = getGallery();
  try {
    findMemory(await storage.read(), memoryId);
  } catch (error) {
    if (error instanceof GalleryError) return Response.json({ error: error.message }, { status: 404 });
    throw error;
  }
  try {
    const uploads = await receiveUploads(storage, request.body, contentType);
    const media = await addMedia(storage, memoryId, uploads);
    revalidatePath("/", "layout");
    return Response.json({ media });
  } catch (error) {
    if (error instanceof GalleryError) return Response.json({ error: error.message }, { status: 400 });
    console.error(error);
    return Response.json({ error: t.media.uploadFailed }, { status: 500 });
  }
}
