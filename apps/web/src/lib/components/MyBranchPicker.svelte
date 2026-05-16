<script lang="ts">
  import { myBranch, setMyBranch } from '$lib/stores';
  import { BRANCHES } from '$lib/branches';

  let open = $state(false);
  const selected = $derived($myBranch);

  function pick(name: string) {
    setMyBranch(name);
    open = false;
  }

  function openDialog() {
    open = true;
    setTimeout(() => {
      document.querySelector('[role="dialog"]')?.focus();
    }, 0);
  }

  function closeDialog() {
    open = false;
    setTimeout(() => {
      (document.querySelector('.scope') as HTMLElement | null)?.focus();
    }, 0);
  }
</script>

<button class="scope" onclick={openDialog} aria-haspopup="dialog" aria-expanded={open}>
  <span class="scope-dot"></span>
  <span>{selected ?? 'Veldu safn'}</span>
  <svg class="scope-caret" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</button>

{#if open}
  <div
    role="dialog"
    aria-label="Veldu þitt safn"
    aria-modal="true"
    tabindex="-1"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:50;display:flex;align-items:flex-end;"
    onclick={closeDialog}
    onkeydown={(e) => e.key === 'Escape' && closeDialog()}
  >
    <div
      style="background:var(--bg);width:100%;border-radius:18px 18px 0 0;padding:18px 16px 28px;"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div style="font-size:13px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin-bottom:10px;">Veldu þitt safn</div>
      {#each BRANCHES as name (name)}
        <button
          style="display:block;width:100%;text-align:left;padding:14px 8px;border-bottom:1px solid var(--hairline);font-size:15px;"
          onclick={() => pick(name)}
          aria-current={selected === name ? 'true' : undefined}
        >
          {name}
        </button>
      {/each}
    </div>
  </div>
{/if}
