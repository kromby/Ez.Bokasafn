import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html', // SPA fallback
      precompress: false,
      strict: false,
    }),
    prerender: { entries: [] },
    alias: {
      '@ez-bokasafn/types': '../../packages/types/src/index.ts',
    },
  },
};
