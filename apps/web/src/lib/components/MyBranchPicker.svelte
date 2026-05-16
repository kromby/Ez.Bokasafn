<script lang="ts">
  import { myBranch, setMyBranch } from '$lib/stores';
  import { BRANCHES } from '$lib/branches';

  let open = $state(false);
  let triggerEl: HTMLButtonElement | undefined = $state();
  let dialogEl: HTMLDivElement | undefined = $state();
  const selected = $derived($myBranch);

  function pick(name: string) {
    setMyBranch(name);
    open = false;
  }

  function openDialog() {
    open = true;
    setTimeout(() => dialogEl?.focus(), 0);
  }

  function closeDialog() {
    open = false;
    setTimeout(() => triggerEl?.focus(), 0);
  }

  function onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) closeDialog();
  }
</script>

<button class="scope" bind:this={triggerEl} onclick={openDialog} aria-haspopup="dialog" aria-expanded={open}>
  <span class="scope-dot"></span>
  <span>{selected ?? 'Veldu þitt bókasafn'}</span>
  <svg class="scope-caret" viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</button>

{#if open}
  <div
    bind:this={dialogEl}
    role="dialog"
    aria-label="Veldu þitt bókasafn"
    aria-modal="true"
    tabindex="-1"
    style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:50;display:flex;align-items:flex-end;"
    onclick={onBackdropClick}
    onkeydown={(e) => e.key === 'Escape' && closeDialog()}
  >
    <div style="background:var(--bg);width:100%;border-radius:18px 18px 0 0;padding:18px 16px 28px;">
      <div style="font-size:13px;color:var(--ink-3);text-transform:uppercase;letter-spacing:0.08em;font-weight:600;margin-bottom:10px;">Veldu þitt bókasafn</div>
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
