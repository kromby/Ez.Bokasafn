<script lang="ts">
  let {
    sources,
    title,
    author,
    large = false,
  }: { sources: string[]; title: string; author?: string; large?: boolean } = $props();

  let attempt = $state(0);
  const exhausted = $derived(attempt >= sources.length);

  // Stable per-author palette
  const PALETTES = [
    { bg: 'linear-gradient(155deg,#1a3a3f 0%,#0a1f24 100%)', accent: '#d4a574' },
    { bg: 'linear-gradient(165deg,#c5413d 0%,#7a1f1c 100%)', accent: '#f4e6c8' },
    { bg: 'linear-gradient(180deg,#2a2630 0%,#0d0c12 100%)', accent: '#a8c5d8' },
    { bg: 'linear-gradient(170deg,#3a4a3d 0%,#1a2520 100%)', accent: '#d8c896' },
    { bg: 'linear-gradient(160deg,#e8d4b0 0%,#b89968 100%)', accent: '#3a2818' },
    { bg: 'linear-gradient(170deg,#4a3a5e 0%,#251c2f 100%)', accent: '#e8c878' },
    { bg: 'linear-gradient(150deg,#7a8a6e 0%,#3e4a38 100%)', accent: '#f0e8d0' },
    { bg: 'linear-gradient(165deg,#b85c2a 0%,#6a2e10 100%)', accent: '#f4ddc0' },
    { bg: 'linear-gradient(180deg,#1a2438 0%,#0a0f1c 100%)', accent: '#c8b890' },
    { bg: 'linear-gradient(160deg,#8a3838 0%,#4a1818 100%)', accent: '#e8d8b8' },
  ];
  function hashIndex(s: string, mod: number): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h) % mod;
  }
  const palette = $derived(PALETTES[hashIndex(author ?? title, PALETTES.length)]!);
</script>

{#if !exhausted}
  <div class={large ? 'cover cover-lg' : 'cover'}>
    <img
      src={sources[attempt]}
      alt={title}
      loading="lazy"
      style="width:100%;height:100%;object-fit:cover;display:block"
      onerror={() => (attempt += 1)}
    />
  </div>
{:else}
  <div class={large ? 'cover cover-lg' : 'cover'}>
    <div class="cover-art" style:background={palette.bg}>
      {#if author}
        <div class="cover-art-author" style:color={palette.accent}>{author.toUpperCase()}</div>
      {/if}
      <div class="cover-art-title" style:color={palette.accent}>{title}</div>
    </div>
  </div>
{/if}
