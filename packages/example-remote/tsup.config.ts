import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  outDir: 'out',
  format: ['esm', 'cjs'],
});