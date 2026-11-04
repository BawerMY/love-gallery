# 07: Magnify modal

**What to build:** On the Memory page, a long press of about 400 ms without moving (touch) or a mouse click opens a modal showing just that Media item, magnified. A quick tap does nothing. The modal closes with the ✕, a tap on the backdrop, the Esc key or a swipe down. A magnified video continues from the same moment with its mute state, and has a progress bar you can drag. Grid videos pause while the modal is open and pick up their behaviour from ticket 06 once it closes. See spec, user stories 23–27.

**Blocked by:** 03, 06

**Status:** done

- [x] Playwright: a quick tap opens nothing; a long press opens the modal; Esc and a backdrop tap close it.
- [x] Playwright: a magnified video starts within about a second of where the grid video was and keeps its mute state; dragging the progress bar seeks.
- [x] A swipe down closes the modal on touch devices.

## Comments

- 2026-11-04: implemented on the integration branch `love-gallery-v1`, reviewed with /code-review, and the review findings fixed.
