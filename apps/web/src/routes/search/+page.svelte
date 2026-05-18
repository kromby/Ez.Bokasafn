<script lang="ts">
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';
  import { apiSearch, ApiError } from '$lib/api';
  import type { Book } from '@ez-bokasafn/types';
  import SearchHeader from '$lib/components/SearchHeader.svelte';
  import AvailabilitySection from '$lib/components/AvailabilitySection.svelte';

  let available = $state<Book[]>([]);
  let onLoan = $state<Book[]>([]);
  let total = $state(0);
  let didYouMean = $state<string | null>(null);
  let offset = $state(0);
  let loading = $state(false);
  let loadingMore = $state(false);
  let loaded = $state(false);
  let error = $state<string | null>(null);
  let controller = undefined as AbortController | undefined;

  $effect(() => {
    const q = $page.url.searchParams.get('q') ?? '';
    if (!q) return;

    controller?.abort();
    controller = new AbortController();
    available = [];
    onLoan = [];
    total = 0;
    didYouMean = null;
    offset = 0;
    loaded = false;
    loading = true;
    error = null;

    apiSearch(q, '10000_MYLIB', 0, controller.signal)
      .then((r) => {
        available = r.available;
        onLoan = r.onLoan;
        total = r.total;
        didYouMean = r.didYouMean ?? null;
        offset = 20;
        loaded = true;
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return;
        error = e instanceof ApiError && e.status === 502 ? 'Eitthvað fór úrskeiðis. Reyndu aftur.' : (e instanceof Error ? e.message : 'An unexpected error occurred');
      })
      .finally(() => (loading = false));
  });

  function loadMore() {
    const q = $page.url.searchParams.get('q') ?? '';
    if (!q || loadingMore) return;

    loadingMore = true;

    apiSearch(q, '10000_MYLIB', offset, controller?.signal)
      .then((r) => {
        available = [...available, ...r.available];
        onLoan = [...onLoan, ...r.onLoan];
        offset += 20;
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return;
        error = e instanceof ApiError && e.status === 502 ? 'Eitthvað fór úrskeiðis. Reyndu aftur.' : (e instanceof Error ? e.message : 'An unexpected error occurred');
      })
      .finally(() => (loadingMore = false));
  }

  onDestroy(() => controller?.abort());

  const q = $derived($page.url.searchParams.get('q') ?? '');
  const hasMore = $derived(available.length + onLoan.length < total && loaded);
</script>

<svelte:head><title>{q} — Finna bók</title></svelte:head>

<SearchHeader value={q} total={loaded ? total : undefined} />

{#if loading}
  <div style="padding:18px 20px;color:var(--ink-3);font-size:13px;">Leita…</div>
{:else if error}
  <div style="padding:24px 20px;">
    <p style="font-family:var(--serif);font-size:18px;">{error}</p>
    <button class="iconbtn" style="margin-top:16px;" onclick={() => location.reload()}>Reyna aftur</button>
  </div>
{:else if loaded}
  {#if total === 0}
    <div style="padding:24px 20px;">
      <p style="font-family:var(--serif);font-size:18px;">Engin niðurstaða fyrir „{q}".</p>
      {#if didYouMean}
        <a href={`/search?q=${encodeURIComponent(didYouMean)}`} style="color:var(--avail);font-size:15px;">
          Áttirðu við „{didYouMean}"?
        </a>
      {/if}
    </div>
  {:else}
    <AvailabilitySection books={available} kind="avail" />
    <AvailabilitySection books={onLoan} kind="loan" />
    {#if hasMore}
      <div style="padding:16px 20px;text-align:center;">
        <button
          onclick={loadMore}
          disabled={loadingMore}
          style="font-family:var(--serif);font-size:15px;color:var(--avail);background:none;border:none;cursor:pointer;padding:8px 16px;opacity:{loadingMore ? 0.5 : 1};"
        >
          {loadingMore ? 'Hleð…' : 'Sýna fleiri'}
        </button>
      </div>
    {/if}
    <div style="height:24px"></div>
  {/if}
{/if}
