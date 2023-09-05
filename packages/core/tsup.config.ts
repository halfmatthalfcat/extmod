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
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".mjs" : `.js`,
      };
    },
  },
  {
    entry: ["extmod_mgr.ts"],
    outDir: "dist",
    format: ["iife"],
    target: "esnext",
    splitting: false,
    minify: true,
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".mjs" : `.js`,
      };
    },
  },
]);
