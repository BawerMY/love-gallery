# 06: Video playback in the grid

**What to build:** On the Memory page, a video plays muted and looping while it's visible and pauses when it scrolls off screen, keeping its position. When it comes back on screen it resumes from that moment, muted. Each video has an unmute icon at the bottom right. Unmuting one video mutes every other video on the page. Photos and videos load only when they get near the screen. See spec, user stories 17–22.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Videos only start loading as they approach the screen.
- [ ] Playwright (with a sample video in a temp data folder): a video is playing while in view, is paused after scrolling away, resumes from the same moment or later, and is muted when scrolled back.
- [ ] Playwright: unmuting video A, then video B, leaves A muted.
