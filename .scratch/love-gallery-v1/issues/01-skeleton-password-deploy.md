# 01: Project skeleton, Gallery password and deployment

**What to build:** A Next.js + TypeScript app (pnpm) that runs with Docker Compose. It mounts the data folder (`DATA_DIR`) and creates `database.json` on first start. Every page sits behind an Italian Gallery password screen; a correct password sets a signed session cookie that lasts one year, and changing `GALLERY_PASSWORD` logs out every device. After logging in you see an empty Timeline ("Nessun ricordo ancora", "no memories yet"). This ticket also sets up the gallery core module, its storage layer (writes queued behind a lock, temp file then rename), and both test harnesses (Vitest for the core module against a temp data folder, Playwright against the running app), for the later tickets to follow. See the spec: `.scratch/love-gallery-v1/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `pnpm dev` and `pnpm build && pnpm start` serve the app; `pnpm test` runs Vitest; `pnpm test:e2e` runs Playwright.
- [x] `Dockerfile` (with `ffmpeg` installed) and `docker-compose.yml` mount a host folder at `/data` and set `GALLERY_PASSWORD`, `SESSION_SECRET` and `DATA_DIR`; `docker build` succeeds.
- [x] `database.json` is created with an empty Memory list and an empty Yearly occasion list if it's missing; writes are atomic and queued one at a time.
- [x] Requests without a valid session are redirected to the password screen (pages) or get 401 (API); a wrong password shows an Italian error.
- [x] The session cookie is HttpOnly, Secure (in production), SameSite=Lax, lasts one year, and stops working when `GALLERY_PASSWORD` changes.
- [x] Every response carries `X-Robots-Tag: noindex`.
- [x] Interface strings are in Italian and kept together in one place.
- [x] The README covers setup, the environment variables, backups (the data folder) and a sample nginx server block with a raised `client_max_body_size`.
- [x] Vitest covers storage and sessions; a Playwright test covers login and the redirect.

## Comments

- 2026-11-04: implemented on the integration branch `love-gallery-v1`, reviewed with /code-review, and the review findings fixed.
