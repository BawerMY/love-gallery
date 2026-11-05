# 03: Create an Occasion from a Memory's Admin page

**What to build:** On a Memory's Admin page, a "Nuova occasione" form (name and Theme, defaulting to Neutro) creates a new Occasion in the list and adds it to that Memory in one step, so a one-off moment like "Prima pizza insieme" stays quick. Duplicate names and unknown Themes are refused with the same Italian errors as the list. See spec, user story 10.

**Blocked by:** 02

**Status:** done

- [x] Vitest: create-and-add puts the new Occasion in the list and at the end of the Memory's Occasions; a duplicate name is refused and nothing is added.
- [x] Playwright: creating an Occasion from a Memory's Admin page shows its badge on the Memory and the Occasion in the Admin list.

## Comments

- 2026-11-05: implemented on the integration branch `occasions-by-hand`, reviewed with /code-review, and the review findings fixed.
