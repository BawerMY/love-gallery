# 01: The Pasqua, Viaggio and Escursione Themes

**What to build:** Three new built-in Themes join the existing six: Pasqua (pastel green and yellow, egg or flower motif), Viaggio (sky blue, paper-plane motif) and Escursione (forest green, mountain motif). Each has every field the other Themes have, with its Italian label in the strings module and colours chosen to sit with the Diario palette. The Curator can pick them wherever a Theme is picked today, and they show on badges, Timeline entries and Memory title pages like the others. See spec, user stories 21–24, and the Implementation Decision on Themes.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Vitest: the three new Theme keys are accepted when saving an Occasion; an unknown key is still refused.
- [ ] Playwright: an Occasion given each new Theme shows a badge with that `data-theme`, and a Memory whose Main occasion has it shows that `data-theme` on its Timeline entry and title page.
- [ ] The new motifs are drawn and checked by eye.
