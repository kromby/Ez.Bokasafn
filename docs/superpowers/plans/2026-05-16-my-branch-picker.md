# My-Branch Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `LibraryScopePicker` with a single-physical-branch "my branch" picker, persist the choice across sessions, and pin the user's branch above the branch table on the book page when held there.

**Architecture:** SvelteKit SPA-only change in `apps/web`. A new writable Svelte store (`myBranch: string | undefined`) replaces the existing `libraryScope` store and writes to localStorage key `"myBranch"`. A new `MyBranchPicker.svelte` reads from a hardcoded `BRANCHES` array (`apps/web/src/lib/branches.ts`). The book page partitions `data.branches` against `$myBranch` and passes the matched row to `BranchTable` as a new optional `pinned` prop, which renders it as a card above the table. The search page and home page stop reading any scope and always pass the literal `'10000_MYLIB'` to the API. No backend changes.

**Tech Stack:** SvelteKit 2 (SPA), Svelte 5 runes, TypeScript, Vitest + @testing-library/svelte, jsdom.

**Reference docs:** [`docs/superpowers/specs/2026-05-15-my-branch-picker-design.md`](../specs/2026-05-15-my-branch-picker-design.md)

---

## File Structure

**Create:**
- `apps/web/src/lib/branches.ts` — hardcoded canonical branch strings (alphabetical, Icelandic collation).
- `apps/web/src/lib/components/MyBranchPicker.svelte` — bottom-sheet picker for choosing the user's branch.
- `apps/web/tests/unit/components/MyBranchPicker.test.ts` — picker tests.
- `apps/web/tests/unit/components/BranchTable.test.ts` — table tests covering `pinned`.

**Modify:**
- `apps/web/src/lib/stores.ts` — drop `libraryScope`/`setLibraryScope`; add `myBranch`/`setMyBranch`.
- `apps/web/src/lib/components/BranchTable.svelte` — add optional `pinned` prop; render pinned card and adjust counts.
- `apps/web/src/lib/components/SearchHeader.svelte` — swap `LibraryScopePicker` for `MyBranchPicker`.
- `apps/web/src/routes/+page.svelte` — swap picker, drop `libraryScope` and `&lib=` URL plumbing.
- `apps/web/src/routes/search/+page.svelte` — drop all scope plumbing; always use `'10000_MYLIB'`.
- `apps/web/src/routes/book/[mmsId]/+page.svelte` — drop `libraryScope`; partition branches by `$myBranch`.
- `apps/web/tests/unit/stores.test.ts` — replace `libraryScope` tests with `myBranch` tests.

**Delete:**
- `apps/web/src/lib/scopes.ts`
- `apps/web/src/lib/components/LibraryScopePicker.svelte`
- `apps/web/tests/unit/components/LibraryScopePicker.test.ts`

---

## Pre-flight

- [ ] **Confirm baseline is green**

Run: `cd apps/web && pnpm test`
Expected: all existing tests pass (this is the baseline we will diverge from in Task 1).

If any tests already fail at baseline, stop and surface that to the user before continuing — fixing pre-existing failures is out of scope.

- [ ] **Confirm there is no `library_scope_changed` analytics event to rename**

Run: `cd apps/web && grep -rn "library_scope_changed" src`
Expected: no matches.

The spec calls for renaming `library_scope_changed` → `my_branch_changed` *only if it currently exists*. At plan-writing time it did not. If your grep now turns up a match, add a small task to rename it (payload `{ fromBranch, toBranch }`) and update call sites; otherwise no analytics change is needed.

---

### Task 1: Add the `BRANCHES` list

**Files:**
- Create: `apps/web/src/lib/branches.ts`

The list is the source of truth the picker iterates over. The string values are used to match upstream `BranchAvailability.branch` byte-for-byte in Task 6. Use the seed list below; flag a discovery refresh against prod before merge (see "Post-merge / discovery follow-up" at the bottom of this plan).

- [ ] **Step 1: Create the file**

Write `apps/web/src/lib/branches.ts`:

