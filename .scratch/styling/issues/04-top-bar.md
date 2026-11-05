# 04: Top bar

**What to build:** A fixed bar at the top of the Timeline and Memory pages (not the password screen or Admin) showing the "Giulia ♥ Bawer" wordmark small in Caveat, with the heart as an inline SVG filled `#C8374D`. Tapping it goes to the Timeline scrolled to the bottom; on the Timeline it scrolls smoothly, or instantly under reduced motion. Content must not be hidden under the bar. See spec, user stories 10–11, and the Implementation Decision on the top bar.

**Blocked by:** 01

**Status:** done

- [x] Playwright: tapping the top bar on the Timeline scrolls to the bottom; tapping it on a Memory page lands on the Timeline at the bottom.
- [x] The bar is absent on the password screen and the Admin page.

## Comments

- 2026-11-05: implemented on the integration branch `styling`, reviewed with /code-review, and the review findings fixed.
