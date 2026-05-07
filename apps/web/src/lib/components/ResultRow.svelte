<script>
  import type { Book } from '@ez-bokasafn/types';
  import BookCover from './BookCover.svelte';

  export let book, kind;

  const branchesShown = $derived(book.branchesOnShelf.slice(0, 3));
  const overflow = $derived(book.branchesOnShelf.length - branchesShown.length);
  const dueLabel = $derived(book.earliestReturn ? `Skilað í fyrsta lagi: ${book.earliestReturn}` : 'Í útláni');
</script>

<a href={`/book/${book.mmsId}`} class="row" style="color:inherit;">
  <BookCover sources={book.coverSources} title={book.title} author={book.author} />
  <div class="row-body">
    <div class="row-title">{book.title}</div>
    <div class="row-meta">
      {book.author ?? ''}
      {#if book.year}<span class="dot">·</span>{book.year}{/if}
    </div>
    <div class={`row-status ${kind}`}>
      {#if kind === 'avail'}
        {#each branchesShown as b}
          <span class="branch">{b}</span>
        {/each}
        {#if overflow > 0}
          <span class="branch">+{overflow}</span>
        {/if}
      {:else}
        {dueLabel}
      {/if}
    </div>
  </div>
</a>
