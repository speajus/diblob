import { resolve } from 'node:path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // Some dependencies (for example @xyflow/svelte) reference `process.env.NODE_ENV`
  // in their browser bundles. Vite does not polyfill the Node `process` global
  // by default, so we inline a value at build time to avoid runtime ReferenceError.
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  build: {
    lib: {
		      entry: resolve(__dirname, 'index.html'),
      name: 'DiblobVisualizer',
      fileName: 'index',
      formats: ['es'],
    },
    outDir:"dist/svelte",
    // rollupOptions: {
    //   external: ['svelte', '@speajus/diblob', '@xyflow/svelte'],
    //   output: {
    //     globals: {
    //       svelte: 'Svelte',
    //     },
    //   },
    // },
  },
})
