import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GalleryError, openStorage, receiveUploads, uploadsDir, type Storage } from "@/gallery";
import { makeDataDir } from "./helpers";

const BOUNDARY = "----confine-di-prova";
const encoder = new TextEncoder();

function partHeader(fileName: string): Uint8Array {
  return encoder.encode(
    `--${BOUNDARY}\r\nContent-Disposition: form-data; name="files"; filename="${fileName}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`,
  );
}
const ending = encoder.encode(`\r\n--${BOUNDARY}--\r\n`);
const contentType = `multipart/form-data; boundary=${BOUNDARY}`;

/** Total size of the files in the uploads folder right now. */
async function bytesOnDisk(storage: Storage): Promise<number> {
  const dir = uploadsDir(storage);
  const names = await readdir(dir).catch(() => []);
  const sizes = await Promise.all(names.map(async (name) => (await stat(path.join(dir, name))).size));
  return sizes.reduce((sum, size) => sum + size, 0);
}

describe("receiving uploads", () => {
  it("saves every file of a multipart form to disk under its original name", async () => {
    const storage = openStorage(await makeDataDir());
    const form = new FormData();
    form.append("files", new Blob(["prima"]), "IMG_0001.JPG");
    form.append("files", new Blob(["seconda"]), "IMG_0002.HEIC");
    const request = new Request("http://galleria/upload", { method: "POST", body: form });

    const uploads = await receiveUploads(storage, request.body!, request.headers.get("content-type")!);

    expect(uploads.map((upload) => upload.fileName)).toEqual(["IMG_0001.JPG", "IMG_0002.HEIC"]);
    expect(await readFile(uploads[0].path, "utf8")).toBe("prima");
    expect(await readFile(uploads[1].path, "utf8")).toBe("seconda");
    expect(path.dirname(uploads[0].path)).toBe(uploadsDir(storage));
  });

  it("writes a file to disk while it is still arriving, instead of holding it in memory", async () => {
    const storage = openStorage(await makeDataDir());
    const chunk = new Uint8Array(1024 * 1024).fill(7);
    let sent = 0;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(partHeader("video.mov"));
      },
      async pull(controller) {
        if (sent === 8) {
          // Half the file is sent. The rest only comes once that half is on disk.
          const deadline = Date.now() + 5000;
          while ((await bytesOnDisk(storage)) < 4 * chunk.length) {
            if (Date.now() > deadline) return controller.error(new Error("nothing reached the disk"));
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        }
        if (sent === 16) {
          controller.enqueue(ending);
          return controller.close();
        }
        controller.enqueue(chunk);
        sent++;
      },
    });

    const [upload] = await receiveUploads(storage, body, contentType);

    expect((await stat(upload.path)).size).toBe(16 * chunk.length);
  });

  it("refuses a form with no files and leaves nothing behind", async () => {
    const storage = openStorage(await makeDataDir());
    const form = new FormData();
    form.append("note", "ciao");
    const request = new Request("http://galleria/upload", { method: "POST", body: form });

    const attempt = receiveUploads(storage, request.body!, request.headers.get("content-type")!);

    await expect(attempt).rejects.toThrow(GalleryError);
    expect(await bytesOnDisk(storage)).toBe(0);
  });

  it("deletes what it received when the upload breaks off", async () => {
    const storage = openStorage(await makeDataDir());
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(partHeader("IMG_0001.JPG"));
        controller.enqueue(new Uint8Array(1000));
        controller.error(new Error("connessione persa"));
      },
    });

    await expect(receiveUploads(storage, body, contentType)).rejects.toThrow();
    expect(await bytesOnDisk(storage)).toBe(0);
  });
});
