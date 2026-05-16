<script lang="ts">
  import type { BranchAvailability } from '@ez-bokasafn/types';
  let { branches, pinned }: { branches: BranchAvailability[]; pinned?: BranchAvailability } = $props();
  const onShelf = $derived(branches.filter((b) => b.status === 'on-shelf').length);
  const sortedBranches = $derived(
    [...branches].sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === 'on-shelf' ? -1 : 1;
    })
  );
</script>

{#if pinned}
  <div class="pinned-card">
    <div class="pinned-eyebrow">Bókasafnið mitt</div>
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

{#if branches.length > 0}
  <div class="branch-table">
    <div class="branch-table-head">
      <span>Önnur bókasöfn</span>
      <span class="count">{branches.length} söfn · {onShelf} á hillunni</span>
    </div>
    {#each sortedBranches as b (b.branch)}
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
{/if}

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
