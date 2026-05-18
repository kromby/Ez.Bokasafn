---
title: Search Pagination — Load More
date: 2026-05-18
status: approved
---

## Overview

Add "load more" pagination to the search results page in Ez.Bokasafn. The backend (`Ez.Leitir`) already supports `offset` and returns `total` in every search response. The frontend currently ignores both; this spec adds the UI to use them.

Page size is 20 (hardcoded in `Ez.Leitir/Services/LeitirClient.cs`).

## State model

Replace the single `result: SearchResponse | null` state in `apps/web/src/routes/search/+page.svelte` with:

| Variable | Type | Initial value | Purpose |
|---|---|---|---|
| `available` | `Book[]` | `[]` | Accumulated available books across all loaded pages |
| `onLoan` | `Book[]` | `[]` | Accumulated on-loan books across all loaded pages |
| `total` | `number` | `0` | Total result count from the API (set on first fetch) |
| `didYouMean` | `string \| null` | `null` | Spelling suggestion from the API |
| `offset` | `number` | `0` | Next page start; incremented by 20 after each successful fetch |
| `loading` | `boolean` | `false` | True during the initial / query-change fetch |
| `loadingMore` | `boolean` | `false` | True during a load-more fetch |
| `error` | `string \| null` | `null` | User-facing error message (unchanged from today) |

## Fetch behaviour

**On `q` change** (the existing `$effect`):
1. Reset all state to initial values.
2. Set `loading = true`.
3. Fetch `apiSearch(q, scope, 0, signal)`.
4. On success: populate `available`, `onLoan`, `total`, `didYouMean`; set `offset = 20`.
5. On error / abort: same handling as today.
6. `finally`: `loading = false`.

**On "Load more" click**:
1. Set `loadingMore = true`.
2. Fetch `apiSearch(q, scope, offset, signal)` (same abort controller).
3. On success: append new books to `available` and `onLoan`; increment `offset` by 20.
4. On error: set `error`.
5. `finally`: `loadingMore = false`.

The existing abort controller covers both paths. If `q` changes while a load-more request is in flight, the request is cancelled and state resets cleanly.

## UI changes

All changes are in `apps/web/src/routes/search/+page.svelte`. No new components.

- `<SearchHeader>`: wire `total` prop to the new `total` state (was `result?.total`).
- `<AvailabilitySection>`: wire `books` props to `available` and `onLoan` (were `result.available` / `result.onLoan`).
- Empty-state check: `total === 0 && !loading` (was `result.total === 0`). The `didYouMean` link inside the zero-results block uses the new `didYouMean` state (was `result.didYouMean`).
- Add a "Load more" button below the two sections:
  - Visible when `available.length + onLoan.length < total && !loading`.
  - Label: **"Sýna fleiri"** normally, **"Hleð…"** while `loadingMore`.
  - Disabled while `loadingMore`.
  - Styled as a text button with inline style consistent with the page (not `iconbtn`, which is a circular icon button).

## Out of scope

- URL-param offset tracking (offset is not reflected in the URL).
- Back-navigation state preservation.
- Changes to `Ez.Leitir` (backend is already complete).
- Changes to `AvailabilitySection`, `SearchHeader`, or shared types.
