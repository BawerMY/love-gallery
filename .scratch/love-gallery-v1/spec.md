# Spec: Love Gallery v1

**Status:** done

Vocabulary follows `GLOSSARY.md`. Decisions follow `docs/adr/0001`–`0003`.

## Problem Statement

The Curator and the Partner live in different cities and meet for a few days at a time. The photos and videos from those meetings are scattered across phones and chats. There's no single private place where the two of them can relive their Memories in order, see how long they were apart between them, and notice the Occasions they spent together.

## Solution

A private, self-hosted web gallery in Italian, reachable on a subdomain of the Curator's domain and opened with a single Gallery password. Its home page is a Timeline of Memories, oldest at the top and newest at the bottom, that opens scrolled to the end like a chat. Each Memory shows its Cities, Date range, Occasions and note, with its Media laid out on a grid the Curator arranges by hand. Videos autoplay muted while on screen. A long press magnifies any item. The Curator manages everything from `/admin`.

## User Stories

### Access
1. As the Partner, I want to open the gallery from a link and enter one Gallery password, so that only the two of us can see our Memories.
2. As the Partner, I want my phone to remember that I'm logged in for a year, so that I don't have to type the password each time.
3. As the Curator, I want to set the Gallery password through an environment variable, so that I can't lock myself out through the interface.
4. As the Curator, I want changing the Gallery password to log out every device, so that a leaked password can be revoked.
5. As the Curator, I want `/admin` to sit behind the same Gallery password, so that I don't need a second login (ADR-0003).
6. As the Curator, I want search engines told not to index the gallery, so that it never appears in search results.
7. As the Partner, I want every screen in Italian, so that the gallery speaks our language.

### Timeline
8. As the Partner, I want to see all our Memories as a vertical chain of cards from oldest to newest, so that I can follow our story in order.
9. As the Partner, I want the Timeline to open scrolled to the newest Memory at the bottom, so that the latest meeting is the first thing I see, like a chat.
10. As the Partner, I want each card to show the cover, title, Cities, Date range and Occasion badges, so that I recognise each Memory at a glance.
11. As the Partner, I want the line between two cards to say how many days we were apart, so that I can feel the distance between our meetings.
12. As the Partner, I want back-to-back Memories to show "0 giorni di distanza" (0 days apart), so that the count stays honest.
13. As the Partner, I want to tap a card to open that Memory, so that I can see all of its Media.

### Memory page
14. As the Partner, I want a header showing the title, Cities, Date range, Occasions and note, so that I know the context of the Media below.
15. As the Partner, I want the Media shown in the Curator's Layout, so that the Memory looks the way it was designed.
16. As the Partner, I want the Layout designed for my phone, and simply wider on a desktop, so that it looks right wherever I open it.
17. As the Partner, I want Media to load only as I scroll near it, so that the page opens fast on mobile data.
18. As the Partner, I want videos to play muted while they're on screen and pause when I scroll past, so that the page feels alive without draining data.
19. As the Partner, I want a video to resume from where it stopped when I scroll back up, so that I don't keep rewatching the start.
20. As the Partner, I want a scrolled-past video to come back muted, so that sound never starts unexpectedly.
21. As the Partner, I want an unmute icon at the bottom right of each video, so that I can hear a moment I care about.
22. As the Partner, I want unmuting one video to mute all the others, so that I only ever hear one at a time.
23. As the Partner, I want a quick tap on a Media item to do nothing, so that scrolling never opens anything by accident.
24. As the Partner, I want a long press (or a mouse click on desktop) to magnify a Media item in a modal, so that I can look at it closely.
25. As the Partner, I want a magnified video to keep playing from the same moment and keep its mute state, so that magnifying feels seamless.
26. As the Partner, I want a magnified video to have a progress bar I can drag, so that I can jump through it.
27. As the Partner, I want to close the modal with the ✕, a tap outside or a swipe down, so that closing is natural on any device.

### Managing Memories
28. As the Curator, I want to create a Memory with an optional title and note, one or more Cities in order, and a Date range, so that each meeting is recorded.
29. As the Curator, I want suggestions from Cities I've used before as I type, so that the same City is never spelled two ways.
30. As the Curator, I want saving refused when a Date range overlaps another Memory, so that the Timeline and the days-apart counts stay correct.
31. As the Curator, I want to edit any field of a Memory, so that I can fix mistakes.
32. As the Curator, I want to delete a Memory after a confirmation, with its files removed from disk, so that nothing is left behind.

