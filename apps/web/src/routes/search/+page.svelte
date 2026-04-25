<script lang="ts">
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';
  import { libraryScope, setLibraryScope } from '$lib/stores.js';
  import { LIBRARY_SCOPES } from '$lib/scopes.js';
  import { apiSearch, ApiError } from '$lib/api.js';
  import type { SearchResponse } from '@ez-bokasafn/types';
  import SearchHeader from '$lib/components/SearchHeader.svelte';
  import AvailabilitySection from '$lib/components/AvailabilitySection.svelte';

  let result = $state<SearchResponse | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(false);
  let controller: AbortController | undefined;

  $effect(() => {
    const q = $page.url.searchParams.get('q') ?? '';
    const lib = $page.url.searchParams.get('lib') ?? $libraryScope?.code;
    if (lib && lib !== $libraryScope?.code) {
      const found = LIBRARY_SCOPES.find((s) => s.code === lib);
      if (found) setLibraryScope(found);
    }
    if (!q || !lib) return;

    controller?.abort();
    controller = new AbortController();
    loading = true;
    error = null;
    result = null;

    apiSearch(q, lib, 0, controller.signal)
      .then((r) => (result = r))
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return;
        error = e instanceof ApiError && e.status === 502 ? 'Eitthvað fór úrskeiðis. Reyndu aftur.' : (e as Error).message;
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
        <a href={`/search?q=${encodeURIComponent(result.didYouMean)}&lib=${$libraryScope?.code ?? ''}`} style="color:var(--avail);font-size:15px;">
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
