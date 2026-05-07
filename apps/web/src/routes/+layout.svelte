<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { maybeInjectCfWebAnalytics } from '$lib/analytics.js';
  let { children } = $props();
  onMount(() => maybeInjectCfWebAnalytics());
</script>

<svelte:head>
  <title>Finna bók</title>
</svelte:head>

<div class="app">
  {@render children()}
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
</style>