```ts
/**
 * Canonical branch names. Must match upstream `BranchAvailability.branch`
 * byte-for-byte. Sorted alphabetically with `Intl.Collator('is')`.
 *
 * Refresh procedure: see docs/superpowers/specs/2026-05-15-my-branch-picker-design.md
 * ("Implementation notes / Populating BRANCHES"). One-off prod discovery
 * against a widely-held mmsId, then `Intl.Collator('is')` sort.
 */
export const BRANCHES: readonly string[] = [
  'Borgarbókasafn — Árbær',
  'Borgarbókasafn — Gerðuberg',
  'Borgarbókasafn — Grófin',
  'Borgarbókasafn — Kringlan',
  'Borgarbókasafn — Sólheimar',
  'Borgarbókasafn — Spöngin',
  'Bókasafn Garðabæjar',
  'Bókasafn Hafnarfjarðar',
  'Bókasafn Kópavogs',
  'Bókasafn Mosfellsbæjar',
  'Bókasafn Seltjarnarness',
];
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/web && pnpm typecheck`
Expected: no new errors. (Pre-existing errors, if any, must not be from this file.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/branches.ts
git commit -m "feat(web): add hardcoded BRANCHES list"
```

---

### Task 2: Replace `libraryScope` with `myBranch` in the store

**Files:**
- Modify: `apps/web/src/lib/stores.ts` (full rewrite)
- Modify: `apps/web/tests/unit/stores.test.ts` (full rewrite)

The existing `libraryScope` store and `lastScope` key are deleted entirely. There is no migration — stale `lastScope` entries in users' browsers are ignored.

- [ ] **Step 1: Write the new failing tests**

Replace the entire contents of `apps/web/tests/unit/stores.test.ts` with:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { myBranch, setMyBranch } from '../../src/lib/stores.js';

describe('myBranch store', () => {
  beforeEach(() => {
    localStorage.clear();
    setMyBranch(undefined);
  });

  it('defaults to undefined when no LocalStorage value is set', () => {
    expect(get(myBranch)).toBeUndefined();
  });

  it('persists a set value to LocalStorage under the "myBranch" key', () => {
    setMyBranch('Borgarbókasafn — Sólheimar');
    expect(get(myBranch)).toBe('Borgarbókasafn — Sólheimar');
    expect(localStorage.getItem('myBranch')).toBe('Borgarbókasafn — Sólheimar');
  });

  it('clears the store and removes the LocalStorage key when set to undefined', () => {
    setMyBranch('Borgarbókasafn — Sólheimar');
    setMyBranch(undefined);
    expect(get(myBranch)).toBeUndefined();
    expect(localStorage.getItem('myBranch')).toBeNull();
  });

  it('rehydrates from LocalStorage on module load', async () => {
    localStorage.setItem('myBranch', 'Bókasafn Kópavogs');
    vi.resetModules();
    const fresh = await import('../../src/lib/stores.js');
    expect(get(fresh.myBranch)).toBe('Bókasafn Kópavogs');
  });

  it('ignores any leftover lastScope key (no migration)', async () => {
    localStorage.setItem('lastScope', JSON.stringify({ code: '10000_KOP', label: 'Bókasafn Kópavogs' }));
    vi.resetModules();
    const fresh = await import('../../src/lib/stores.js');
    expect(get(fresh.myBranch)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the tests; verify they fail**

Run: `cd apps/web && pnpm test tests/unit/stores.test.ts`
Expected: FAIL — the new test imports `myBranch` / `setMyBranch` which do not yet exist.

- [ ] **Step 3: Rewrite the store**

Replace the entire contents of `apps/web/src/lib/stores.ts` with:

```ts
import { writable } from 'svelte/store';

const KEY = 'myBranch';

function readInitial(): string | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  const raw = localStorage.getItem(KEY);
  return raw ?? undefined;
}

export const myBranch = writable<string | undefined>(readInitial());

export function setMyBranch(name: string | undefined): void {
  myBranch.set(name);
  if (typeof localStorage === 'undefined') return;
  if (name === undefined) {
    localStorage.removeItem(KEY);
  } else {
    localStorage.setItem(KEY, name);
  }
}
```

- [ ] **Step 4: Run the tests; verify they pass**

Run: `cd apps/web && pnpm test tests/unit/stores.test.ts`
Expected: PASS (all five `myBranch` tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/stores.ts apps/web/tests/unit/stores.test.ts
git commit -m "feat(web): replace libraryScope store with myBranch"
```