### Media
33. As the Curator, I want to upload several photos and videos at once to a Memory, so that adding a meeting is quick.
34. As the Curator, I want to see a progress bar while uploading and a "processing" state while videos are converted, so that I know when they're ready.
35. As the Curator, I want photos converted to WebP (longest side 2560px) with a thumbnail and GPS data removed, so that they load fast everywhere and don't reveal locations.
36. As the Curator, I want videos converted to H.264 MP4 with a poster frame, so that they play in every browser.
37. As the Curator, I want originals deleted after processing, so that the volume stays small (ADR-0001).
38. As the Curator, I want a failed conversion to show as failed with the option to delete it, so that a bad file doesn't block the Memory.
39. As the Curator, I want the Date range suggested from the earliest and latest capture dates of the uploaded Media, so that I don't have to look them up.
40. As the Curator, I want a gentle warning on Media whose capture date falls outside the Date range, so that I notice an item in the wrong Memory.
41. As the Curator, I want to delete a single Media item after a confirmation, so that I can remove mistakes.

### Layout
42. As the Curator, I want newly uploaded Media to be added to the bottom of the Layout as 1×1 tiles in capture-date order, so that nothing is lost before I arrange it.
43. As the Curator, I want to drag Media to any position on a 3-column grid of square cells, so that I can compose the Memory.
44. As the Curator, I want to resize Media to a width of 1–3 columns and a height of any number of rows, so that important moments can be big.
45. As the Curator, I want empty cells allowed and overlaps prevented, so that the Layout is always valid.
46. As the Curator, I want to choose the Memory's cover, with the first item in the Layout used if I don't, so that the Timeline card shows the right image.

### Occasions
47. As the Curator, I want to manage Yearly occasions (name, day and month, optional first year) in a section of `/admin`, so that I define them once.
48. As the Partner, I want a Yearly occasion shown automatically on every Memory whose Date range includes its day, past Memories included, so that our special days are never forgotten.
49. As the Partner, I want a Yearly occasion with a first year to be numbered, e.g. "2° anniversario" (2nd anniversary), so that I can see how far we've come.
50. As the Partner, I want a Yearly occasion with a first year not to appear on Memories before that year, so that an anniversary never shows before it started.
51. As the Curator, I want to add a One-off occasion to a Memory with a name and a day inside its Date range, so that unique moments are marked too.
52. As the Partner, I want Occasions shown as badges on Timeline cards and Memory pages, so that special Memories stand out.

### Deployment
53. As the Curator, I want to run the gallery with Docker Compose in my homelab, with one mounted folder holding `database.json` and `media/`, so that backups are a single folder.
54. As the Curator, I want documentation for my nginx server block, including a raised `client_max_body_size`, so that video uploads don't fail with error 413.

## Implementation Decisions

- **Stack:** Next.js (App Router) and TypeScript, managed with pnpm. The app runs as a single container under Docker Compose. The image includes `ffmpeg`.
- **Data folder:** set by the `DATA_DIR` environment variable (`/data` in the container). It holds `database.json` and a `media/` folder. `database.json` is created on first start (ADR-0002).
- **Gallery core module:** one deep module that owns every rule and all reading and writing of the data folder:
  - Memories: create, edit, delete, list in Timeline order.
  - Media: add, and delete.
  - Layout: changes and validation.
  - Cover: choosing it.
  - Yearly occasions and One-off occasions.
  - The "days apart" calculation.
  - City suggestions.
  - The Date range suggestion and the out-of-range warning.
  - Logging in and checking sessions.
  
  Next.js route handlers, server actions and pages are thin wrappers around it.
- **Storage writes:** within the process, writes are queued one at a time behind a lock. Each write goes to a temporary file that is then renamed over `database.json`.
- **Data shape in `database.json`:**
  - It has a format version number, a list of Memories and a list of Yearly occasions.
  - A Memory has: id, optional title, optional note, an ordered list of City names, a start day and an end day (calendar dates, no time zone), an optional cover Media id, a list of One-off occasions (id, name, day) and a list of Media items.
  - A Media item has: id, kind (photo or video), status (processing, ready or failed), an optional capture time, its pixel width and height, its Layout cell (column, row, width, height), and the names of its processed files.
  - A Yearly occasion has: id, name, month, day and an optional first year.
- **Yearly occasions are calculated, never stored on a Memory.** One belongs to a Memory when the Date range includes its month and day in some year Y, and Y is on or after the first year if one is set.
  - The badge number is Y minus the first year. When that is 0 (the very day itself), the badge shows just the name.
  - A 29 February occasion only matches in leap years.
- **Days apart:** the next Memory's start day minus the previous Memory's end day, minus 1. Overlaps are refused, so it is never negative.
- **Layout:** a grid 3 columns wide.
  - Each Media item has a column from 0 to 2, a width from 1 to 3 with column + width ≤ 3, a row of 0 or more and a height of 1 or more.
  - No two items may overlap. A Layout change that would cause an overlap is rejected as a whole.
  - New Media goes in new rows below the current bottom of the grid, as 1×1 tiles filled left to right in capture-time order.
  - Cells are square: the row height equals the column width.
  - The page is mobile-first, with the grid simply wider on desktop and a maximum width of about 1000px.
