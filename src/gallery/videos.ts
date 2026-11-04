import { execFile } from "node:child_process";
import { rename } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { normalizeCaptureTime } from "./capture-days";
import type { MediaHandler } from "./media";
import type { MediaFiles } from "./types";

const run = promisify(execFile);

/** Videos are shown with their longest side at most this many pixels (1080p). */
export const VIDEO_MAX_SIDE = 1920;

/** The ffmpeg demuxer for each accepted extension. */
const VIDEO_FORMATS: Record<string, string> = {
  ".mp4": "mov",
  ".mov": "mov",
  ".m4v": "mov",
  ".3gp": "mov",
  ".mkv": "matroska",
  ".webm": "matroska",
  ".avi": "avi",
};

/**
 * ffmpeg and ffprobe options that make them read only the local file they
 * are given, with the demuxer its extension calls for: no network or other
 * protocols, and no playlist or concat demuxers that would pull in other files.
 */
function localInput(file: string): string[] {
  const format = VIDEO_FORMATS[path.extname(file).toLowerCase()];
  if (!format) throw new Error(`Not a video file: ${file}`);
  return ["-protocol_whitelist", "file", "-f", format, "-i", file];
}

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
    return path.extname(upload.fileName).toLowerCase() in VIDEO_FORMATS;
  },
  async prepare(upload, output) {
    const capturedAt = await readCaptureTime(upload);
    return { ...(capturedAt && { capturedAt }), files: videoFiles(output.id) };
  },
  async process(upload, output) {
    const files = videoFiles(output.id);
    const video = path.join(output.dir, files.display);
    // Written under a temporary name first, so a half-written file is never served.
    const partial = `${video}.part`;
    await run("ffmpeg", [
      ...["-nostdin", "-hide_banner", "-loglevel", "error", "-y", ...localInput(upload.path)],
      ...["-map", "0:v:0", "-map", "0:a:0?", "-map_metadata", "-1", "-map_chapters", "-1"],
      ...["-vf", `scale=min(iw\\,${VIDEO_MAX_SIDE}):min(ih\\,${VIDEO_MAX_SIDE}):force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1`],
      ...["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", "-profile:v", "high"],
      ...["-c:a", "aac", "-b:a", "128k", "-ac", "2"],
      ...["-movflags", "+faststart", "-f", "mp4", partial],
    ]);
    await rename(partial, video);

    const { stdout: frame } = await run(
      "ffmpeg",
      ["-nostdin", "-loglevel", "error", ...localInput(video), "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"],
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
 * When the video was recorded, as stored (see `normalizeCaptureTime`).
 * iPhones write the local time with its UTC offset
 * (`com.apple.quicktime.creationdate`), which is kept as is. Otherwise the
 * container's `creation_time`, which is in UTC and so becomes the time in
 * Italy. Undefined when the video doesn't say.
 */
async function readCaptureTime(upload: { path: string }): Promise<string | undefined> {
  let tags: Record<string, string>;
  try {
    const { stdout } = await run("ffprobe", [
      ...["-v", "error", ...localInput(upload.path)],
      ...["-show_entries", "format_tags", "-of", "json"],
    ]);
    tags = (JSON.parse(stdout) as { format?: { tags?: Record<string, string> } }).format?.tags ?? {};
  } catch {
    return undefined;
  }

  const local = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-]\d{2}):?(\d{2})/.exec(tags["com.apple.quicktime.creationdate"] ?? "");
  if (local) return normalizeCaptureTime(`${local[1]}${local[2]}:${local[3]}`);

  const utc = /^(\d{4})(-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d+)?Z/.exec(tags.creation_time ?? "");
  // Some cameras write a zero date when they don't know the time.
  if (utc && Number(utc[1]) > 1970) return normalizeCaptureTime(`${utc[1]}${utc[2]}Z`);
  return undefined;
}