Note: app-wide build is still broken because `LibraryScopePicker` and several routes still import the old store. Tasks 3–8 repair the callers; Task 9 verifies the whole app builds cleanly again.

---

### Task 3: Create `MyBranchPicker.svelte`

**Files:**
- Create: `apps/web/src/lib/components/MyBranchPicker.svelte`
- Create: `apps/web/tests/unit/components/MyBranchPicker.test.ts`

Same bottom-sheet shape, focus management, and `.scope` trigger class as `LibraryScopePicker` (so the existing CSS in `app.css` still applies). Iterates `BRANCHES`. Trigger pill shows the stored branch name or `"Veldu safn"`. Sheet header says `"Veldu þitt safn"`.

- [ ] **Step 1: Write the failing tests**

Write `apps/web/tests/unit/components/MyBranchPicker.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { myBranch, setMyBranch } from '../../../src/lib/stores.js';
import { BRANCHES } from '../../../src/lib/branches.js';
import MyBranchPicker from '../../../src/lib/components/MyBranchPicker.svelte';

describe('<MyBranchPicker>', () => {
  beforeEach(() => {
    localStorage.clear();
    setMyBranch(undefined);
  });

  it('renders the "Veldu safn" placeholder when the store is empty', () => {
    const { container } = render(MyBranchPicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    expect(trigger.textContent).toContain('Veldu safn');
  });

  it('renders the stored branch name in the trigger when set', () => {
    setMyBranch('Borgarbókasafn — Sólheimar');
    const { container } = render(MyBranchPicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    expect(trigger.textContent).toContain('Borgarbókasafn — Sólheimar');
  });

  it('opens a sheet listing every branch in BRANCHES when the trigger is clicked', async () => {
    const { container, getByText } = render(MyBranchPicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    for (const name of BRANCHES) {
      expect(getByText(name)).toBeTruthy();
    }
  });

  it('selecting a branch updates the store, persists to localStorage, and closes the sheet', async () => {
    const { container, getByText } = render(MyBranchPicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    await fireEvent.click(trigger);

    const choice = getByText('Bókasafn Kópavogs');
    await fireEvent.click(choice);

    expect(get(myBranch)).toBe('Bókasafn Kópavogs');
    expect(localStorage.getItem('myBranch')).toBe('Bókasafn Kópavogs');
    expect(container.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('closes the sheet when Escape is pressed', async () => {
    const { container } = render(MyBranchPicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    await fireEvent.click(trigger);
    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    await fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(container.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('marks the currently-selected branch with aria-current="true"', async () => {
    setMyBranch('Bókasafn Kópavogs');
    const { container, getByText } = render(MyBranchPicker);
    const trigger = container.querySelector('.scope') as HTMLElement;
    await fireEvent.click(trigger);
    expect(getByText('Bókasafn Kópavogs').getAttribute('aria-current')).toBe('true');
    expect(getByText('Bókasafn Hafnarfjarðar').getAttribute('aria-current')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests; verify they fail**

Run: `cd apps/web && pnpm test tests/unit/components/MyBranchPicker.test.ts`
Expected: FAIL — `MyBranchPicker.svelte` does not exist.

- [ ] **Step 3: Implement the component**

Write `apps/web/src/lib/components/MyBranchPicker.svelte`:

```svelte
<script lang="ts">
  import { myBranch, setMyBranch } from '$lib/stores';
  import { BRANCHES } from '$lib/branches';

  let open = $state(false);
  const selected = $derived($myBranch);

  function pick(name: string) {
    setMyBranch(name);
    open = false;
  }

  function openDialog() {
    open = true;
    setTimeout(() => {
      document.querySelector('[role="dialog"]')?.focus();
    }, 0);
  }

  function closeDialog() {
    open = false;
    setTimeout(() => {
      (document.querySelector('.scope') as HTMLElement | null)?.focus();
    }, 0);
  }
</script>

<button class="scope" onclick={openDialog} aria-haspopup="dialog" aria-expanded={open}>
  <span class="scope-dot"></span>
  <span>{selected ?? 'Veldu safn'}</span>
  <svg class="scope-caret" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</button>

