# 01: Tailwind v4, design tokens and fonts

**What to build:** Migrate the whole app to Tailwind CSS v4. Define the design tokens in `@theme` (colours cream, cocoa, soft cocoa, butter, honey, amber, heart red; radii 16px card / 12px tile; one soft shadow; the heart-pulse animation) and clear the default colour palette. Load Fraunces, Caveat and Nunito through `next/font/google` and expose them as Tailwind font tokens (display, hand, body). Convert `globals.css`, `layout-editor.module.css` and `occasions.module.css` to utility classes and delete the CSS modules. Restyle the password screen (wordmark "Giulia ♥ Bawer" large and centred in Caveat with the red heart, one rounded field, a honey button) and give the Admin page the shared fonts and colours while keeping it simple. Light theme only. The Timeline and Memory pages only need to be moved onto the tokens here; their Diario layouts come in 05 and 06. See spec, user stories 1–6, 9, 30, 31, and the Implementation Decisions on Tailwind, tokens and fonts. Tokens come from the prototype on branch `prototype/styling` (read it, don't copy it).

**Blocked by:** none

**Status:** done

- [x] Tailwind v4 is the only styling mechanism; no CSS modules remain and the global stylesheet holds only `@import "tailwindcss"`, `@theme` and base rules.
- [x] The default palette is cleared; only project tokens are available.
- [x] Fonts load via `next/font` with no visible font swap.
- [x] The whole existing Vitest and Playwright suites stay green.