- **Cover:** the chosen cover Media id if it's still present. Otherwise the first ready item in the Layout, reading rows top to bottom and columns left to right.
- **Photo processing:** WebP with the longest side capped at 2560px, plus a small thumbnail. Rotation from EXIF is applied, all metadata (including GPS) is removed, and the capture time is saved in `database.json`. The original is deleted.
  - The prebuilt binaries of the common image libraries (e.g. `sharp`) don't decode HEIC, so HEIC needs its own decode path (for example a dedicated HEIC decoder, or `ffmpeg`).
- **Video processing:** runs in the background inside the process. Transcoding goes to H.264 + AAC MP4 with fast start, plus a WebP poster frame. The capture time is read with `ffprobe`. The Media item moves from processing to ready or failed, and the original is deleted.
- **Uploads:** `multipart/form-data` is streamed straight to disk, never held in memory, so multi-GB videos work. The upload is processed after it has been received in full.
- **Serving Media:** through a route that requires the session. It supports HTTP Range requests so videos can be scrubbed, and sends long cache headers (file names change when content changes).
- **Sessions:**
  - The environment variables are `GALLERY_PASSWORD` and `SESSION_SECRET`.
  - The session cookie is signed with an HMAC, lasts 1 year, and is `HttpOnly`, `Secure` and `SameSite=Lax`.
  - It contains a fingerprint of the current Gallery password, so changing the password invalidates every session.
  - Next.js middleware redirects every page and API request without a valid session to the password screen.
  - All responses send `X-Robots-Tag: noindex`.
- **Timeline:** all Memories, oldest to newest. The page scrolls to the bottom when it opens.
- **Video playback in the grid:**
  - An IntersectionObserver plays a video muted while it's visible and pauses it when it leaves the screen, keeping its current position. A video that comes back on screen is muted.
  - One piece of state for the whole page tracks which video, if any, is unmuted. Unmuting one mutes the rest.
- **Magnify modal:**
  - A long press (about 400 ms without moving) or a mouse click opens it. A quick touch tap does nothing.
  - It shows a single item, with no swiping between items. It closes with the ✕, a tap on the backdrop, the Esc key or a swipe down.
  - A video carries its current position and mute state into the modal and gets a progress bar you can drag. Grid videos pause while the modal is open.
- **Interface language:** Italian throughout, with the strings kept together so they can be swapped later. Dates are formatted for the `it-IT` locale.

## Testing Decisions

- **A good test** checks behaviour you can see from outside a seam (what a call returns, what ends up in the data folder, what appears in the browser), never internal helpers or how components are structured.
- **Seam 1: the gallery core module (most tests).** Tested with Vitest against a temporary data folder, using real `ffmpeg` and the real photo converter on tiny sample files: a small JPEG with GPS EXIF, a small HEIC, and a 1-second video.
  - Assertions are made on what the module returns, on `database.json` and on the files in `media/`. Examples: an original is gone, GPS data is removed, overlapping Memories are rejected, Yearly occasions are matched including first years and leap days, days apart is correct, and Layout placement and rejection are correct.
- **Seam 2: the browser, through Playwright (a handful of tests).** Each test starts the real app against a temporary data folder and covers behaviour that only exists in a browser:
  - the password screen and the persistent cookie
  - the Timeline opening scrolled to the bottom
  - videos autoplaying while visible, pausing off screen and resuming muted
  - unmuting one video muting the others
  - a long press opening the modal while a quick tap does nothing
  - a full Admin round trip: create, upload, arrange
- There are no unit tests on React components or small helpers.
- **Prior art:** none, since this is a new project. Ticket 01 sets up both test harnesses for the later tickets to follow.

## Out of Scope

- More than one account or role; a separate admin password (ADR-0003).
- Keeping original files (ADR-0001).
- A database server (ADR-0002).
- Geocoding, a map view or tags.
- Swiping between items in the modal.
- Comments, reactions, or the Partner editing anything.
- A trash folder or undo for deletions.
- Interface languages other than Italian.
- Separate layouts for phone and desktop.
- Configuring HTTPS or nginx itself. Only documentation for nginx is provided.

## Further Notes

- **Deployment:** the app runs in the Curator's homelab behind an nginx they already run, with DNS on Hostinger, so there's no proxy in between to limit upload sizes. The upload size is limited only by nginx's `client_max_body_size`.
- **Development machine:** it has Node 24, pnpm, `ffmpeg` 9 and Playwright browsers. It doesn't have the `docker compose` plugin, so the Compose file can't be run here. Verify the container image with a plain `docker build`.

## Comments

- 2026-11-04: implemented on the integration branch `love-gallery-v1`, reviewed with /code-review, and the review findings fixed.
