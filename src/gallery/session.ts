/**
 * Entering the Gallery password and checking sessions.
 *
 * A session token is `<issued-at ms>.<signature>`, where the signature is an
 * HMAC (keyed with `SESSION_SECRET`) over the issue time and a fingerprint of
 * the current Gallery password. Changing `GALLERY_PASSWORD` changes the
 * fingerprint, so every existing session stops working.
 *
 * Uses only Web APIs (Web Crypto, `TextEncoder`, `btoa`), no Node.js ones,
 * so it runs in the Next.js proxy whatever its runtime.
 */

export type SessionConfig = {
  galleryPassword: string;
  sessionSecret: string;
};

export const SESSION_COOKIE = "galleria_sessione";
export const SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

const encoder = new TextEncoder();

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64url(new Uint8Array(signature));
}

/** Base64url without padding, as Node's `Buffer#toString("base64url")` writes it. */
function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Compares two strings in time that does not depend on where they differ. */
function sameString(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let difference = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    difference |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return difference === 0;
}

async function sign(config: SessionConfig, issuedAt: number): Promise<string> {
  const fingerprint = await hmac(config.sessionSecret, `password:${config.galleryPassword}`);
  return hmac(config.sessionSecret, `session:${issuedAt}:${fingerprint}`);
}

/**
 * Returns a new session token when `password` is the Gallery password, or
 * `null` when it isn't.
 */
export async function enterGalleryPassword(
  config: SessionConfig,
  password: string,
  now: Date = new Date(),
): Promise<string | null> {
  const expected = await hmac(config.sessionSecret, `check:${config.galleryPassword}`);
  const given = await hmac(config.sessionSecret, `check:${password}`);
  if (!sameString(expected, given)) return null;

  const issuedAt = now.getTime();
  return `${issuedAt}.${await sign(config, issuedAt)}`;
}

/** Whether `token` is a session that is still valid at `now`. */
export async function checkSession(
  config: SessionConfig,
  token: string | undefined,
  now: Date = new Date(),
): Promise<boolean> {
  const match = /^(\d{1,16})\.([\w-]+)$/.exec(token ?? "");
  if (!match) return false;

  const issuedAt = Number(match[1]);
  const age = now.getTime() - issuedAt;
  if (age < 0 || age > SESSION_MAX_AGE_SECONDS * 1000) return false;

  return sameString(match[2], await sign(config, issuedAt));
}

/** The session cookie to set once the Gallery password was entered. `Secure` only in production. */
export function sessionCookie(token: string, nodeEnv: string | undefined = process.env.NODE_ENV) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
