# 02: Memories and the Timeline

**What to build:** In `/admin`, the Curator can create, edit and delete a Memory, with an optional title and note, one or more Cities in order (with suggestions from Cities used before), and a Date range. Saving is refused, with an Italian message, when the Date range overlaps another Memory. The Timeline shows every Memory as a vertical chain of cards from oldest to newest, opens scrolled to the bottom, and shows "N giorni di distanza" (N days apart) on the line between cards. Tapping a card opens the Memory's page, which shows its header (title, Cities, Date range, note). Deleting a Memory asks for confirmation and also removes its folder in `media/`. See spec, user stories 8–14 and 28–32.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The core module can create, edit, delete and list Memories in Timeline order, and rejects overlapping Date ranges (back-to-back days are allowed).
- [ ] Days apart = the next Memory's start day − the previous Memory's end day − 1.
- [ ] City suggestions come from the distinct Cities of all existing Memories.
- [ ] The Admin page has a list, create and edit forms, and a delete button with a confirmation.
- [ ] The Timeline opens scrolled to the newest Memory at the bottom; cards show the title, Cities and Date range (in it-IT format), with a placeholder where the cover will go.
- [ ] Vitest covers the rules; a Playwright test covers creating a Memory in the Admin page, seeing it on the Timeline, and the page opening scrolled to the bottom.
