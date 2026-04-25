import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    extensions: ['.js', '.ts', '.svelte'],
  },
});
