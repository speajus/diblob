import { resolve } from 'node:path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      name: 'DiblobVisualizer',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['svelte', '@speajus/diblob', '@xyflow/svelte'],
      output: {
        globals: {
          svelte: 'Svelte',
        },
      },
    },
  },
})
