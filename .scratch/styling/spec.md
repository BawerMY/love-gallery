# Spec: Styling, Themes and the Diario look

**Status:** done

Vocabulary follows `GLOSSARY.md`, including **Theme** and **Main occasion**. This builds on v1 (`.scratch/love-gallery-v1/spec.md`). The look comes from the winning prototype variant, **C "Diario"**, kept on branch `prototype/styling` (verdict in commit `92ffa0b`).

## Problem Statement

The gallery works, but it looks like a plain web page: system fonts, a generic raspberry accent and no personality. Every Memory looks the same, even when it falls on Christmas, Valentine's Day or our anniversary. It doesn't yet feel like a keepsake made for Giulia.

## Solution

Restyle the whole site as a warm, romantic-and-playful journal ("Diario"):
- cream paper, cocoa text and a honey-yellow accent
- an elegant Fraunces serif for titles
- a Caveat handwriting for personal touches
- the friendly Nunito for everything else

The Timeline becomes a journal, with month and year markers along a left rail and each Memory as a wide entry. A Memory page opens with a centred title page.

Occasions get **Themes**: built-in looks such as San Valentino, Natale or Anniversario that restyle the Memories they fall in. The Curator picks a Theme for each Occasion. When a Memory has several Occasions, the Curator can also pick which one is the **Main occasion**. A fixed "Giulia ♥ Bawer" bar, with a red heart, sits at the top of every gallery page.

## User Stories

### Overall look
1. As the Partner, I want the gallery to feel like a warm handmade journal, so that it feels like a keepsake and not a website.
2. As the Partner, I want a cream paper background with dark cocoa text, so that it's easy to read and gentle on the eyes.
3. As the Partner, I want honey yellow as the accent colour for hearts, lines, buttons and badges, so that the gallery has one warm, consistent highlight.
4. As the Partner, I want any yellow text in a darker amber, so that it's always readable on cream.
5. As the Partner, I want titles in an elegant serif, handwritten touches for personal words, and a friendly sans-serif for everything else, so that each kind of text has its own voice.
6. As the Partner, I want the fonts to load without the text visibly jumping or changing font, so that the page feels polished.
7. As the Partner, I want things to fade and slide gently into view as I scroll, so that the gallery feels alive.
8. As the Partner, I want all motion turned off when my phone is set to reduce motion, so that it never makes me uncomfortable.
9. As the Partner, I want the gallery in a light theme only, so that it always looks the way it was designed.

### Top bar
10. As the Partner, I want a fixed bar at the top showing "Giulia ♥ Bawer" in handwriting, with a red heart, so that it always feels like our place.
11. As the Partner, I want tapping the top bar to scroll to the bottom of the Timeline, so that I can jump back to our newest Memory.

### Timeline ("Diario")
12. As the Partner, I want a left rail with month and year markers in handwriting, so that I can feel time passing as I scroll.
13. As the Partner, I want each Memory to be a wide journal entry: the cover across the top, the date in small amber capitals, the title in italic serif, the Cities, the note in handwriting, and the Occasion badges, so that each entry reads like a page of a diary.
14. As the Partner, I want a dashed honey line between entries with a small, gently pulsing heart and "N giorni di distanza" handwritten next to it, so that the distance between our meetings is visible but tender.
15. As the Partner, I want each entry to show its Theme as a thick coloured stripe on its left edge and a soft background tint, so that special Memories stand out as I scroll.

### Memory page
16. As the Partner, I want a Memory to open with a centred title page: the dates in small capitals in the Theme's accent colour (amber for Neutro), the title in large serif, the Cities in italic, the badges, and the note in handwriting as a quote, so that each Memory begins like a chapter.
17. As the Partner, I want the title page decorated by its Theme, with motif dividers, a coloured edge at the top and bottom, and faint motifs in the corners, so that a Christmas Memory feels like Christmas.
18. As the Partner, I want Media tiles with small 6px gaps and 12px rounded corners, so that the grid looks soft and tidy.
19. As the Partner, I want photos never tinted or covered by a Theme, so that they always look as they were taken.
20. As the Partner, I want the magnify modal to open with a soft zoom and match the new look, so that it feels part of the same gallery.

