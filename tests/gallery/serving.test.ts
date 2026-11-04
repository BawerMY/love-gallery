import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addMedia, createMemory, memoryMediaDir, openStorage, serveMedia } from "@/gallery";
import { makeDataDir } from "./helpers";

const FIXTURES = path.join(import.meta.dirname, "..", "fixtures");

async function galleryWithPhoto() {
  const storage = openStorage(await makeDataDir());
  const memory = await createMemory(storage, { cities: ["Roma"], startDay: "2025-03-14", endDay: "2025-03-14" });
  await mkdir(path.join(storage.dataDir, "incoming"), { recursive: true });
  const upload = path.join(storage.dataDir, "incoming", "a.jpg");
  await copyFile(path.join(FIXTURES, "gps-rotated.jpg"), upload);
  const [item] = await addMedia(storage, memory.id, [{ path: upload, fileName: "a.jpg" }]);
  const file = path.join(memoryMediaDir(storage, memory.id), item.files.display);
  return { storage, memory, item, bytes: await readFile(file) };
}

async function bodyOf(response: Response): Promise<Buffer> {
  return Buffer.from(await response.arrayBuffer());
}

describe("serving Media", () => {
  it("sends a whole file with its type, a long cache and range support", async () => {
    const { storage, memory, item, bytes } = await galleryWithPhoto();

    const response = await serveMedia(storage, memory.id, item.files.display, null);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("content-length")).toBe(String(bytes.length));
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.headers.get("cache-control")).toBe("private, max-age=31536000, immutable");
    expect(await bodyOf(response)).toEqual(bytes);
  });

  it("sends just the requested bytes for a Range request", async () => {
    const { storage, memory, item, bytes } = await galleryWithPhoto();
    const size = bytes.length;

    const middle = await serveMedia(storage, memory.id, item.files.display, "bytes=10-19");
    expect(middle.status).toBe(206);
    expect(middle.headers.get("content-range")).toBe(`bytes 10-19/${size}`);
    expect(middle.headers.get("content-length")).toBe("10");
    expect(await bodyOf(middle)).toEqual(bytes.subarray(10, 20));

    const rest = await serveMedia(storage, memory.id, item.files.display, "bytes=100-");
    expect(rest.headers.get("content-range")).toBe(`bytes 100-${size - 1}/${size}`);
    expect(await bodyOf(rest)).toEqual(bytes.subarray(100));

    const last = await serveMedia(storage, memory.id, item.files.display, "bytes=-5");
    expect(last.headers.get("content-range")).toBe(`bytes ${size - 5}-${size - 1}/${size}`);
    expect(await bodyOf(last)).toEqual(bytes.subarray(size - 5));

    const beyond = await serveMedia(storage, memory.id, item.files.display, `bytes=${size}-`);
    expect(beyond.status).toBe(416);
    expect(beyond.headers.get("content-range")).toBe(`bytes */${size}`);
  });

  it("answers 404 for a file that isn't one of the Memory's Media", async () => {
    const { storage, memory, item } = await galleryWithPhoto();
    expect((await serveMedia(storage, memory.id, "../database.json", null)).status).toBe(404);
    expect((await serveMedia(storage, "altro", item.files.display, null)).status).toBe(404);
    expect((await serveMedia(storage, memory.id, "nessuno.webp", null)).status).toBe(404);
  });
});
