import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', cloudflare: 'src/cloudflare.ts', upstash: 'src/upstash.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
});
