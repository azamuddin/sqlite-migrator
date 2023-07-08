/// <reference types="vite" />
import path from 'path';
import {defineConfig} from 'vite';

module.exports = defineConfig({
  base: './',
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.ts'),
      name: 'sqlite-migrator',
      formats: ['es', 'cjs'],
      fileName: format =>
        ({es: 'index.mjs', cjs: 'index.cjs'}[format as 'es' | 'cjs']),
    },
    outDir: path.resolve(__dirname, './dist'),
  },
});
