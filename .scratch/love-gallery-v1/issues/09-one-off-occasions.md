# 09: One-off occasions

**What to build:** On a Memory's admin page, the Curator adds and removes One-off occasions, each a name and a day inside the Memory's Date range. They show with the same badges as Yearly occasions, sorted by day together with them. Changing a Memory's Date range so that a One-off occasion would fall outside it is refused with an Italian message. See spec, user stories 51–52.

**Blocked by:** 08

**Status:** done

- [x] Vitest: adding, removing, rejecting a day outside the Date range, and the Date range edit guard.
- [x] Badges are sorted by day with the Yearly occasions on cards and pages.

## Comments

- 2026-11-04: implemented on the integration branch `love-gallery-v1`, reviewed with /code-review, and the review findings fixed.