{#if open}
  <div
    role="dialog"
    aria-label="Veldu þitt safn"
    aria-modal="true"
    tabindex="-1"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:50;display:flex;align-items:flex-end;"
    onclick={closeDialog}
    onkeydown={(e) => e.key === 'Escape' && closeDialog()}
  >
    <div
      style="background:var(--bg);width:100%;border-radius:18px 18px 0 0;padding:18px 16px 28px;"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div style="font-size:13px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin-bottom:10px;">Veldu þitt safn</div>
      {#each BRANCHES as name (name)}
        <button
          style="display:block;width:100%;text-align:left;padding:14px 8px;border-bottom:1px solid var(--hairline);font-size:15px;"
          onclick={() => pick(name)}
          aria-current={selected === name ? 'true' : undefined}
        >
          {name}
        </button>
      {/each}
    </div>
  </div>
{/if}
```

- [ ] **Step 4: Run the tests; verify they pass**

Run: `cd apps/web && pnpm test tests/unit/components/MyBranchPicker.test.ts`
Expected: PASS (all six tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/components/MyBranchPicker.svelte apps/web/tests/unit/components/MyBranchPicker.test.ts
git commit -m "feat(web): add MyBranchPicker component"
```

---

### Task 4: Add `pinned` support to `BranchTable.svelte`

**Files:**
- Modify: `apps/web/src/lib/components/BranchTable.svelte`
- Create: `apps/web/tests/unit/components/BranchTable.test.ts`

Add an optional `pinned?: BranchAvailability` prop. When set, render a `"Þitt safn"` eyebrow card above the table; the table below shows only `branches` (which the caller has already filtered) and its count reads `"{N} söfn · {M} á hillunni"` using the remaining rows. When unset, render exactly as today.

- [ ] **Step 1: Write the failing tests**

Write `apps/web/tests/unit/components/BranchTable.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import type { BranchAvailability } from '@ez-bokasafn/types';
import BranchTable from '../../../src/lib/components/BranchTable.svelte';

const others: BranchAvailability[] = [
  { branch: 'Bókasafn Kópavogs', status: 'on-shelf', callNumber: '839.6 K' },
  { branch: 'Borgarbókasafn — Grófin', status: 'on-loan', earliestReturn: '2026-06-01' },
];

describe('<BranchTable>', () => {
  it('renders just the table when `pinned` is not provided', () => {
    const { container, queryByText } = render(BranchTable, { branches: others });
    expect(queryByText('Þitt safn')).toBeNull();
    expect(container.querySelector('.branch-table-head')?.textContent).toContain('2 söfn');
    expect(container.querySelector('.branch-table-head')?.textContent).toContain('1 á hillunni');
  });

  it('renders the pinned card above the table when `pinned` is provided', () => {
    const pinned: BranchAvailability = { branch: 'Borgarbókasafn — Sólheimar', status: 'on-shelf', callNumber: '839.6 H' };
    const { container, getByText } = render(BranchTable, { branches: others, pinned });

    expect(getByText('Þitt safn')).toBeTruthy();
    expect(getByText('Borgarbókasafn — Sólheimar')).toBeTruthy();
    expect(getByText('839.6 H')).toBeTruthy();

    expect(container.querySelector('.branch-table-head')?.textContent).toContain('2 söfn');
  });

  it('renders the pinned branch as "Í útláni" with a due date when on loan', () => {
    const pinned: BranchAvailability = { branch: 'Borgarbókasafn — Sólheimar', status: 'on-loan', earliestReturn: '2026-06-15' };
    const { getByText } = render(BranchTable, { branches: others, pinned });
    expect(getByText('Í útláni')).toBeTruthy();
    expect(getByText('Skilað 2026-06-15')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the tests; verify they fail**

Run: `cd apps/web && pnpm test tests/unit/components/BranchTable.test.ts`
Expected: FAIL — pinned card doesn't exist yet; the test that asserts `Þitt safn` is rendered will fail.

- [ ] **Step 3: Update the component**

Replace the contents of `apps/web/src/lib/components/BranchTable.svelte` with:

```svelte
<script lang="ts">
  import type { BranchAvailability } from '@ez-bokasafn/types';
  let { branches, pinned }: { branches: BranchAvailability[]; pinned?: BranchAvailability } = $props();
  const onShelf = $derived(branches.filter((b) => b.status === 'on-shelf').length);
</script>

{#if pinned}
  <div class="pinned-card">
    <div class="pinned-eyebrow">Þitt safn</div>
    <div class="pinned-row">
      <div>
        <div class="branch-name">{pinned.branch}</div>
        {#if pinned.callNumber}<div class="branch-call">{pinned.callNumber}</div>{/if}
      </div>
      <div class={`branch-status ${pinned.status === 'on-shelf' ? 'avail' : 'loan'}`}>
        {pinned.status === 'on-shelf' ? 'Á hillu' : 'Í útláni'}
        {#if pinned.status === 'on-loan' && pinned.earliestReturn}
          <span class="due">Skilað {pinned.earliestReturn}</span>
        {/if}
      </div>
    </div>
  </div>
{/if}

<div class="branch-table">
  <div class="branch-table-head">
    <span>Staða eftir safni</span>
    <span class="count">{branches.length} söfn · {onShelf} á hillunni</span>
  </div>
  {#each branches as b (b.branch)}
    <div class="branch-row">
      <div>
        <div class="branch-name">{b.branch}</div>
        {#if b.callNumber}<div class="branch-call">{b.callNumber}</div>{/if}
      </div>
      <div class={`branch-status ${b.status === 'on-shelf' ? 'avail' : 'loan'}`}>
        {b.status === 'on-shelf' ? 'Á hillu' : 'Í útláni'}
        {#if b.status === 'on-loan' && b.earliestReturn}
          <span class="due">Skilað {b.earliestReturn}</span>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .pinned-card {
    margin: 24px 16px 0;
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 16px;
    background-color: var(--bg-2);
  }

  .pinned-eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
    color: var(--ink-3);
    margin-bottom: 8px;
  }

  .pinned-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .branch-table {
    margin: 32px 16px;
    border: 1px solid var(--border-light);
    border-radius: 12px;
    overflow: hidden;
  }

  .branch-table-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background-color: var(--bg-2);
    border-bottom: 1px solid var(--border-light);
    font-weight: 500;
    font-size: 14px;
  }

  .count {
    font-size: 13px;
    color: var(--ink-3);
    font-weight: normal;
  }

  .branch-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--border-light);
  }

  .branch-row:last-child {
    border-bottom: none;
  }

  .branch-name {
    font-weight: 500;
    font-size: 15px;
    color: var(--ink);
  }

  .branch-call {
    font-size: 13px;
    color: var(--ink-3);
    margin-top: 2px;
  }

  .branch-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 14px;
    font-weight: 500;
  }

  .branch-status.avail {
    color: var(--avail);
  }

  .branch-status.loan {
    color: var(--loan);
  }

  .due {
    font-size: 12px;
    font-weight: normal;
    margin-top: 2px;
  }
</style>
```

- [ ] **Step 4: Run the tests; verify they pass**

Run: `cd apps/web && pnpm test tests/unit/components/BranchTable.test.ts`
Expected: PASS (all three tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/components/BranchTable.svelte apps/web/tests/unit/components/BranchTable.test.ts
git commit -m "feat(web): support pinned branch card in BranchTable"
```

---

### Task 5: Swap the picker in `SearchHeader` and the home page

**Files:**
- Modify: `apps/web/src/lib/components/SearchHeader.svelte`
- Modify: `apps/web/src/routes/+page.svelte`

The home page currently builds a `&lib=` URL param from `$libraryScope`. Per the spec we always pass `'10000_MYLIB'` to the API, and there is no longer any per-search scope to carry in the URL — drop the param entirely.

- [ ] **Step 1: Update `SearchHeader.svelte`**

Replace the contents of `apps/web/src/lib/components/SearchHeader.svelte` with:

```svelte
<script lang="ts">
  import MyBranchPicker from './MyBranchPicker.svelte';

  let { value, total } = $props();
</script>

<div class="head">
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <MyBranchPicker />
    {#if typeof total === 'number'}
      <span style="font-size:12px;color:var(--ink-3);font-variant-numeric:tabular-nums;">{total} niðurstöður</span>
    {/if}
  </div>
  <div class="search">
    <svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" />
      <path d="M14 14L17.5 17.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </svg>
    <input type="search" {value} readonly />
  </div>
</div>
```

- [ ] **Step 2: Update `routes/+page.svelte`**

Replace the contents of `apps/web/src/routes/+page.svelte` with:

```svelte
<script>
  import { goto } from '$app/navigation';
  import MyBranchPicker from '$lib/components/MyBranchPicker.svelte';

  let q = '';

  function submit(e) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    goto(`/search?q=${encodeURIComponent(trimmed)}`);
  }
</script>

<svelte:head><title>Finna bók</title></svelte:head>

<div class="home" style="display:flex;flex-direction:column;min-height:100dvh;padding:0 24px;">
  <div style="padding-top:12px;display:flex;justify-content:flex-start;">
    <MyBranchPicker />
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px;padding-bottom:60px;">
    <div>
      <h1 class="wordmark">
        <span class="l1">Finna</span>
        <span class="l2"><span class="underline">bók</span></span>
      </h1>
      <p class="tagline">Á hvaða safni er hún til, og er hún á hillunni núna?</p>
    </div>

    <form onsubmit={submit}>
      <label class="search">
        <svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" />
          <path d="M14 14L17.5 17.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <input
          type="search"
          placeholder="Leita að bók, höfundi…"
          bind:value={q}
          autocomplete="off"
          enterkeyhint="search"
        />
      </label>
    </form>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/components/SearchHeader.svelte apps/web/src/routes/+page.svelte
git commit -m "feat(web): swap MyBranchPicker into header and home page"
```

---

### Task 6: Strip scope plumbing from the search page

**Files:**
- Modify: `apps/web/src/routes/search/+page.svelte`

Always pass the literal `'10000_MYLIB'` to `apiSearch`. Drop the `lib`/`libParam` URL handling and the `&lib=` from the `didYouMean` link. No URL rewriting on first render.

- [ ] **Step 1: Update the page**

Replace the contents of `apps/web/src/routes/search/+page.svelte` with:

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';
  import { apiSearch, ApiError } from '$lib/api';
  import type { SearchResponse } from '@ez-bokasafn/types';
  import SearchHeader from '$lib/components/SearchHeader.svelte';
  import AvailabilitySection from '$lib/components/AvailabilitySection.svelte';

  let result = $state<SearchResponse | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(false);
  let controller = undefined as AbortController | undefined;

  $effect(() => {
    const q = $page.url.searchParams.get('q') ?? '';
    if (!q) return;

    controller?.abort();
    controller = new AbortController();
    loading = true;
    error = null;
    result = null;

    apiSearch(q, '10000_MYLIB', 0, controller.signal)
      .then((r) => (result = r))
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return;
        error = e instanceof ApiError && e.status === 502 ? 'Eitthvað fór úrskeiðis. Reyndu aftur.' : (e instanceof Error ? e.message : 'An unexpected error occurred');
      })
      .finally(() => (loading = false));
  });

  onDestroy(() => controller?.abort());

  const q = $derived($page.url.searchParams.get('q') ?? '');
</script>

<svelte:head><title>{q} — Finna bók</title></svelte:head>

<SearchHeader value={q} total={result?.total} />

{#if loading}
  <div style="padding:18px 20px;color:var(--ink-3);font-size:13px;">Leita…</div>
{:else if error}
  <div style="padding:24px 20px;">
    <p style="font-family:var(--serif);font-size:18px;">{error}</p>
    <button class="iconbtn" style="margin-top:16px;" onclick={() => location.reload()}>Reyna aftur</button>
  </div>
{:else if result}
  {#if result.total === 0}
    <div style="padding:24px 20px;">
      <p style="font-family:var(--serif);font-size:18px;">Engin niðurstaða fyrir „{q}".</p>
      {#if result.didYouMean}
        <a href={`/search?q=${encodeURIComponent(result.didYouMean)}`} style="color:var(--avail);font-size:15px;">
          Áttirðu við „{result.didYouMean}"?
        </a>
      {/if}
    </div>
  {:else}
    <AvailabilitySection books={result.available} kind="avail" />
    <AvailabilitySection books={result.onLoan} kind="loan" />
    <div style="height:24px"></div>
  {/if}
{/if}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/search/+page.svelte
git commit -m "feat(web): drop scope plumbing from search page"
```

---

### Task 7: Partition branches on the book page

**Files:**
- Modify: `apps/web/src/routes/book/[mmsId]/+page.svelte`

Drop `libraryScope`. Pass `'10000_MYLIB'` to `apiBook` (its `_scope` arg is already unused upstream — leaving the call site call-compatible per the spec's implementation note). Partition `data.branches` into `pinned` (the first row whose `branch === $myBranch`, if any) and `others` (everything else, original order preserved). Pass both to `BranchTable`.

- [ ] **Step 1: Update the page**

Replace the contents of `apps/web/src/routes/book/[mmsId]/+page.svelte` with:

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { myBranch } from '$lib/stores';
  import { apiBook, ApiError } from '$lib/api';
  import type { BookResponse, BranchAvailability } from '@ez-bokasafn/types';
  import BookCover from '$lib/components/BookCover.svelte';
  import BranchTable from '$lib/components/BranchTable.svelte';
  import DetailAppBar from '$lib/components/DetailAppBar.svelte';

  let data = $state<BookResponse | null>(null);
  let error = $state<string | null>(null);

  $effect(() => {
    const mmsId = $page.params.mmsId;
    if (!mmsId) return;

    apiBook(mmsId, '10000_MYLIB')
      .then((r) => (data = r))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) error = 'Bókin fannst ekki';
        else error = (e instanceof Error ? e.message : 'An unexpected error occurred');
      });
  });

  const pinned = $derived<BranchAvailability | undefined>(
    data && $myBranch ? data.branches.find((b) => b.branch === $myBranch) : undefined,
  );
  const others = $derived<BranchAvailability[]>(
    data ? (pinned ? data.branches.filter((b) => b !== pinned) : data.branches) : [],
  );

  async function share() {
    if (!data) return;
    const url = location.href;
    const title = data.book.title;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.error('Share failed:', e);
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Slóð afrituð á klemmuspjald.');
    }
  }
</script>

<svelte:head><title>{data?.book.title ?? 'Finna bók'}</title></svelte:head>

<DetailAppBar onShare={share} />

{#if error}
  <div style="padding:60px 24px;text-align:center;">
    <p style="font-family:var(--serif);font-size:20px;">{error}</p>
    <a href="/" style="color:var(--avail);font-size:15px;">Til baka</a>
  </div>
{:else if data}
  <div class="hero">
    <div class="hero-bg" style="background:radial-gradient(ellipse at 50% 0%, oklch(0.32 0.04 200) 0%, transparent 70%);"></div>
    <div class="hero-content">
      <div style="height:32px"></div>
      <BookCover sources={data.book.coverSources} title={data.book.title} author={data.book.author} large />
      <div class="hero-meta" style="display:flex;flex-direction:column;gap:4px;align-items:center;">
        <h1 class="hero-title">{data.book.title}</h1>
        {#if data.book.author}
          <div class="hero-author">{data.book.author}</div>
        {/if}
        <div class="hero-facts">
          {#if data.book.year}<span>{data.book.year}</span>{/if}
          {#if data.book.pageCount}<span>{data.book.pageCount} bls.</span>{/if}
          {#if data.book.genres[0]}<span>{data.book.genres[0]}</span>{/if}
        </div>
      </div>
    </div>
  </div>

  {#if data.book.genres.length > 0}
    <div class="tags">
      {#each data.book.genres.slice(0, 4) as g}
        <span class="tag">{g}</span>
      {/each}
    </div>
  {/if}

  {#if data.book.summary}
    <p class="summary">{data.book.summary}</p>
  {/if}

  {#if data.branches.length > 0}
    <BranchTable branches={others} {pinned} />
    <div style="height:36px"></div>
  {/if}
{:else}
  <div style="padding:60px 24px;text-align:center;color:var(--ink-3);" role="status" aria-live="polite">Hleður…</div>
{/if}

<style>
  .hero {
    position: relative;
    padding: 0 24px 40px;
    text-align: center;
  }

  .hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    z-index: -1;
  }

  .hero-content {
    position: relative;
    z-index: 1;
  }

  .hero-title {
    font-family: var(--serif);
    font-size: 24px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--ink);
    margin: 24px 0 0;
  }

  .hero-author {
    font-size: 16px;
    color: var(--ink-2);
  }

  .hero-facts {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 8px;
    font-size: 13px;
    color: var(--ink-3);
  }

  .hero-facts span {
    display: inline-block;
  }

  .hero-facts span:not(:last-child)::after {
    content: '·';
    margin-left: 12px;
    color: var(--border-light);
  }

  .tags {
    display: flex;
    gap: 8px;
    margin: 24px 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .tag {
    display: inline-block;
    padding: 6px 12px;
    background-color: var(--bg-2);
    border: 1px solid var(--border-light);
    border-radius: 16px;
    font-size: 13px;
    color: var(--ink-2);
  }

  .summary {
    margin: 24px 16px;
    font-size: 15px;
    line-height: 1.6;
    color: var(--ink);
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/book/[mmsId]/+page.svelte
git commit -m "feat(web): pin user's branch on book page"
```

---

### Task 8: Delete obsolete scope files

**Files:**
- Delete: `apps/web/src/lib/scopes.ts`
- Delete: `apps/web/src/lib/components/LibraryScopePicker.svelte`
- Delete: `apps/web/tests/unit/components/LibraryScopePicker.test.ts`

All callers are now gone (modified in Tasks 5–7). The `LibraryScope` interface in `packages/types/src/index.ts` is left in place; it's a shared package and may still be referenced elsewhere (Azure Functions backend) — removing it is out of scope.

- [ ] **Step 1: Verify there are no remaining imports**

Run: `cd apps/web && grep -rn "libraryScope\|setLibraryScope\|LibraryScopePicker\|LIBRARY_SCOPES\|lastScope\|\$lib/scopes" src tests`
Expected: no matches.

If anything turns up, fix the caller before deleting — do not delete files while imports still reference them.

- [ ] **Step 2: Delete the files**

```bash
git rm apps/web/src/lib/scopes.ts \
       apps/web/src/lib/components/LibraryScopePicker.svelte \
       apps/web/tests/unit/components/LibraryScopePicker.test.ts
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(web): delete obsolete library-scope picker files"
```

---

### Task 9: Whole-app verification

- [ ] **Step 1: Typecheck**

Run: `cd apps/web && pnpm typecheck`
Expected: zero new errors. Pre-existing errors (if any) must match baseline from Pre-flight.

- [ ] **Step 2: Full test suite**

Run: `cd apps/web && pnpm test`
Expected: PASS — `stores.test.ts`, `api.test.ts`, `BookCover.test.ts`, `MyBranchPicker.test.ts`, `BranchTable.test.ts` all green. The deleted `LibraryScopePicker.test.ts` is gone, so the total file count drops by one and increases by two (net +1).

- [ ] **Step 3: Manual smoke (dev server)**

Run: `cd apps/web && pnpm dev`

In the browser, walk these flows:
1. Home → trigger pill says `"Veldu safn"`. Open it; pick `"Bókasafn Kópavogs"`. Pill updates. Reload the page → pill still says `"Bókasafn Kópavogs"`.
2. Search for a common title (e.g. "njála") → results render. URL has no `&lib=` param.
3. Open a book that is held at multiple branches → if Kópavogur appears in the list, a `"Þitt safn"` card is pinned above the table; the table below excludes Kópavogur and the count reflects the reduced number. If not held there, no card.
4. Open the picker, scroll to a branch that does NOT appear in this book's branches, select it, go back to the book → no pinned card, table unchanged.
5. DevTools → Application → Local Storage: confirm `myBranch` is set to the chosen name. Confirm `lastScope` (if present from prior testing) is untouched.

If any flow fails, stop and surface the failure — don't attempt to fix during the smoke. Note what failed and which task likely introduced it.

---

## Post-merge / discovery follow-up (NOT part of this plan)

The `BRANCHES` list in Task 1 is a seed. Before merge, the implementing engineer (or a follow-up task) should run a one-off prod discovery against a widely-held mmsId (e.g. Hringadróttinssaga, Brennu-Njáls saga, a top-circulating new release), collect the unique `BranchAvailability.branch` strings from `/api/book/<mmsId>`, sort them with `Intl.Collator('is')`, and replace the seed list. This is called out in the spec under "Implementation notes" and is explicitly out of scope for the spec — but the seed values must match what upstream actually returns, byte-for-byte, or the pinning in Task 7 will never fire in production.
