import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import busboy from "busboy";
import { t } from "../strings";
import { GalleryError } from "./errors";
import type { Upload } from "./media";
import type { Storage } from "./storage";

/** Where uploads are received before processing: inside the data folder, so on the same volume. */
export function uploadsDir(storage: Storage): string {
  return path.join(storage.dataDir, "uploads");
}

/**
 * Receives a `multipart/form-data` body, streaming each file straight to
 * disk as it arrives so even multi-GB videos never sit in memory. Resolves
 * once the whole body has been received and every file written.
 *
 * Fields that aren't files are ignored. If the body breaks off or holds no
 * file, everything received is deleted and the promise rejects.
 */
export async function receiveUploads(
  storage: Storage,
  body: ReadableStream<Uint8Array>,
  contentType: string,
): Promise<Upload[]> {
  const dir = uploadsDir(storage);
  await mkdir(dir, { recursive: true });

  const uploads: Upload[] = [];
  const writes: Promise<void>[] = [];
  try {
    const parser = busboy({ headers: { "content-type": contentType } });
    parser.on("file", (_field, file, info) => {
      const fileName = path.basename(info.filename || "file");
      const target = path.join(dir, `${randomUUID()}${safeExtension(fileName)}`);
      uploads.push({ path: target, fileName });
      writes.push(pipeline(file, createWriteStream(target)));
    });
    await pipeline(Readable.fromWeb(body as WebReadableStream<Uint8Array>), parser);
    await Promise.all(writes);
    if (!uploads.length) throw new GalleryError(t.media.noFiles);
    return uploads;
  } catch (error) {
    await Promise.allSettled(writes);
    await Promise.all(uploads.map((upload) => rm(upload.path, { force: true })));
    throw error;
  }
}

/** The file's extension when it is plain letters and digits, so handlers can tell file kinds apart. */
function safeExtension(fileName: string): string {
  const extension = path.extname(fileName);
  return /^\.[A-Za-z0-9]{1,8}$/.test(extension) ? extension.toLowerCase() : "";
}
