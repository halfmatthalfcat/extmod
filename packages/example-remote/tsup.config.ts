import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts", "react.tsx"],
  outDir: "out",
  format: ["esm", "cjs"],
  splitting: false,
  external: ['react']
});
