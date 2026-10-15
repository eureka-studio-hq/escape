import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2020',
    treeshake: true,
  },
  {
    entry: { escape: 'src/index.ts' },
    format: ['iife'],
    globalName: 'Escape',
    outExtension: () => ({ js: '.global.js' }),
    minify: true,
    sourcemap: true,
    target: 'es2020',
  },
]);
