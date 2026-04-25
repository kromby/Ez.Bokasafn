<script lang="ts">
  import { libraryScope, setLibraryScope } from '$lib/stores.js';
  import { LIBRARY_SCOPES } from '$lib/scopes.js';

  let open = $state(false);
  const selected = $derived($libraryScope);

  function pick(scope: { code: string; label: string }) {
    setLibraryScope(scope);
    open = false;
  }
</script>

<button class="scope" onclick={() => (open = true)} aria-haspopup="dialog">
  <span class="scope-dot"></span>
  <span>{selected?.label ?? 'Veldu safn'}</span>
  <svg class="scope-caret" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</button>

{#if open}
  <div
    role="dialog"
    aria-label="Veldu safn"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:50;display:flex;align-items:flex-end;"
    onclick={() => (open = false)}
  >
    <div
      style="background:var(--bg);width:100%;border-radius:18px 18px 0 0;padding:18px 16px 28px;"
      onclick={(e) => e.stopPropagation()}
    >
      <div style="font-size:13px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin-bottom:10px;">Veldu safn</div>
      {#each LIBRARY_SCOPES as scope}
        <button
          style="display:block;width:100%;text-align:left;padding:14px 8px;border-bottom:1px solid var(--hairline);font-size:15px;"
          onclick={() => pick(scope)}
        >
          {scope.label}
        </button>
      {/each}
    </div>
  </div>
{/if}
