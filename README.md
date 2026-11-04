# Love Gallery

A private, self-hosted gallery of the Memories the Curator and the Partner have
spent together, in Italian, opened with a single Gallery password. Vocabulary is
in [`GLOSSARY.md`](GLOSSARY.md); decisions are in [`docs/adr/`](docs/adr/).

## Environment variables

| Variable           | Required | Meaning                                                                                                     |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| `GALLERY_PASSWORD` | yes      | The Gallery password. Changing it logs out every device.                                                    |
| `SESSION_SECRET`   | yes      | A long random string used to sign session cookies, e.g. `openssl rand -base64 48`. Changing it also logs everyone out. |
| `DATA_DIR`         | yes      | The data folder holding `database.json` and `media/`. It is `/data` in the container.                       |

`database.json` is created on first start if it is missing.

## Running with Docker Compose

```sh
cat > .env <<'EOF'
GALLERY_PASSWORD=choose-a-password
SESSION_SECRET=paste-a-long-random-string
EOF
mkdir -p data
docker compose up -d --build
```

The app listens on `127.0.0.1:3000`, and the host folder `./data` is mounted at
`/data`. The container runs as the `node` user (uid 1000), so the host folder
must be writable by that uid (`sudo chown 1000:1000 data` if needed). The image
includes `ffmpeg` for video processing.

## Backups

Everything lives in the data folder: `database.json` plus the processed files in
`media/`. Back up that one folder (for example with `rsync -a data/ backup/` or
a snapshot of the volume). To restore, stop the container, put the folder back
and start it again. Originals are not kept after processing (ADR-0001), so keep
them on your phone or in your own backups.

## nginx

The gallery runs behind your existing nginx. A sample server block for the
subdomain (HTTPS setup not shown):

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name gallery.example.com;

    # ssl_certificate     /etc/letsencrypt/live/gallery.example.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/gallery.example.com/privkey.pem;

    # Video uploads can be several GB; without this nginx answers 413.
    client_max_body_size 8G;

    # Stream uploads straight to the app instead of buffering them on disk first.
    proxy_request_buffering off;
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

The session cookie is `Secure` in production, so the gallery must be served
over HTTPS.

## Development

Requires Node 24, pnpm, `ffmpeg` and the Playwright browsers.

```sh
pnpm install
DATA_DIR=./data GALLERY_PASSWORD=dev SESSION_SECRET=dev-secret pnpm dev
```

| Command                     | What it does                                                         |
| --------------------------- | -------------------------------------------------------------------- |
| `pnpm dev`                  | Development server on http://localhost:3000                          |
| `pnpm build && pnpm start`  | Production build and server                                          |
| `pnpm test`                 | Vitest: the gallery core module against a temporary data folder      |
| `pnpm test:e2e`             | Playwright: builds the app and runs it against a temporary data folder |

## Code layout

- `src/gallery/` is the gallery core module. It owns every rule and all reading
  and writing of the data folder, one file per area (`storage.ts`,
  `session.ts`, `memories.ts`, ...), re-exported from `src/gallery/index.ts`.
- `src/app/` holds pages and route handlers, which are thin wrappers around the
  core module. `src/proxy.ts` requires a session for everything except the
  paths in `src/routes.ts`.
- `src/strings/` holds every interface string, one file per area.
- `tests/gallery/` holds the Vitest tests and `e2e/` the Playwright tests.
