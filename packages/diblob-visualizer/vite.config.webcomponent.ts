import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true,
      },
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/web-component/index.ts'),
      name: 'DiblobVisualizerWebComponent',
      fileName: 'web-component',
      formats: ['es', 'umd'],
    },
    outDir: 'dist/web-component',
    rollupOptions: {
      external: [],
      output: {
        // Inline all dependencies for standalone web component
        inlineDynamicImports: true,
      },
    },
  },
})