### Themes
21. As the Curator, I want to pick a Theme for each Yearly occasion (Anniversario, San Valentino, Natale, Capodanno, Compleanno or Neutro), so that our special days get their own look.
22. As the Curator, I want to pick a Theme for each One-off occasion, defaulting to Neutro, so that unique moments can be themed too.
23. As the Partner, I want each Occasion badge in its own Theme's colours with a tiny motif, so that I can tell Occasions apart at a glance.
24. As the Partner, I want a Memory to take the Theme of its Main occasion on both its Timeline entry and its Memory page, so that its look is consistent.
25. As the Curator, I want to choose the Main occasion on a Memory's Admin page when it has two or more Occasions, so that, for example, "Natale e Capodanno" looks like Christmas.
26. As the Curator, I want the first non-Neutro Occasion by day to be used when I haven't chosen a Main occasion, so that I rarely need to choose.
27. As the Curator, I want the same fallback when my chosen Main occasion no longer applies (for example after I change the Date range), so that a Memory never ends up with a Theme it no longer has.
28. As the Partner, I want a Memory with no themed Occasion to keep the default cream and honey look, so that ordinary Memories look calm.
29. As the Curator, I want existing Occasions to start out as Neutro after the update, so that nothing breaks or changes until I choose.

### Password screen and Admin page
30. As the Partner, I want the password screen to show "Giulia ♥ Bawer" large and centred, with one rounded password field and a honey button, so that even the door feels like ours.
31. As the Curator, I want the Admin page in the same fonts and colours but kept simple and functional, so that managing Memories stays quick.
32. As the Curator, I want a Theme selector in the Yearly occasion and One-off occasion forms, and the Main occasion selector on the Memory form, so that every styling choice is made where the Occasion lives.

## Implementation Decisions

- **Tailwind CSS v4, full migration.** The global stylesheet and both CSS modules become Tailwind utility classes, with design tokens defined in `@theme`. The colour palette is limited to the project's tokens (the default palette is cleared), so stray colours can't creep in. When the migration is done, there's only one way of styling in the codebase.
- **Tokens** (from the prototype):
  - colours: cream `#FBF6EF` (page), cocoa `#3B2A2F` (text), a softer cocoa for secondary text, butter `#FBEFCF` (surfaces), honey `#E9B44C` (shapes only), amber `#9A6A12` (yellow as text), the heart red `#C8374D` (the wordmark heart, and errors and delete buttons through a `danger` token), and plain white (Admin surfaces) and black (video controls)
  - radii: 16px for cards, 12px for tiles
  - one soft shadow
  - a heart-pulse animation
- **Fonts** through `next/font/google`: Fraunces (display: titles, italic on the Timeline), Caveat (hand: the wordmark, rail markers, days apart, notes) and Nunito (body). They're exposed as Tailwind font tokens and use `display: block`, so text never shows in a fallback font that then changes.
- **Themes are built into the code, not data.** A single module defines the six Themes: Neutro, Anniversario, San Valentino, Natale, Capodanno and Compleanno. Adding a Theme is a code change. Each Theme defines:
  - its Italian label and its motif (heart, snowflake, star or confetti) with motif colours
  - the entry stripe (a colour or gradient) and the entry tint
  - the title page background, text colour and accent colour
  - the badge background and text colours

  The prototype's Theme table holds the colour values to start from (branch `prototype/styling`).
- **Data changes in `database.json`:**
  - Every Yearly occasion and One-off occasion gains a Theme key.
  - Every Memory gains an optional Main occasion reference. A Yearly occasion is referenced by its id; a One-off occasion by its id within the Memory.
  - When a file without these fields is loaded, a missing Theme counts as Neutro and a missing Main occasion as "not chosen". No migration step is needed.
- **The core module decides the Theme.** A single function takes a Memory and the Yearly occasions and returns the Memory's effective Main occasion (or none) and its Theme:
  1. the chosen Main occasion, if it still applies to the Memory and isn't Neutro;
  2. otherwise the first non-Neutro Occasion by day;
  3. otherwise the default (Neutro) look.

  Every Occasion returned for display carries its own Theme. Unknown Theme keys are refused when saving.
