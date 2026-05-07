<script>
  import type { BranchAvailability } from '@ez-bokasafn/types';
  let { branches }: { branches: BranchAvailability[] } = $props();
  const onShelf = $derived(branches.filter((b) => b.status === 'on-shelf').length);
</script>

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
