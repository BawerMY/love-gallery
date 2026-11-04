import { readFile } from "node:fs/promises";
import path from "node:path";
import exifr from "exifr";
import decodeHeic from "heic-decode";
import sharp, { type Sharp } from "sharp";
import { normalizeCaptureTime } from "./capture-days";
import type { MediaHandler } from "./media";

/** Photos are shown with their longest side at most this many pixels. */
export const PHOTO_MAX_SIDE = 2560;
/** Thumbnails have their longest side at most this many pixels. */
export const THUMBNAIL_MAX_SIDE = 800;

const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);
const PHOTO_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff", ...HEIC_EXTENSIONS]);

/**
 * Turns a photo (JPEG, PNG, HEIC, …) into a WebP with its longest side at
 * most 2560px plus a thumbnail. Rotation from EXIF is applied and every bit
 * of metadata, GPS included, is left out of the output (ADR-0001).
 */
export const photoHandler: MediaHandler = {
  kind: "photo",
  accepts(upload) {
    return PHOTO_EXTENSIONS.has(extension(upload.fileName));
  },
  async process(upload, output) {
    const capturedAt = await readCaptureTime(upload.path);
    const image = await openImage(upload.path, HEIC_EXTENSIONS.has(extension(upload.fileName)));

    const files = { display: `${output.id}.webp`, thumbnail: `${output.id}-thumb.webp` };
    const display = await image
      .clone()
      .resize(PHOTO_MAX_SIDE, PHOTO_MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(output.dir, files.display));
    await image
      .clone()
      .resize(THUMBNAIL_MAX_SIDE, THUMBNAIL_MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(path.join(output.dir, files.thumbnail));

    return {
      status: "ready",
      width: display.width,
      height: display.height,
      ...(capturedAt && { capturedAt }),
      files,
    };
  },
};

function extension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

/**
 * A sharp pipeline for the photo, already turned upright. sharp's prebuilt
 * binaries can't decode HEIC, so HEIC goes through libheif (WebAssembly),
 * which applies the HEIF rotation itself.
 */
async function openImage(file: string, heic: boolean): Promise<Sharp> {
  if (!heic) return sharp(file).rotate();
  const { width, height, data } = await decodeHeic({ buffer: await readFile(file) });
  return sharp(Buffer.from(data.buffer, data.byteOffset, data.byteLength), {
    raw: { width, height, channels: 4 },
  });
}

/**
 * When the photo was taken, as stored (see `normalizeCaptureTime`): the
 * camera's wall-clock time with the UTC offset it recorded, or Italy's
 * offset when it recorded none. Undefined when the photo doesn't say.
 */
async function readCaptureTime(file: string): Promise<string | undefined> {
  let tags: Record<string, unknown> | undefined;
  try {
    tags = await exifr.parse(file, {
      pick: ["DateTimeOriginal", "CreateDate", "OffsetTimeOriginal", "OffsetTime"],
      reviveValues: false,
    });
  } catch {
    return undefined;
  }
  const raw = String(tags?.DateTimeOriginal ?? tags?.CreateDate ?? "");
  const match = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second] = match;
  const offset = String(tags?.OffsetTimeOriginal ?? tags?.OffsetTime ?? "");
  return normalizeCaptureTime(
    `${year}-${month}-${day}T${hour}:${minute}:${second}${/^[+-]\d{2}:\d{2}$/.test(offset) ? offset : ""}`,
  );
}
