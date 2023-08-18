import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'index.ts',
    'cli.ts',
    'loader.ts',
  ],
  outDir: 'dist',
  format: 'esm',
  splitting: false,
  clean: true,
  noExternal: [/./],
});