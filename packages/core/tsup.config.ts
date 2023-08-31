import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["index.ts", "./loader/index.ts", "./cli/index.ts"],
    outDir: "dist",
    format: ["esm"],
    target: "esnext",
    splitting: false,
    clean: true,
    external: ['esbuild'],
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".mjs" : `.${format}`,
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
        js: format === "esm" ? ".mjs" : `.${format}`,
      };
    },
  },
]);
