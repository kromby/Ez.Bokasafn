<script>
  import { dev } from '$app/environment';
</script>

<svelte:head>
  <title>Finna bók</title>
</svelte:head>

<div class="app">
  <slot />
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
