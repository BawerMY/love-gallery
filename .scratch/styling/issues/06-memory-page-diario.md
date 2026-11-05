# 06: Memory page "Diario"

**What to build:** Restyle the Memory page header as prototype C's centred title page: dates in small amber capitals, the title in large Fraunces, the Cities in italic, the badges, and the note in Caveat as a quote; decorated by the Memory's effective Theme (from 03) with motif dividers above and below, the Theme's gradient edge at the top and bottom, and faint motifs in the corners. Restyle the grid with 6px gaps and 12px corners without changing its behaviour; photos are never tinted or covered by a Theme. Tiles fade and slide up on first entering the viewport; the magnify modal opens with a soft zoom and matches the new look. All motion off under `prefers-reduced-motion`. Playback, mute rules, magnify gestures and the Layout editor behave exactly as before. See spec, user stories 7, 8, 16–20, 24, 28.

**Blocked by:** 03

**Status:** done

- [x] Playwright: the title page exposes the `data-theme` of its Main occasion.
- [x] The existing playback, magnify, media and layout e2e tests stay green.

## Comments

- 2026-11-05: implemented on the integration branch `styling`, reviewed with /code-review, and the review findings fixed.
