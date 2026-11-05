# 04: Reorder a Memory's Occasions by drag and drop

**What to build:** On a Memory's Admin page, the Curator reorders the Memory's Occasions by drag and drop, with touch and with a mouse, following the Layout editor's approach to gestures. Dropping saves the order straight away and shows "Ordine salvato". The order is the badge order on the Timeline entry and the Memory page, and it drives the automatic Main occasion. See spec, user stories 12, 13, 15 and 18.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Vitest: setting a Memory's order is saved; an order that isn't a permutation of the Memory's current Occasions is refused.
- [ ] Playwright: drag and drop with mouse and with touch reorders the Occasions, survives a reload, and changes the badge order on the Timeline entry and the Memory page.
- [ ] Playwright: with "Automatica", moving a different non-Neutro Occasion first changes the Memory's `data-theme`.
