<script lang="ts">
  import LibraryScopePicker from './LibraryScopePicker.svelte';

  let { value, total }: { value: string; total?: number } = $props();
</script>

<div class="head">
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <LibraryScopePicker />
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
