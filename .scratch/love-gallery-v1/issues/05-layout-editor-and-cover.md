# 05: Layout editor and cover

**What to build:** On a Memory's admin page, the Curator arranges its Media on the 3-column grid of square cells, dragging items to any cell and resizing them (width 1–3 columns, height of 1 or more rows). Empty cells are allowed and overlaps are prevented, and the result is saved. The Curator can also choose any ready Media item as the cover. The public Memory page shows the saved Layout exactly. See spec, user stories 43–46.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] The core module validates a Layout change as a whole: in bounds (column + width ≤ 3), no overlaps; otherwise it's rejected with nothing saved.
- [ ] The chosen cover is used on the Timeline card; when it's deleted, the default cover takes over.
- [ ] The editor works with both touch and mouse.
- [ ] Vitest covers validation and cover choice; a Playwright test resizes an item, saves, and checks the Memory page.
