# Spec: Occasions added by hand

**Status:** ready-for-agent

Vocabulary follows `GLOSSARY.md`, which already describes the new model: one list of **Occasions**, added to Memories by hand, each carrying a **Theme**. This builds on the styling work (`.scratch/styling/spec.md`, branch `styling`), where Themes and the **Main occasion** were introduced.

## Problem Statement

Occasions are matched to Memories by date. That works for a fixed day like Natale, but not for the things that matter to us: Pasqua moves every year, and "a trip together" or "a hike together" have no date at all. A date-matched birthday also needs the right day stored up front. The Curator wants to say what a Memory *was*, not have the calendar decide it.

## Solution

There is one list of Occasions, such as Compleanno di Giulia, Anniversario, San Valentino, Viaggio insieme, Escursione insieme, Natale, Pasqua and Capodanno. Each has a name and a Theme. The Curator adds Occasions to a Memory by hand, picking from the list or creating a new one in place, and orders a Memory's badges by drag and drop. Dates no longer add or remove anything. Three new Themes join the six existing ones: Pasqua, Viaggio and Escursione. Existing data is converted once, so nothing the Partner sees changes.

## User Stories

### The list of Occasions
1. As the Curator, I want one list of Occasions on the Admin page, so that I define each special thing once.
2. As the Curator, I want each Occasion to have a name and a Theme, so that its badge looks right on every Memory.
3. As the Curator, I want to create an Occasion with a name and a Theme, defaulting to Neutro, so that I can add new kinds of moments.
4. As the Curator, I want two Occasions with the same name refused, ignoring upper and lower case, so that the list stays clean.
5. As the Curator, I want the list sorted alphabetically, so that I can find an Occasion quickly.
6. As the Curator, I want to rename an Occasion or change its Theme, and see the change on every Memory that has it, so that one fix is enough.
7. As the Curator, I want deleting an Occasion to remove it from every Memory, after a confirmation telling me how many Memories use it, so that I don't remove something by accident.

### Occasions on a Memory
8. As the Curator, I want to add an Occasion to a Memory by picking it from the list, so that I don't retype names.
9. As the Curator, I want the picker to offer only Occasions the Memory doesn't already have, so that a badge can't appear twice.
10. As the Curator, I want to create a new Occasion right from a Memory's Admin page, with a name and a Theme, and have it added to that Memory, so that a one-off moment like "Prima pizza insieme" stays one step.
11. As the Curator, I want to remove an Occasion from a Memory without deleting it from the list, so that other Memories keep it.
12. As the Curator, I want to reorder a Memory's Occasions by drag and drop, with touch on my phone and with a mouse, so that the most important badge comes first.
13. As the Curator, I want the new order saved as soon as I drop, with a short "Ordine salvato" confirmation, so that I don't need a Save button.
14. As the Curator, I want changing a Memory's Date range to leave its Occasions alone, so that Occasions only ever change by hand.
15. As the Partner, I want a Memory's badges shown in the order the Curator set, on both its Timeline entry and its Memory page, so that the order means something.
16. As the Partner, I want each badge in its own Theme's colours and motif, as today, so that I can tell Occasions apart.

### Main occasion
17. As the Curator, I want the "Occasione principale" selector shown only when a Memory has two or more Occasions whose Theme isn't Neutro, so that I'm only asked when there's a real choice.
18. As the Curator, I want "Automatica" to pick the first non-Neutro Occasion in badge order, so that reordering the badges is enough to change the look.
19. As the Curator, I want the same fallback when my chosen Main occasion is removed from the Memory, deleted from the list, or turned Neutro, so that a Memory never keeps a Theme it no longer has.
20. As the Partner, I want a Memory with no non-Neutro Occasion to keep the default cream and honey look, so that ordinary Memories look calm.

### New Themes
21. As the Curator, I want a Pasqua Theme in pastel green and yellow with an egg or flower motif, so that Easter Memories feel like spring.
22. As the Curator, I want a Viaggio Theme in sky blue with a paper-plane motif, so that our trips stand out.
23. As the Curator, I want an Escursione Theme in forest green with a mountain motif, so that our hikes have their own look.
24. As the Partner, I want the new Themes on badges, Timeline entries and title pages, just like the existing ones, so that they feel part of the same gallery.

### Converting existing data
25. As the Curator, I want each existing Yearly occasion to become an Occasion in the list, added to every Memory it falls on today, so that nothing disappears.
26. As the Curator, I want each existing One-off occasion to become an Occasion in the list, added to its own Memory, so that "Prima pizza insieme" and "Giro in gondola" stay where they are.
27. As the Curator, I want converted badges ordered by the day they fell on, so that "Natale" still comes before "Capodanno".
28. As the Curator, I want my existing Main occasion choices to carry over, so that every Memory keeps its look.
29. As the Partner, I want the gallery to look exactly the same right after the conversion, except for the anniversary numbers, so that the change is invisible to me.

## Implementation Decisions

