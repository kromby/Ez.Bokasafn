# My-branch picker — design

**Date:** 2026-05-15
**Status:** Approved (brainstorming)
**Scope:** `apps/web` (SvelteKit SPA only — no backend changes)

## Problem

The current scope picker (`LibraryScopePicker`) toggles the upstream `scope` query
param between `10000_MYLIB` (label "Allar bókasöfn") and `CONSORTIUM` (label
"Stærsta safnið"). The distinction is rarely useful — `10000_MYLIB` already
returns the full consortium. The picker takes up prime header real estate
without delivering value.

What users actually want is the inverse: tell the app **which library is mine**,
then surface that library's availability prominently on the book page so I can
decide whether to walk over.

## Goals

1. Drop the scope toggle; always query upstream with `scope=10000_MYLIB`.
2. Add a "my branch" picker — single physical branch — persisted across sessions.
3. On the book page, pin the user's branch above the existing branch table when
   the book is held there.

## Non-goals

- No backend changes. No new `/api/branches` endpoint.
- No fuzzy matching, multi-branch selection, or library-level grouping.
- No migration of the old `lastScope` localStorage key.
- No change to search ranking, suggest, or anything outside the book page's
  rendering and the header picker.

## Architecture

### Data

- **`Branch`** — a single physical library location, represented as the exact
  string returned in `BranchAvailability.branch` from `/api/book/:mmsId`
  (e.g. `"Borgarbókasafn — Sólheimar"`). Strings must match byte-for-byte;
  the book screen uses `branch === $myBranch` to pin a row.
- **`BRANCHES`** — hardcoded array of canonical branch strings, sorted
  alphabetically (Icelandic locale collation), exported from
  `apps/web/src/lib/branches.ts`. Sourced once via a one-time discovery step:
  call `/api/book/<known-widespread-mmsId>` against prod, extract the unique
  `branch` values, paste them in. See "Implementation notes" below.

### State

- New writable store `myBranch` in `apps/web/src/lib/stores.ts`, value is
  `string | undefined`.
- Persisted under localStorage key `"myBranch"`.
- Setter `setMyBranch(name: string | undefined)` — passing `undefined` clears
  the selection (removes the key).
- The existing `libraryScope` store and its `lastScope` localStorage key are
  removed from the codebase. Stale `lastScope` entries in users' browsers are
  left in place; they're ignored.

### Components

| Component | Change |
| --- | --- |
| `LibraryScopePicker.svelte` | Renamed to `MyBranchPicker.svelte`. Same bottom-sheet shape. Iterates over `BRANCHES`. Trigger pill shows selected branch or `"Veldu safn"`. Sheet header says `"Veldu þitt safn"`. |
| `SearchHeader.svelte` | `<LibraryScopePicker />` → `<MyBranchPicker />`. No other changes. |
| `routes/+page.svelte` (home) | Same swap. Drop `libraryScope` import and any reactive scope read. |
| `routes/search/+page.svelte` | Drop `libraryScope`, `setLibraryScope`, `LIBRARY_SCOPES`, the `lib`/`libParam` URL plumbing, and the `&lib=…` part of the `didYouMean` link. Always pass the literal `'10000_MYLIB'` to `apiSuggest` / `apiSearch`. |
| `routes/book/[mmsId]/+page.svelte` | Drop `libraryScope`. Pass `'10000_MYLIB'` to `apiBook`. Partition `data.branches` into `pinned` (exact match against `$myBranch`, if any) and `others` (everything else, original order preserved). |
| `BranchTable.svelte` | Add optional `pinned?: BranchAvailability` prop. When set, render a "Þitt safn" card above the table; the table below shows only `branches` (the unpinned ones) and its count reads `"{N} söfn"` accordingly. When unset, render exactly as today. |
| `scopes.ts` | Deleted. |
| `LibraryScopePicker.test.ts` | Replaced by `MyBranchPicker.test.ts`. |

### Visual treatment

The pinned card uses the same card chrome as the branch table (border, radius,
spacing) but is rendered as a single block with a `"Þitt safn"` eyebrow label,
then branch name, status (`Á hillu` / `Í útláni`), call number if present, and
due date if on loan. The branch table below keeps its existing header
(`"Staða eftir safni"`) and shows the remaining branches.

When `myBranch` is unset, or set to a value not present in this book's
`branches`, no pinned card renders. The branch table is unchanged.

## Data flow

```
localStorage  ── readInitial() ──▶  myBranch store
                                         │
                                         ▼
        MyBranchPicker  ◀──── reads/writes ────▶  setMyBranch()
                                         │
                                         ▼
        /book/[mmsId]/+page.svelte  reads $myBranch
                                         │
                                         ▼
              partition data.branches → { pinned, others }
                                         │
                                         ▼
              <BranchTable pinned={pinned} branches={others} />
```

## Edge cases

| Case | Behavior |
| --- | --- |
| First visit, no branch picked | Picker shows `"Veldu safn"`. Book page renders branch table unchanged. |
| `myBranch` set, book not held at that branch | No pinned card; branch table unchanged. No error/empty state. |
| `myBranch` value not present in current `BRANCHES` list (stale value after we update the hardcoded list) | The stored string is the source of truth for both the picker label and the matching. Picker shows the stored string in the trigger pill; opening the sheet still offers the current `BRANCHES`. The book page matches on the stored string, so an old-form value keeps working as long as upstream still uses it. |
| Old `lastScope` localStorage entry | Ignored. No read or migration. |
| `BRANCHES` list out of date with upstream | Picker shows the known set; books may surface unrecognized branch strings in their tables, but nothing breaks. We refresh `BRANCHES` manually when the gap is noticed. |

## Tests

- `MyBranchPicker.test.ts`
  - Renders `"Veldu safn"` placeholder when store is empty.
  - Renders the stored branch name in the trigger pill when set.
  - Selecting a branch from the sheet updates the store and closes the sheet.
  - Selecting persists to localStorage under key `"myBranch"`.
- `BranchTable.test.ts` (new)
  - With `pinned` set, renders the pinned card and excludes that branch from the table; count reflects the remaining count.
  - Without `pinned`, renders identically to current behavior.
- Update or remove any existing tests that import `libraryScope` /
  `LIBRARY_SCOPES`. Search and book page tests stop asserting on scope-switching
  behavior.

## Analytics

- If a `library_scope_changed` event currently exists in `analytics.ts`,
  rename to `my_branch_changed` with payload `{ fromBranch, toBranch }`.
  If it doesn't exist, no change.
- No new events for this feature.

## Implementation notes (out of scope for this spec, but worth flagging)

- **Populating `BRANCHES`**: before merge, run a one-off discovery against
  prod. Suggested mmsId candidates: widely-held titles such as
  "Hringadróttinssaga", "Brennu-Njáls saga", or a top-circulating new release.
  Extract the unique `branch` strings from `/api/book/<mmsId>`'s response,
  sort with `Intl.Collator('is')`, paste into `branches.ts`.
- The `apiBook` signature already accepts a `_scope` arg it ignores. Leave the
  signature alone for now; remove the param in a follow-up if desired.

## Open questions

None at design time.
