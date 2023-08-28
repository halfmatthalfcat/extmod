import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "react.tsx", "react-2.tsx"],
  outDir: "out",
  format: ["esm", "cjs"],
  splitting: false,
  external: ['react'],
  target: 'esnext'
});
