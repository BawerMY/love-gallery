# 04: Top bar

**What to build:** A fixed bar at the top of the Timeline and Memory pages (not the password screen or Admin) showing the "Giulia ♥ Bawer" wordmark small in Caveat, with the heart as an inline SVG filled `#C8374D`. Tapping it goes to the Timeline scrolled to the bottom; on the Timeline it scrolls smoothly, or instantly under reduced motion. Content must not be hidden under the bar. See spec, user stories 10–11, and the Implementation Decision on the top bar.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Playwright: tapping the top bar on the Timeline scrolls to the bottom; tapping it on a Memory page lands on the Timeline at the bottom.
- [ ] The bar is absent on the password screen and the Admin page.
