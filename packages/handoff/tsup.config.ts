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
    external: ['@eureka-studio/escape'],
  },
  {
    entry: { 'escape-handoff': 'src/index.ts' },
    format: ['iife'],
    globalName: 'EscapeHandoff',
    outExtension: () => ({ js: '.global.js' }),
    minify: true,
    sourcemap: true,
    target: 'es2020',
    noExternal: ['@eureka-studio/escape'],
  },
]);
