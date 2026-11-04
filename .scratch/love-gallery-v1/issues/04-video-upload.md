# 04: Uploading and transcoding videos

**What to build:** The Curator can upload videos along with photos. Once a video has been received, the Media item shows as "in elaborazione" (processing) while `ffmpeg` converts it in the background to an H.264 + AAC MP4 with fast start and makes a WebP poster frame. The capture time is read with `ffprobe`, and the original is deleted (ADR-0001). The item then shows as ready, or as failed (with the option to delete it). Videos take their place in the Layout like photos. For now the Memory page shows the poster with a plain `<video>`; autoplay comes in ticket 06. See spec, user stories 34, 36 and 38.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Vitest with a 1-second sample video: the item goes from processing to ready, the output is a playable H.264 MP4 with a poster, the capture time is saved, and the original is gone.
- [ ] Vitest: a corrupt video ends up marked as failed, and its temporary files are removed.
- [ ] The Admin page shows upload progress and the processing state, refreshing until the item is ready.
- [ ] Media items that are still processing don't appear on the public Memory page.
