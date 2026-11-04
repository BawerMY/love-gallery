import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { memoryMediaDir } from "./memories";
import type { Storage } from "./storage";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

/**
 * The response for one processed Media file, supporting HTTP Range requests
 * so videos can be scrubbed. File names change whenever content does, so the
 * file may be cached for a year. Only files that belong to a Media item of
 * the Memory are served; anything else is a 404.
 *
 * Checking the session is the caller's job.
 */
export async function serveMedia(
  storage: Storage,
  memoryId: string,
  fileName: string,
  range: string | null,
): Promise<Response> {
  const db = await storage.read();
  const memory = db.memories.find((candidate) => candidate.id === memoryId);
  const known = memory?.media.some((item) => Object.values(item.files).includes(fileName));
  if (!known) return new Response(null, { status: 404 });

  const file = path.join(memoryMediaDir(storage, memoryId), fileName);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return new Response(null, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": CONTENT_TYPES[path.extname(fileName)] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=31536000, immutable",
  });
  const bytes = parseRange(range, size);
  if (bytes === "unsatisfiable") {
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }

  const { start, end } = bytes ?? { start: 0, end: size - 1 };
  headers.set("Content-Length", String(end - start + 1));
  if (bytes) headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  const body = size === 0 ? null : (Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream);
  return new Response(body, { status: bytes ? 206 : 200, headers });
}

/**
 * A single `bytes=` range as inclusive offsets. Undefined means "send the
 * whole file": no header, a malformed one, or several ranges at once.
 */
function parseRange(header: string | null, size: number): { start: number; end: number } | "unsatisfiable" | undefined {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? "");
  if (!match || (!match[1] && !match[2])) return undefined;

  let start: number;
  let end: number;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (suffix === 0) return "unsatisfiable";
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (start >= size || start > end) return "unsatisfiable";
  return { start, end };
}
