<script>
  import { goto } from '$app/navigation';
  import MyBranchPicker from '$lib/components/MyBranchPicker.svelte';

  let q = '';

  function submit(e) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    goto(`/search?q=${encodeURIComponent(trimmed)}`);
  }
</script>

<svelte:head><title>Finna bók</title></svelte:head>

<div class="home" style="display:flex;flex-direction:column;min-height:100dvh;padding:0 24px;">
  <div style="padding-top:12px;display:flex;justify-content:flex-start;">
    <MyBranchPicker />
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px;padding-bottom:60px;">
    <div>
      <h1 class="wordmark">
        <span class="l1">Finna</span>
        <span class="l2"><span class="underline">bók</span></span>
      </h1>
      <p class="tagline">Á hvaða safni er hún til, og er hún á hillunni núna?</p>
    </div>

    <form onsubmit={submit}>
      <label class="search">
        <svg class="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6" />
          <path d="M14 14L17.5 17.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <input
          type="search"
          placeholder="Leita að bók, höfundi…"
          bind:value={q}
          autocomplete="off"
          enterkeyhint="search"
        />
      </label>
    </form>
  </div>
</div>
