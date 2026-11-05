# 03: Main occasion and a Memory's effective Theme

**What to build:** Memories gain an optional Main occasion reference in `database.json` (a Yearly occasion by id, a One-off occasion by its id within the Memory; missing means "not chosen"). The gallery core gets one function that takes a Memory and the Yearly occasions and returns its effective Main occasion (or none) and Theme: the chosen Main occasion if it still applies and isn't Neutro; otherwise the first non-Neutro Occasion by day; otherwise the default Neutro look. The Memory Admin page shows an "Occasione principale" selector, with "Automatica" first, only when two or more Occasions apply. Expose the result to the gallery pages (data for 05 and 06; a minimal `data-theme` on the Timeline entry and Memory header is enough here). See spec, user stories 24–29, and the Implementation Decisions on the core module and Admin changes.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Vitest: a chosen Main occasion is honoured; Neutro is skipped; the first non-Neutro by day is used when none is chosen, or when the chosen one no longer applies after a Date range edit or an Occasion deletion; no themed Occasion gives the default look.
- [ ] Vitest: a `database.json` without Main occasions loads as "not chosen".
- [ ] Playwright: the selector appears only with two or more Occasions, and changing it changes the Memory's `data-theme` on the Timeline entry and Memory page.
