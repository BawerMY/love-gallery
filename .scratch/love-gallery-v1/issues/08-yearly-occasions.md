# 08: Yearly occasions

**What to build:** A section in `/admin` to create, edit and delete Yearly occasions: a name, a day and month, and an optional first year. They're saved in `database.json` and never stored on Memories. A Yearly occasion belongs to every Memory, past ones included, whose Date range includes its day in some year Y, as long as Y is on or after the first year if one is set. When a first year is set and Y is after it, the badge shows the number ("2° anniversario", 2nd anniversary); otherwise just the name. Badges appear on Timeline cards and in the Memory page header. A 29 February occasion only matches in leap years. See spec, user stories 47–50 and 52.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Vitest: matching across year boundaries (a Date range of 30 Dec–2 Jan), first-year cut-off, numbering, leap days, and retroactive matching of an occasion added later.
- [ ] Badges render on Timeline cards and Memory pages.
- [ ] Playwright: add a Yearly occasion in the Admin page and see its badge on an existing Memory.
