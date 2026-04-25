<script lang="ts">
  let { onShare }: { onShare: () => void } = $props();

  function back() {
    if (history.length > 1) history.back();
    else location.href = '/';
  }
</script>

<div class="appbar">
  <button class="iconbtn" aria-label="Til baka" on:click={back}>
    <svg viewBox="0 0 17 17" fill="none">
      <path d="M10.5 3.5L5 8.5L10.5 13.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
  <button class="iconbtn" aria-label="Deila" on:click={onShare}>
    <svg viewBox="0 0 17 17" fill="none">
      <path d="M8.5 11V2.5M8.5 2.5L5.5 5.5M8.5 2.5L11.5 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M3.5 9.5V13.5C3.5 14.05 3.95 14.5 4.5 14.5H12.5C13.05 14.5 13.5 14.05 13.5 13.5V9.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
    </svg>
  </button>
</div>

<style>
  .appbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border-light);
  }

  .iconbtn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: var(--ink);
    transition: background-color 0.2s;
  }

  .iconbtn:active {
    background-color: var(--bg-2);
  }

  .iconbtn svg {
    width: 20px;
    height: 20px;
  }
</style>