- **Admin changes:**
  - a Theme selector in the Yearly occasion form and in the One-off occasion form, defaulting to Neutro;
  - an "Occasione principale" (Main occasion) selector on a Memory's Admin page, shown only when two or more Occasions apply, with "Automatica" (automatic) as the first option.
- **Top bar:** fixed at the top of every gallery page (the Timeline and Memory pages; not the password screen or the Admin page). It shows the wordmark small, with the heart as an inline SVG filled red `#C8374D`. Tapping it goes to the Timeline scrolled to the bottom; on the Timeline itself it scrolls smoothly, or instantly when reduced motion is set.
- **Timeline layout** as in prototype C:
  - the left rail, with a month/year marker wherever the month changes between entries;
  - full-width entries: cover, date in amber capitals, italic Fraunces title, Cities, the note in Caveat, badges;
  - the Theme as the left stripe and the entry tint;
  - between entries, the dashed honey connector with the pulsing honey heart and the days apart in Caveat.
  
  The "opens scrolled to the bottom" behaviour is kept.
- **Memory page header** as in prototype C: a centred title page with motif dividers above and below, the Theme's gradient edge at the top and bottom, and faint motifs in the corners. Below it, the existing grid is restyled (6px gaps, 12px corners) without changing how it behaves.
- **Motion:**
  - entries and tiles fade and slide up slightly when they first enter the viewport;
  - the magnify modal opens with a soft zoom;
  - the connector hearts pulse.
  
  All of it is disabled under `prefers-reduced-motion`.
- **Restyle only.** The existing behaviour (autoplay, mute rules, the magnify gestures, the Layout editor, uploads) stays exactly as it is.
- **The prototype isn't merged.** The prototype code is a reference to read, not code to copy. It's rewritten properly in the real components.

## Testing Decisions

- **A good test** checks behaviour you can see from outside: what the core module returns and saves, and what the browser shows. It never checks class names chosen for convenience or how components are put together.
- **Seam 1, the gallery core module (Vitest)**, run against a temporary data folder as in v1:
  - Themes are stored on Yearly occasions and One-off occasions, Neutro is the default, and unknown keys are rejected.
  - Main occasion: a chosen one is honoured; Neutro is skipped; the first non-Neutro Occasion by day is used when none is chosen, or when the chosen one no longer applies after a Date range edit or deletion; a Memory with no themed Occasion gets the default look.
  - A `database.json` from before this change loads with everything treated as Neutro.
- **Seam 2, the browser (Playwright)**:
  - A Memory's Timeline entry and its title page show the Theme of its Main occasion, and each badge shows its own Theme. Assert on a `data-theme` attribute, or similar, that the components expose for exactly this purpose.
  - The Main occasion selector appears only when two or more Occasions apply, and changing it changes the Memory's Theme.
  - Tapping the top bar scrolls the Timeline to the bottom.
  - The whole existing v1 browser suite stays green. It's the safety net for the restyle.
- **No screenshot-comparison tests.** The look is judged by eye.
- **Prior art:** `tests/gallery/*.test.ts` and `e2e/*.spec.ts` from v1, with their temporary data-folder helpers and fixtures.

## Out of Scope

- A dark theme, or following the phone's light/dark setting.
- Themes designed by the Curator in the Admin page (colour pickers). Themes are a fixed set in code.
- Tinting or applying filters to photos.
- Polaroid frames, tilted cards, the zigzag layout and the hero header (prototype variants A and B were rejected).
- Livelier animation (floating hearts, confetti bursts).
- Redesigning the Admin page beyond the shared fonts and colours.
- Any change to behaviour or data other than Themes and the Main occasion.

## Further Notes

- Prototype C's screenshots are on disk (`timeline-C.png` and `memory-natale-C.png`) in the session scratchpad. The code is on branch `prototype/styling`.
- In the prototype, the global stylesheet wasn't in a CSS layer, so it overrode Tailwind. The full migration removes that conflict.
- The only red in the palette outside the San Valentino and Natale Themes is the heart red, used for the wordmark heart and for errors.