- **One kind of Occasion.** Yearly occasions and One-off occasions are replaced by a single Occasion: an id, a unique name (compared ignoring case and surrounding spaces) and a Theme key. The list lives at the top level of `database.json`.
- **A Memory stores an ordered list of Occasion ids**, and nothing else per Occasion. The order is the badge order. A Memory's Main occasion becomes a plain Occasion id.
- **No date logic for Occasions.** Matching by day, the first year and the anniversary number are removed. The Date range no longer affects Occasions.
- **The gallery core module offers:**
  - list, create, update and delete for Occasions. Delete removes the id from every Memory and returns how many Memories used it before deletion; a way to count usage ahead of the confirmation is needed too;
  - add an existing Occasion to a Memory, create-and-add in one step, remove from a Memory, and set a Memory's full order (refused unless it is a permutation of the Memory's current Occasions);
  - choose the Main occasion, refusing an Occasion the Memory doesn't have or one that is Neutro.
  
  Unknown Theme keys and duplicate names are refused with Italian errors from the strings module.
- **The Theme decision** keeps its shape: given a Memory and the Occasion list, it returns the effective Main occasion (or none) and the Theme: the chosen one if the Memory still has it and it isn't Neutro; otherwise the first non-Neutro Occasion in badge order; otherwise Neutro. Every Occasion returned for display carries its Theme, in badge order.
- **Themes:** Pasqua, Viaggio and Escursione are added to the built-in Theme module, each with the same fields as the others. New motifs: egg or flower, paper plane and mountain. Labels go in the strings module. Colours are picked to sit with the Diario palette and judged by eye.
- **Conversion** happens once when an old `database.json` is read, and the database version goes up by one:
  - each Yearly occasion becomes an Occasion and is added to every Memory it falls on, using the old matching rules (including its first year);
  - each One-off occasion becomes an Occasion added to its Memory;
  - when names clash (a One-off with the same name as a Yearly, or two One-offs with one name), they merge into one Occasion keeping the first Theme met that isn't Neutro;
  - each Memory's Occasions are ordered by the day they fell on, then by name;
  - Main occasion references are remapped to the new ids.
  
  The converted file is written back on the next save, as any other change.
- **Admin page:**
  - an "Occasioni" section replacing the Yearly occasion section: a create form (name and Theme), and per Occasion an edit form and a delete button with a confirmation that names the number of Memories using it;
  - on a Memory's Admin page, the One-off occasion section is replaced by: the Memory's Occasions as a drag-and-drop list with a remove button each, a picker of the Occasions it doesn't have, and a "Nuova occasione" form (name and Theme) that creates and adds;
  - drag and drop works with touch and mouse, in the same way as the Layout editor's gestures; dropping saves the order straight away and shows "Ordine salvato";
  - the Main occasion selector appears only with two or more non-Neutro Occasions, with "Automatica" first.
- **Gallery pages:** the Timeline entry, Memory page title page and badges keep their current look and `data-theme` hooks; only the source of the Occasions and their order changes. Badges no longer show an anniversary number.

## Testing Decisions

- **A good test** checks behaviour seen from outside: what the gallery core module returns and saves, and what the browser shows. No assertions on class names or component structure; `data-theme` attributes are the sanctioned hook.
- **Seam 1, the gallery core module (Vitest)**, against a temporary data folder as in v1 and styling:
  - creating, renaming, re-theming and deleting Occasions; duplicate names and unknown Themes refused; delete removes the Occasion from every Memory and reports the count;
  - adding, creating-and-adding, removing and reordering on a Memory; a bad reorder refused; a Date range edit leaves Occasions alone;
  - the Main occasion: a chosen one honoured; Neutro refused when choosing; the first non-Neutro in badge order as the fallback, including after the chosen one is removed, deleted or turned Neutro; the default look with no non-Neutro Occasion;
  - converting an old `database.json` (Yearly with and without first year, One-offs, name clashes, Main occasion references, badge order by day).
- **Seam 2, the browser (Playwright)**:
  - managing the list: create, rename, change Theme, delete with the usage count in the confirmation;
  - on a Memory: pick from the list, create in place, remove, drag-and-drop reorder (saved after reload), and the badge order on the Timeline entry and Memory page;
  - the selector appears only with two or more non-Neutro Occasions, and changing it or the badge order changes the Memory's `data-theme`;
  - the new Themes show on badges through `data-theme`.
  - The whole existing suite stays green, rewritten where it relied on Yearly or One-off occasions.
- **Prior art:** `tests/gallery/occasions.test.ts`, `themes.test.ts`, `main-occasion.test.ts`, `storage.test.ts`; `e2e/occasions.spec.ts`, `themes.spec.ts`, `main-occasion.spec.ts`, `layout.spec.ts` (touch and mouse gestures), and the seeding helpers in `e2e/fixtures.ts`.

## Out of Scope

- Any date-based matching, including computing Easter's date.
- Anniversary numbers ("2° anniversario").
- Per-Memory details on an Occasion (a day, a note).
- Ordering the list itself; it is always alphabetical.
- Themes designed by the Curator; Themes stay a fixed set in code.
- Any other change to the Timeline, Memory page or Admin page beyond what Occasions need.

## Further Notes

- `GLOSSARY.md` was updated during the grilling session: Yearly occasion and One-off occasion are retired in favour of a single Occasion. No ADR, by the user's choice.
- The live `data/database.json` has six Yearly occasions with Themes (including a placeholder "Compleanno di Bawer" on 18/11) and two One-off occasions; the conversion must handle it.
