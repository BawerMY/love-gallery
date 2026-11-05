# 05: Timeline "Diario"

**What to build:** Restyle the Timeline as prototype C: a left rail with a month/year marker in Caveat wherever the month changes between entries; full-width entries with the cover across the top, the date in small amber capitals, the italic Fraunces title, the Cities, the note in Caveat and the Occasion badges; the Memory's effective Theme (from 03) as a thick left stripe and a soft entry tint; between entries the dashed honey connector with a gently pulsing honey heart and "N giorni di distanza" in Caveat. Entries fade and slide up slightly on first entering the viewport. All motion off under `prefers-reduced-motion`. Keep "opens scrolled to the bottom". See spec, user stories 7, 8, 12–15, 24, 28.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Playwright: a Timeline entry exposes the `data-theme` of its Main occasion, and each badge its own Theme.
- [ ] The existing Timeline e2e tests stay green.
