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
