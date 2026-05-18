---
title: Search Results — Available / On Loan Tabs
date: 2026-05-18
status: approved
---

## Overview

Replace the two stacked "Á lausu" / "Í útláni" sections on the search results page with a tab UI. This eliminates the confusing dual-growing-list layout introduced by load-more pagination and focuses the user on one list at a time.

## State

One new state variable added to `apps/web/src/routes/search/+page.svelte`:

| Variable | Type | Initial value | Purpose |
|---|---|---|---|
| `activeTab` | `'avail' \| 'loan'` | `'avail'` | Which tab is currently shown |

All existing state (`available`, `onLoan`, `total`, `offset`, `loading`, `loadingMore`, `loaded`, `error`) is unchanged.

**Auto-switch:** After the initial fetch (`loaded` becomes `true`), if `available.length === 0` and `onLoan.length > 0`, set `activeTab = 'loan'` so the user is not left looking at an empty tab.

## UI

The two stacked `<AvailabilitySection>` calls are replaced with:

1. **Tab bar** — two buttons directly above the list:
   - "Á lausu (N)" where N is `available.length`
   - "Í útláni (N)" where N is `onLoan.length`
   - Counts are only shown after `loaded` is true.
   - The active tab is visually distinguished (e.g. `color: var(--avail)` or a bottom border).
   - Clicking a tab sets `activeTab`.

2. **Single section** — `{#if activeTab === 'avail'}` renders `<AvailabilitySection books={available} kind="avail" />`, otherwise `<AvailabilitySection books={onLoan} kind="loan" />`.

3. **"Sýna fleiri" button** — unchanged. Shown when `hasMore`, loads the next page into both `available` and `onLoan`. The inactive tab's count updates silently as pages load.

## Layout sketch

```
[ Á lausu (15) ]  [ Í útláni (8) ]
─────────────────────────────────
  ... active section rows ...
[ Sýna fleiri ]
```

## Out of scope

- Tab state in the URL.
- Load-more scoped to a single tab (one API call always populates both).
- Changes to `AvailabilitySection`, `SearchHeader`, shared types, or `Ez.Leitir`.
