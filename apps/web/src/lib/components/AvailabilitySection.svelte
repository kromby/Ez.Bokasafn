<script>
  import type { Book } from '@ez-bokasafn/types';
  import ResultRow from './ResultRow.svelte';

  export let books, kind;

  const labels = {
    avail: { head: 'Laus', pill: (n: number) => `${n} á hillunni` },
    loan: { head: 'Í útláni', pill: (n: number) => `${n} í biðstöðu` },
  } as const;
</script>

{#if books.length > 0}
  <div class={`section-head section-${kind === 'avail' ? 'avail' : 'loan'}`}>
    <span class="label">{labels[kind].head}</span>
    <span class="pill">{labels[kind].pill(books.length)}</span>
  </div>
  {#each books as book (book.mmsId)}
    <ResultRow {book} {kind} />
  {/each}
{/if}
