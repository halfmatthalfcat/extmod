import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["index.ts", "./loader/index.ts", "./cli/index.ts"],
    outDir: "dist",
    format: ["esm"],
    target: "esnext",
    splitting: false,
    external: ["esbuild"],
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".mjs" : `.js`,
      };
    },
  },
  {
    entry: ["index.ts"],
    outDir: "dist",
    format: ["esm"],
    target: "esnext",
    splitting: false,
    dts: true,
  },
  {
    entry: ["./client/index.ts"],
    outDir: "dist/client",
    format: ["esm"],
    target: "esnext",
    splitting: false,
    treeshake: false,
    dts: true,
    external: ["react"],
  },
]);
