import { describe, expect, it } from "vitest";
import { checkSession, enterGalleryPassword, sessionCookie } from "@/gallery";

const config = { galleryPassword: "il-nostro-segreto", sessionSecret: "s".repeat(32) };
const DAY = 24 * 60 * 60 * 1000;

describe("session", () => {
  it("logs in with the Gallery password and accepts the resulting session", async () => {
    const token = await enterGalleryPassword(config, "il-nostro-segreto");

    expect(token).toEqual(expect.any(String));
    expect(await checkSession(config, token!)).toBe(true);
  });

  it("refuses a wrong Gallery password", async () => {
    expect(await enterGalleryPassword(config, "sbagliata")).toBeNull();
    expect(await enterGalleryPassword(config, "")).toBeNull();
  });

  it("rejects a missing, malformed or tampered session", async () => {
    const token = (await enterGalleryPassword(config, "il-nostro-segreto"))!;
    const [issued, signature] = token.split(".");

    expect(await checkSession(config, undefined)).toBe(false);
    expect(await checkSession(config, "")).toBe(false);
    expect(await checkSession(config, "non-un-token")).toBe(false);
    expect(await checkSession(config, `${Number(issued) + 1000}.${signature}`)).toBe(false);
    expect(await checkSession(config, `${issued}.${signature.slice(0, -2)}xx`)).toBe(false);
  });

  it("rejects every session once the Gallery password changes", async () => {
    const token = (await enterGalleryPassword(config, "il-nostro-segreto"))!;

    const changed = { ...config, galleryPassword: "nuova-password" };
    expect(await checkSession(changed, token)).toBe(false);
  });

  it("rejects a session signed with a different secret", async () => {
    const token = (await enterGalleryPassword(config, "il-nostro-segreto"))!;

    expect(await checkSession({ ...config, sessionSecret: "t".repeat(32) }, token)).toBe(false);
  });

  it("lasts one year", async () => {
    const issuedAt = new Date("2026-01-01T12:00:00Z");
    const token = (await enterGalleryPassword(config, "il-nostro-segreto", issuedAt))!;

    const almostAYear = new Date(issuedAt.getTime() + 364 * DAY);
    const overAYear = new Date(issuedAt.getTime() + 366 * DAY);
    expect(await checkSession(config, token, almostAYear)).toBe(true);
    expect(await checkSession(config, token, overAYear)).toBe(false);
  });

  it("sets an HttpOnly, SameSite=Lax cookie for one year, Secure in production", () => {
    const production = sessionCookie("abc", "production");
    expect(production).toMatchObject({
      value: "abc",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });

    expect(sessionCookie("abc", "development").secure).toBe(false);
  });
});
