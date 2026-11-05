import { revalidatePath } from "next/cache";
import { addMedia, findMemory, GalleryError, getGallery, receiveUploads, type MediaCell, type MediaPlacement } from "@/gallery";
import { t } from "@/strings";
import { hasSession, unauthorized } from "../../../require-session";

/**
 * The Admin page uploads Media here as `multipart/form-data`. The body is
 * streamed to disk, then processed once received in full.
 *
 * This path is left out of the proxy (see `src/proxy.ts`), because the proxy
 * would buffer the whole body in memory; the session is checked here instead.
 * An unknown Memory is refused with 404 before any of the body is read.
 *
 * The query may say where the new items go (see `placementOf`).
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
    const media = await addMedia(storage, memoryId, uploads, placementOf(new URL(request.url).searchParams));
    revalidatePath("/", "layout");
    return Response.json({ media });
  } catch (error) {
    if (error instanceof GalleryError) return Response.json({ error: error.message }, { status: 400 });
    console.error(error);
    return Response.json({ error: t.media.uploadFailed }, { status: 500 });
  }
}

/**
 * The cell the Curator tapped (`column` and `row`) and the cells her unsaved
 * Layout holds (`taken`, as JSON), from the upload's query. Without a valid
 * cell the items go below the Layout; anything in `taken` that isn't a cell
 * is ignored.
 */
function placementOf(query: URLSearchParams): MediaPlacement | undefined {
  const column = Number(query.get("column") ?? NaN);
  const row = Number(query.get("row") ?? NaN);
  if (!Number.isInteger(column) || !Number.isInteger(row)) return undefined;
  let taken: unknown;
  try {
    taken = JSON.parse(query.get("taken") ?? "[]");
  } catch {
    taken = [];
  }
  return { column, row, taken: Array.isArray(taken) ? taken.filter(isCell) : [] };
}

function isCell(value: unknown): value is MediaCell {
  const cell = value as MediaCell;
  return (
    typeof value === "object" &&
    value !== null &&
    [cell.column, cell.row, cell.width, cell.height].every(Number.isInteger) &&
    cell.width >= 1 &&
    cell.height >= 1
  );
}
