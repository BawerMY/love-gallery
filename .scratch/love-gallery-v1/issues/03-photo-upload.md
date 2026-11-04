# 03: Uploading photos

**What to build:** On a Memory's admin page, the Curator uploads several photos at once and sees upload progress. Each photo, including iPhone HEIC files, is turned into a WebP with its longest side at most 2560px plus a thumbnail. Rotation from EXIF is applied, all metadata is removed (GPS included), the capture time is saved, and the original is deleted (ADR-0001). New photos are added in new rows below the bottom of the Layout as 1×1 tiles, filled left to right in capture-time order. The Memory page shows them lazy-loaded on the square 3-column grid (mobile-first, with a maximum width on desktop). The Timeline card shows the default cover, which is the first item in the Layout. The Admin page offers a Date range suggested from the earliest and latest capture times, and flags photos captured outside the Memory's Date range. A single Media item can be deleted after a confirmation. Media is served only to logged-in visitors, with support for HTTP Range requests. See spec, user stories 15–17, 33, 35, 37 and 39–42.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Uploads are streamed to disk, never held whole in memory.
- [ ] Vitest with sample files: a JPEG with GPS EXIF comes out as a WebP with no GPS, its longest side at most 2560, with a thumbnail, its capture time saved, and the original gone; a HEIC sample is converted too.
- [ ] Vitest: Layout placement of new items; the default cover; the Date range suggestion; the out-of-range warning; deleting a Media item removes its files.
- [ ] The Media route returns 401 without a session and handles Range requests.
- [ ] Playwright: upload a photo in the Admin page, see it on the Memory page and as the cover on the Timeline card.
