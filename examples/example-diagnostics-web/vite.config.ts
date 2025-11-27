import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// Vite configuration for the diagnostics web example
export default defineConfig({
  plugins: [svelte()],
});
