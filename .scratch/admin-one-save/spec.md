# Spec: One Save on a Memory's Admin page, and a softer Admin look

**Status:** ready-for-agent

Vocabulary follows `GLOSSARY.md`. This builds on `.scratch/occasions-by-hand/spec.md` and **overrides** its "dropping saves the order straight away and shows 'Ordine salvato'" and its immediate saves for picking, removing and creating Occasions on a Memory and for the Main occasion.

## Problem Statement

A Memory's Admin page saves in five different ways: the details have a Save button, the Main occasion saves on change, each Occasion add, remove, create and drag saves at once, the Layout has its own Save, and Media uploads at once. The Curator can't tell what is saved, and the page looks like a stack of loose forms.

## Solution

Every edit on a Memory's Admin page, except uploading and deleting Media, is held as an unsaved change until one **Salva** in a sticky bar at the bottom of the screen. The sections become soft white cards with rounded fields, and are reordered: Details (with the Main occasion), Occasions, Galleria, then Delete. Media has no section of its own: photos and videos are added by tapping an empty cell of the Layout grid and removed from their tile, in the Layout section, whose heading becomes "Galleria" (was "Disposizione").

## Decisions

- **What the one Save covers:** title, Cities, Date range, note; the Main occasion; the Memory's Occasions (pick from the list, remove, reorder by drag and drop, and "Nuova occasione" create-in-place); the Layout (cells) and the cover. Uploading and deleting Media stay immediate, since files are processed on the server; the Layout editor keeps merging arriving Media into the unsaved Layout as it does today.
- **One server call, all or nothing.** Saving sends the whole draft to one server action, backed by one gallery core function that applies it in one storage update. Any refusal (duplicate or blank new Occasion name, unknown Theme, bad Date range, Neutro or absent Main occasion, a Layout that doesn't fit) saves nothing and shows the Italian error in the bar. New Occasions created in place are created in the list only when the Save succeeds.
- **The draft drives the page.** The Main occasion selector's visibility (two or more non-Neutro Occasions) and its options follow the draft Occasions. The picker offers only Occasions not in the draft. The gallery pages change only after Save.
- **The sticky bar:** fixed to the bottom of the viewport on a Memory's Admin page. Shows "Modifiche non salvate" and an enabled **Salva** when the draft differs from what's saved; "Salvataggio…" while saving; "Salvato" after success; the error on refusal. Salva is disabled with no changes. Leaving with unsaved changes warns: `beforeunload` for reload or close, and a confirmation on the "← back" link.
- **Look ("soft cards"):** each section is a white rounded card (`rounded-card`, soft shadow) with its heading inside; fields are taller, more rounded, with a honey focus ring. Applied through the shared classes in `src/components/ui.ts`, so the main Admin page and the new-Memory page get the same shapes. On the phone everything is one column; the start and end days stay side by side.
- **Section order on a Memory's Admin page:** Details (with the Main occasion), Occasions, Galleria, Delete.
- **Galleria:** the Layout section, renamed from "Disposizione", is where Media is added and deleted; there is no separate Media section, no "Aggiungi foto e video" button and no thumbnail list under the grid. Uploads and deletes stay immediate.
  - **Adding:** tapping or clicking an empty cell of the grid opens the file picker. The uploaded items land in that cell; several files fill it and then the next free cells in reading order (left to right, then the rows below), in capture-time order. "Free" skips both the saved Layout and the cells of the unsaved Layout, which survives the upload as before. When the tapped cell is only free in the unsaved Layout (its saved item was moved away but not saved), the first item goes to the next cell free in both. The grid always shows two empty rows below the Layout, so there is always somewhere to tap.
  - **Deleting:** each tile has a ✕ handle in its free corner (bottom left), styled like ✥, ☆ and ◢, named "Elimina foto N" or "Elimina video N". It asks first, in a dialog over the page ("Sì, elimina" / "Annulla").
  - **Processing and failed Media** show their state ("In elaborazione…", "Conversione non riuscita") on their tile, which can be moved and deleted like any other.
  - **Cover:** chosen with a tile's ☆ handle, saved with the rest of the page. There is no "Copertina automatica" button any more: with no cover chosen, the automatic cover (the first ready item in reading order) still applies, but once one is chosen the Curator picks another rather than going back to automatic.
  - **Captured outside the Date range:** the tile gets an amber ring, and a note under the grid names it ("Foto N: scattata fuori dalle date del ricordo").
- **Unchanged:** the main Admin page keeps its per-Occasion edit forms and saves (shape only changes); the new-Memory page keeps its "Crea" flow; drag and drop keeps touch and mouse gestures and arrow keys.
- Strings in the strings module, in Italian.

## Testing Decisions

- **Vitest (gallery core):** new Media placed from a tapped cell takes that cell, then the next free cells in reading order, skipping saved and unsaved cells. The one save function applies details, Occasion order (including new Occasions created at the right place), Main occasion, Layout and cover together; any refusal leaves `database.json` unchanged.
- **Playwright:** edit details, add, create, remove and reorder Occasions, change the Main occasion and move a Layout cell, then one Salva; after reload everything is there and the Memory's `data-theme` and badge order changed. Before Salva, a reload loses them (and the gallery pages show nothing new). Salva is disabled with no changes. A refused save shows the error and saves nothing. Uploading Media still works immediately: by touch and by mouse, into the tapped cell and then the next free ones, keeping the unsaved Layout. Deleting from the tile's ✕ asks first and works immediately, for ready, processing and failed Media.
- The existing suites stay green, rewritten where they relied on immediate saves (`occasions.spec.ts`, `occasion-order.spec.ts`, `main-occasion.spec.ts`, `layout.spec.ts`, `themes.spec.ts`, and others that edit a Memory).
- Look checked by eye with screenshots on mobile.

## Out of Scope

- A global save on the main Admin page.
- Undo, autosave, or keeping drafts across reloads.
