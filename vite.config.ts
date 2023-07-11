import { defineConfig } from 'vite'
import { builtinModules } from 'module'
import path from 'path'

module.exports = defineConfig({
  base: './',
  build: {
    target: 'node16',
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'sqlite-migrator',
      formats: ['cjs', 'es'],
      fileName: (format) =>
        ({ es: 'index.mjs', cjs: 'index.cjs' })[format as 'es' | 'cjs'],
    },
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true,
    rollupOptions: {
      external: builtinModules,
    },
  },
})
