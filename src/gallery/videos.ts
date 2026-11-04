import { execFile } from "node:child_process";
import { rename } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import type { MediaHandler } from "./media";
import type { MediaFiles } from "./types";

const run = promisify(execFile);

/** Videos are shown with their longest side at most this many pixels (1080p). */
export const VIDEO_MAX_SIDE = 1920;

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".3gp", ".mkv", ".webm", ".avi"]);

/**
 * Turns a video (an iPhone HEVC `.mov`, an Android `.mp4`, …) into an
 * H.264 + AAC MP4 with fast start, so it plays at once in every browser,
 * plus a WebP poster of its first frame. Rotation is applied and no
 * metadata, location included, is carried over (ADR-0001).
 *
 * Transcoding is slow, so it runs in the background: in the upload request
 * only the capture time is read (`prepare`).
 */
export const videoHandler: MediaHandler = {
  kind: "video",
  accepts(upload) {
    return VIDEO_EXTENSIONS.has(path.extname(upload.fileName).toLowerCase());
  },
  async prepare(upload, output) {
    const capturedAt = await readCaptureTime(upload.path);
    return { ...(capturedAt && { capturedAt }), files: videoFiles(output.id) };
  },
  async process(upload, output) {
    const files = videoFiles(output.id);
    const video = path.join(output.dir, files.display);
    // Written under a temporary name first, so a half-written file is never served.
    const partial = `${video}.part`;
    await run("ffmpeg", [
      ...["-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", upload.path],
      ...["-map", "0:v:0", "-map", "0:a:0?", "-map_metadata", "-1", "-map_chapters", "-1"],
      ...["-vf", `scale=min(iw\\,${VIDEO_MAX_SIDE}):min(ih\\,${VIDEO_MAX_SIDE}):force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1`],
      ...["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", "-profile:v", "high"],
      ...["-c:a", "aac", "-b:a", "128k", "-ac", "2"],
      ...["-movflags", "+faststart", "-f", "mp4", partial],
    ]);
    await rename(partial, video);

    const { stdout: frame } = await run(
      "ffmpeg",
      ["-nostdin", "-loglevel", "error", "-i", video, "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"],
      { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 },
    );
    const poster = await sharp(frame).webp({ quality: 80 }).toFile(path.join(output.dir, files.thumbnail));

    return { status: "ready", width: poster.width, height: poster.height, files };
  },
};

/** The names of a video's processed files: the MP4 is shown, the poster stands in until it plays. */
function videoFiles(id: string): MediaFiles {
  return { display: `${id}.mp4`, thumbnail: `${id}-poster.webp` };
}

/**
 * When the video was recorded. iPhones write the local time with its UTC
 * offset (`com.apple.quicktime.creationdate`), which is kept as is
 * (e.g. `2025-03-14T18:30:05+01:00`). Otherwise the container's
 * `creation_time`, which is in UTC. Undefined when the video doesn't say.
 */
async function readCaptureTime(file: string): Promise<string | undefined> {
  let tags: Record<string, string>;
  try {
    const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format_tags", "-of", "json", file]);
    tags = (JSON.parse(stdout) as { format?: { tags?: Record<string, string> } }).format?.tags ?? {};
  } catch {
    return undefined;
  }

  const local = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-]\d{2}):?(\d{2})/.exec(tags["com.apple.quicktime.creationdate"] ?? "");
  if (local) return `${local[1]}${local[2]}:${local[3]}`;

  const utc = /^(\d{4})(-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d+)?Z/.exec(tags.creation_time ?? "");
  // Some cameras write a zero date when they don't know the time.
  if (utc && Number(utc[1]) > 1970) return `${utc[1]}${utc[2]}Z`;
  return undefined;
}
