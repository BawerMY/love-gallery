# 02: One list of Occasions, added by hand

**What to build:** Replace Yearly occasions and One-off occasions with one list of Occasions (name and Theme), added to Memories by hand. A Memory stores an ordered list of Occasion ids; dates no longer add or remove Occasions, and anniversary numbers go away. An old `database.json` is converted once when read: Yearly occasions become Occasions added to every Memory they fall on (first year respected), One-off occasions become Occasions on their own Memory, clashing names merge (keeping the first non-Neutro Theme), each Memory's Occasions are ordered by the day they fell on then by name, and Main occasion references are remapped; the database version goes up by one. The Admin page gets an "Occasioni" section (create, rename, change Theme, alphabetical list, delete with a confirmation naming how many Memories use it, removing it from all of them). A Memory's Admin page lets the Curator pick an Occasion it doesn't have and remove one. The Main occasion fallback becomes the first non-Neutro Occasion in badge order; the selector shows only with two or more non-Neutro Occasions, and choosing a Neutro Occasion is refused. The gallery pages keep their look and `data-theme` hooks. See spec, user stories 1–9, 11, 14–20, 25–29, and the Implementation Decisions.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Vitest: create, rename, re-theme and delete Occasions; duplicate names (ignoring case) and unknown Themes refused; delete removes the Occasion from every Memory and reports the count.
- [ ] Vitest: add to and remove from a Memory; a Date range edit leaves Occasions alone.
- [ ] Vitest: Main occasion: chosen one honoured; Neutro refused when choosing; first non-Neutro in badge order as fallback, including after the chosen one is removed, deleted or turned Neutro; default look with no non-Neutro Occasion.
- [ ] Vitest: converting an old `database.json` (Yearly with and without first year, One-offs, name clashes, Main occasion references, badge order by day).
- [ ] Playwright: manage the list (create, rename, change Theme, delete with the usage count); pick and remove on a Memory; the selector appears only with two or more non-Neutro Occasions and changing it changes the Memory's `data-theme`.
- [ ] The existing Vitest and Playwright suites are green, rewritten where they relied on Yearly or One-off occasions.
