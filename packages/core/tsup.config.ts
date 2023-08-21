import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'index.ts',
    './cli/index.ts',
    'loader.ts',
  ],
  outDir: 'dist',
  format: 'esm',
  splitting: false,
  clean: true,
});