# 02: Themes on Occasions

**What to build:** A single module in the gallery core defines the six built-in Themes (Neutro, Anniversario, San Valentino, Natale, Capodanno, Compleanno), each with its Italian label, motif (heart, snowflake, star, confetti) and motif colours, entry stripe and tint, title page background/text/accent, and badge background/text. Start from the prototype's Theme table on branch `prototype/styling`. Yearly occasions and One-off occasions gain a Theme key in `database.json`; a missing key reads as Neutro, unknown keys are refused when saving. Every Occasion returned for display carries its Theme. The Yearly occasion and One-off occasion Admin forms get a Theme selector defaulting to Neutro. Occasion badges show their own Theme's colours and a tiny motif, and expose the Theme through a `data-theme` attribute. See spec, user stories 21–23, 29, 32, and the Implementation Decisions on Themes and data changes.

**Blocked by:** 01

**Status:** done

- [x] Vitest: Themes are stored on Yearly and One-off occasions; Neutro is the default; unknown keys are rejected.
- [x] Vitest: a `database.json` from before this change loads with every Occasion treated as Neutro.
- [x] Playwright: setting a Theme on an Occasion in the Admin page shows the badge with that `data-theme`.

## Comments

- 2026-11-05: implemented on the integration branch `styling`, reviewed with /code-review, and the review findings fixed.
