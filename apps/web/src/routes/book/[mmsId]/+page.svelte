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

  {#if pinned || others.length > 0}
    <BranchTable branches={others} {pinned} />
    <div style="height:36px"></div>
  {/if}
{:else}
  <div style="padding:60px 24px;text-align:center;color:var(--ink-3);" role="status" aria-live="polite">Sækir bók…</div>
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
